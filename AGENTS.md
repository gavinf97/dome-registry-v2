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

## Frontend Style Guide

All UI work **must** use these values. Never hardcode one-off colours or fonts — derive from the SCSS variables in `frontend/src/styles/_variables.scss`.

### Brand Colours

| Token | Hex | Bootstrap role | Usage |
|---|---|---|---|
| `$primary` | `#003958` | `--bs-primary` | Navbar, footer, section borders, `.btn-primary`, badges |
| `$secondary` | `#F66729` | `--bs-secondary` | Active nav links, `.btn-secondary`, warning callouts, form invalid feedback |
| `$orcid-green` | `#9cce50` | — | `.btn-orcid`, `.orcid-text`, ORCID login button only |
| `$navbar-bg` | `#0D3144` | — | Darker variant for deep-shadow effects |
| `$color-cyan` | `#00F5FB` | — | Accent highlights only |
| `$color-link` | `#4a90e2` | — | Inline hyperlinks |
| `danger` | `#dc3545` | `--bs-danger` | Logout, destructive actions |

**Gradient** (navbar + footer): `linear-gradient(90deg, shift-color($primary, 60%), $primary)`
— Applied via `.bg-primary.bg-gradient`.

### Typography

| Property | Value |
|---|---|
| Font family | `Inter, sans-serif` (loaded from Google Fonts in `index.html`) |
| Body weight | 400 |
| Nav/label weight | 500 |
| Headings | 700 |

Never use `'Segoe UI'`, `system-ui`, or any other font family.

### Spacing & Layout

| Token | Value | Usage |
|---|---|---|
| `$navbar-height` | `75px` | Top nav height |
| `$nav-width` | `250px` | Sidebar width (desktop) |
| App shell outer | `d-flex flex-column flex-nowrap vw-100 vh-100` | Full-viewport flex column — header + scrollable main + footer |
| Content padding | Bootstrap container/container-fluid | Never custom px values on page containers |

### Component Classes

| Class | Purpose |
|---|---|
| `.btn-orcid` | ORCID-green filled button (ORCID login only) |
| `.btn-outline-orcid` | ORCID-green outline button |
| `.logo-sm` | `2rem × 2rem` inline SVG logo (SVG `<img>` tag) |
| `.logo-lg` | `8rem × 8rem` inline SVG logo |
| `.dome-section-card` | 4px `$primary` left border card for DOME schema sections |
| `.badge-requirement` | `$primary` bg — DOME REQUIREMENT level fields |
| `.badge-recommendation` | `$secondary` bg — DOME RECOMMENDATION level fields |
| `.ai-banner` | Purple→blue gradient banner for AI-generated entry warnings |
| `.drop-zone` | Dashed-border file drop area (PDF upload) |
| `.score-sidebar` | Sticky score preview sidebar |
| `.progress.progress-gradient` | DOME score bar: red→teal gradient, white remaining |
| `.fade-in` | 0.6s opacity fade-in animation |
| `.slow` | Force 1.2s animation duration |
| `.delay-1` … `.delay-4` | Stagger animation delay (0.1s steps) |

### Assets

All brand SVGs live in `frontend/src/assets/`:

| File | Use |
|---|---|
| `logo-white-static.svg` | Navbar brand (on dark/teal background) |
| `logo-blue-static.svg` | Light-background contexts |
| `elixir.svg` | Footer "Supported by ELIXIR" |
| `orcid.svg` | ORCID login button icon |

### Rules for Contributors

1. **SCSS variables only** — never write raw hex codes in component templates or SCSS. Use `$primary`, `$secondary`, etc., or the transparent-white palette (`$color-white-10` … `$color-white-90`).
2. **Bootstrap SCSS source** is compiled from `_theme.scss` — do not add `bootstrap.min.css` back to `angular.json`. The precompiled CSS won't pick up variable overrides.
3. **Icons** — use Bootstrap Icons (`bi bi-*` classes) for all iconography. Do not add Font Awesome or other icon libraries.
4. **No inline styles** in Angular templates except for SVG sizing on the ORCID/Elixir `<img>` tags.
5. **Page title** is `DOME Registry` — do not rename.

## Reference Repos (read-only reference, do not modify)

- V1 Registry: https://github.com/BioComputingUP/dome-registry
- V1 Copilot: https://github.com/IFCA-Advanced-Computing/dome-copilot
