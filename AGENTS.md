# DOME Registry V2 — Agent Instructions

## Project Overview

A full-stack, Dockerized ML annotation registry. Researchers submit machine learning papers; an AI Copilot auto-fills a structured annotation form guided by the DOME checklist (Data, Optimization, Model, Evaluation). The registry stores these structured JSON annotations alongside provenance metadata.

## Architecture — Four Services (Monorepo)

| Service | Directory | Stack | Role |
|---------|-----------|-------|------|
| Backend API | `backend/` | NestJS (Node.js/TypeScript) | Central orchestrator: auth, CRUD, scoring, moderation, proxy to Copilot |
| Frontend | `frontend/` | Angular (TypeScript) | UI: ORCID login, PDF upload, schema-driven form editor, search |
| Copilot | `copilot/` | Python FastAPI | LLM microservice: PDF → structured DOME annotation |
| Database | (Docker only) | MongoDB 7 | Persistent store; JSON Schema validation enforced at collection level |

**Docker networks:**
- `public-net`: nginx/frontend + backend (ports 80/443 exposed)
- `copilot-net`: backend + copilot + ollama ONLY — no public ports on copilot or ollama
- `db-net`: backend + mongodb

## Canonical Source of Truth

`schema/dome-registry-schema.v2.json` governs the entire system. **Never hardcode field names or section names — always derive from schema.**

| Consumer | How it uses the schema |
|---|---|
| Backend (Mongoose) | `$jsonSchema` validator on MongoDB collection |
| Backend (TypeScript) | Interfaces generated via `json-schema-to-typescript` → `backend/src/schemas/` |
| Backend (Scoring) | `schema/scoring-weights.json` maps leaf paths to weights |
| Frontend (TypeScript) | Same interfaces duplicated into `frontend/src/app/models/` (no shared npm package) |
| Frontend (Form) | Schema-driven form generator reads JSON Schema at runtime |
| Copilot | Prompt structure follows schema sections |

`schema/dome-registry-user-schema.v2.json` governs user documents. ORCID iD is the primary key throughout.

## Schema V2 — Section Map

```
publication     title, authors, journal, year, doi, pmid, pmcid, tags
data
  provenance        datasetSource, pointsPerClass, regressionPoints, previouslyUsed
  dataSplits        trainTestPoints, validationUsed, validationSize, distributionsDifferent, distributionsPlotted
  redundancy        splitMethod, setsIndependent, independenceEnforcement, distributionComparison
  availability      isDataPublic, dataUrl, dataLicence
optimization
  algorithm         algorithmClass, isAlgorithmNew, newAlgorithmJustification
  metaPredictions   usesMetaPredictions, metaPredictionAlgorithms, metaPredictorIndependence
  encoding          dataEncodingMethod
  parameters        numberOfParameters, parameterSelectionMethod
  features          numberOfFeatures, featureSelectionPerformed, featureSelectionTrainingOnly
  fitting           parametersExceedData, overfittingPrevention, underfittingPrevention
  regularization    regularizationUsed, regularizationTechniques
  configAvailability configReported, configUrl, configLicence
model
  interpretability  interpretabilityType, interpretabilityExamples, xaiMethods
  output            outputType, targetVariable
  execution         trainingTime, inferenceTime, hardwareUsed, energyConsumption
  softwareAvailability sourceCodeReleased, executableReleased, softwareUrl, softwareLicence
evaluation
  method            evaluationMethod
  performanceMeasures performanceMetrics, metricsRepresentative
  comparison        comparisonPublicMethods, comparisonBaselines, comparedToolsAndBaselines
  confidence        hasConfidenceIntervals, statisticallySignificant, confidenceNumericalValues
  evaluationAvailability rawFilesAvailable, rawFilesUrl, rawFilesLicence
```

`x-complianceLevel: REQUIREMENT` = 1.0 pt, `RECOMMENDATION` = 0.5 pt.
Fields with `x-options-api` load dropdown options from an external API (EDAM ontology, SPDX licences).

## User Schema V2 — Key Design Decisions

- **ORCID is the primary key.** `RegistryDocument.user` and `VersionDocument.editedBy` store `orcid` string — not MongoDB `_id`. Provenance survives account deletion.
- **ORCID OAuth only.** No email/password auth. Email is optional (from ORCID scope, refreshed on login).
- **Roles are an array:** `["user","admin","journal_owner"]`. A user can hold multiple.
- **`journalAssignments[]`** links journal_owner role to specific journals.
- **PII fields** (`email`, `givenName`, `familyName`) never returned in public API responses.
- **`displayName` + `orcid`** are the only user attributes exposed publicly for entry attribution.

## Directory Structure

```
dome-registry-v2/
├── AGENTS.md
├── README.md
├── docker-compose.yml             ← production stack
├── docker-compose.dev.yml         ← dev stack (ollama, hot-reload, mongo-express)
├── .env.example
├── schema/
│   ├── dome-registry-schema.v2.json      ← DOME entry source of truth
│   ├── dome-registry-user-schema.v2.json ← user document source of truth
│   ├── scoring-weights.json              ← field path → weight map
│   └── notDefinedValues.json             ← invalid/null string list
├── backend/                       ← NestJS API (ported from dome-registry-ws)
│   ├── src/
│   │   ├── auth/                  ← ORCID OAuth, JWT, guards, rate limit
│   │   ├── registry/              ← CRUD, versioning, scoring proxy
│   │   ├── copilot/               ← proxy module (forward PDF to copilot service)
│   │   ├── moderation/            ← state machine, journal queues
│   │   ├── scoring/               ← ScoringService (schema-driven)
│   │   ├── mail/                  ← Nodemailer + Handlebars templates
│   │   ├── models/                ← Mongoose documents
│   │   └── schemas/               ← generated TS interfaces (DO NOT EDIT MANUALLY)
│   └── Dockerfile
├── frontend/                      ← Angular (ported from dome-registry-ui)
│   ├── src/app/
│   │   ├── auth/
│   │   ├── registry/              ← schema-driven form editor, entry detail, history
│   │   ├── upload/                ← PDF upload zone + Copilot flow
│   │   ├── search/                ← browse, filter, search
│   │   ├── admin/                 ← moderation panel, scoring weights, user roles
│   │   └── models/                ← generated TS interfaces (DO NOT EDIT MANUALLY)
│   └── Dockerfile
├── copilot/                       ← Python FastAPI (from dome-copilot)
│   ├── app/
│   │   ├── main.py                ← FastAPI app + POST /process
│   │   └── llm_adapter.py         ← LLM mode switcher (local Ollama / API)
│   ├── dome_copilot/              ← upstream RAG/inference logic
│   └── Dockerfile
└── docker/
    └── nginx/nginx.conf
```

## Backend Conventions (NestJS)

- NestJS module-per-feature structure
- Auth: ORCID OAuth 2.0 → stateless JWT. Guards: `JwtAuthGuard`, `RolesGuard`
- Roles: `user | admin | journal_owner`
- **PDF handling: `multer` `memoryStorage()` ONLY — never write PDFs to disk**
- Copilot calls: internal Docker network (`http://copilot:8000`); 120s timeout; discard buffer immediately after response
- Rate limiting: `@nestjs/throttler` global + per-ORCID daily LLM quota in MongoDB
- Moderation states: `draft → pending → public`, `pending → held (journal) → public | rejected`
- Every PATCH creates an immutable `VersionDocument` (history ledger)
- Scoring computed on every save via `ScoringService` using `schema/scoring-weights.json`
- Email: Nodemailer + Handlebars in `backend/src/mail/templates/`
- DTOs use class-validator for all input; helmet.js enabled; CORS restricted to frontend origin

## Frontend Conventions (Angular)

- **Form is schema-driven**: generated dynamically from `dome-registry-schema.v2.json` — never hardcode form fields
- Widget map: `string`→text input, `boolean`→toggle, `enum array`→multi-select chips, `uri array`→URL list, `integer`→numeric input
- Fields with `x-options-api` → lazy-load dropdown from that URL at runtime
- Show `x-complianceLevel` badge (REQUIREMENT / RECOMMENDATION) on each field
- Real-time score preview in sidebar (recalculate on field change)
- `isAiGenerated: true` entries must show a clear AI-generated banner
- No shared npm package with backend — interfaces are duplicated via codegen

## Copilot Conventions (Python / FastAPI)

- Only endpoint: `POST /process` — input `{ pdf_bytes: base64, doi: str|null, sections: list }` → `{ annotations: dict }`
- Annotation keys match schema paths, e.g. `"data/provenance/datasetSource"`
- `llm_adapter.py`: `LLM_MODE=local` → Ollama `http://ollama:11434/v1` (Gemma 4); `LLM_MODE=api` → `LLM_ENDPOINT` env var
- **No file persistence**: all PDF bytes processed in memory, discarded before returning
- No public-facing port — bound to `copilot-net` only

## Environment Variables (see `.env.example`)

```
MONGODB_URI, JWT_SECRET, JWT_EXPIRY
ORCID_CLIENT_ID, ORCID_CLIENT_SECRET, ORCID_REDIRECT_URI
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
LLM_MODE (local|api), LLM_ENDPOINT, LLM_CHAT, LLM_EMBEDDINGS, OPENAI_API_KEY
LLM_DAILY_QUOTA (default: 5)
FRONTEND_URL (for CORS + ORCID redirect)
```

## Build Commands

```bash
# Dev (local Gemma 4 via Ollama)
docker-compose -f docker-compose.dev.yml up --build

# Production
docker-compose up --build

# Validate JSON Schema
npx ajv-cli validate -s schema/dome-registry-schema.v2.json -d schema/example-entry.json

# Generate TS interfaces from schema
npx json-schema-to-typescript schema/dome-registry-schema.v2.json -o backend/src/schemas/review.d.ts
```

## Security

- PDFs never touch disk (multer memoryStorage only)
- Copilot in private Docker network, no public port
- JWT short-lived (1h), HTTPS only (nginx in production)
- helmet.js on NestJS, CORS restricted, class-validator on all DTOs
- MongoDB $jsonSchema validation on collections
- OWASP Top 10: parameterised queries via Mongoose, no raw query injection paths

## Reference Repos (read-only reference, do not modify)

- V1 Registry: https://github.com/BioComputingUP/dome-registry
- V1 Copilot: https://github.com/IFCA-Advanced-Computing/dome-copilot
