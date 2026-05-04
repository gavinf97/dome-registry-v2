# DOME Registry V2

A full-stack, Dockerised ML annotation registry. Researchers submit machine learning papers; an AI Copilot auto-fills a structured annotation form guided by the [DOME checklist](https://dome-ml.org) (Data, Optimisation, Model, Evaluation). The registry stores structured JSON annotations alongside full provenance metadata.

---

## Attribution

This project is a ground-up reimplementation built on the foundations established by:

- **DOME Registry V1** — [BioComputingUP/dome-registry](https://github.com/BioComputingUP/dome-registry)  
  Original registry concept, DOME schema design, and annotation framework.
- **DOME Copilot** — [IFCA-Advanced-Computing/dome-copilot](https://github.com/IFCA-Advanced-Computing/dome-copilot)  
  Original LLM-assisted annotation pipeline and PDF extraction logic.

V2 extends these with a new schema (v2), versioned entries, moderation workflows, ORCID authentication, a schema-driven Angular form, a NestJS REST API, and a FastAPI copilot microservice.

---

## Architecture

Four services in a Docker Compose monorepo:

| Service | Directory | Stack | Role |
|---------|-----------|-------|------|
| Backend API | `backend/` | NestJS (Node.js / TypeScript) | Auth, CRUD, scoring, versioning, proxy to Copilot |
| Frontend | `frontend/` | Angular 17 | ORCID login, PDF upload, schema-driven form, search |
| Copilot | `copilot/` | Python FastAPI | LLM microservice: PDF → structured DOME annotation |
| Database | (Docker only) | MongoDB 7 | Persistent store with JSON Schema validation |

**Docker networks:**
- `public-net` — nginx + frontend + backend (ports 80/443 exposed)
- `copilot-net` — backend + copilot + Ollama only (no public ports)
- `db-net` — backend + MongoDB only

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) ≥ 24
- [Docker Compose](https://docs.docker.com/compose/) V2 (`docker compose` or `docker-compose`)
- 8 GB RAM recommended (Ollama + Gemma 4B model)

---

## Run Commands

| Mode | Command |
|------|---------|
| **Dev (first run / after changes)** | `docker compose -f docker-compose.dev.yml up --build` |
| **Dev (subsequent runs, no rebuild)** | `docker compose -f docker-compose.dev.yml up` |
| **Stop dev stack** | `docker compose -f docker-compose.dev.yml down` |
| **Wipe volumes (destructive)** | `docker compose -f docker-compose.dev.yml down -v` |
| **Production (first run / after changes)** | `docker compose up --build` |
| **Production (subsequent runs)** | `docker compose up` |

---

## Quick Start (Local Dev)

### 1. Clone the repo

```bash
git clone https://github.com/gavinf97/dome-registry-v2.git
cd dome-registry-v2
```

### 2. Create `.env`

```bash
cp .env.example .env
```

Minimum changes required in `.env`:

```ini
JWT_SECRET=any-long-random-string-at-least-32-chars

# ORCID (optional for dev — see Dev Login below)
ORCID_CLIENT_ID=APP-XXXXXXXXXXXXXXXX
ORCID_CLIENT_SECRET=your-secret
ORCID_REDIRECT_URI=http://localhost:4200/auth/orcid/callback
ORCID_BASE_URL=https://sandbox.orcid.org
ORCID_PUB_URL=https://pub.sandbox.orcid.org

FRONTEND_URL=http://localhost:4200
LLM_MODE=local
OLLAMA_MODEL=gemma3:4b
```

### 3. Start the stack

```bash
docker-compose -f docker-compose.dev.yml up --build
```

First run downloads the Gemma 4B model (~2.5 GB) via Ollama — allow 15–20 minutes.

### 4. Open the app

| URL | Service |
|-----|---------|
| `http://localhost:4200` | Angular frontend |
| `http://localhost:3000` | NestJS API (direct) |
| `http://localhost:8081` | Mongo Express — DB browser (`admin` / `devpassword`) |

### 5. Log in

In the navbar, click **Dev Login** (yellow button) — instant login, no ORCID account needed for local development. The ORCID login button is also present for when you have sandbox credentials configured.

> **Dev Login is permanently blocked in production** (`NODE_ENV=production` → HTTP 403).

---

## ORCID Authentication (optional for local dev)

To test real ORCID login:

1. Create a test account at [sandbox.orcid.org](https://sandbox.orcid.org/register)
2. Go to **Developer Tools** → register an app
3. Set redirect URI: `http://localhost:4200/auth/orcid/callback`
4. Copy Client ID and Client Secret into `.env`

For production, register on [orcid.org](https://orcid.org/developer-tools) with an HTTPS redirect URI.

---

## Production Deployment

```bash
cp .env.example .env
# Fill in production values (HTTPS URIs, real ORCID credentials, SMTP, LLM API key)

docker-compose up --build
```

Production uses nginx on ports 80/443. Place TLS certificates in `docker/nginx/certs/`.

### LLM in production

Set `LLM_MODE=api` in `.env` and configure:

```ini
LLM_ENDPOINT=https://your-openai-compatible-endpoint
LLM_CHAT=your-model-name
OPENAI_API_KEY=sk-...
```

---

## Environment Variables

See [`.env.example`](.env.example) for the full reference. Key variables:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `ORCID_CLIENT_ID` / `ORCID_CLIENT_SECRET` | ORCID OAuth app credentials |
| `ORCID_BASE_URL` | `https://orcid.org` or `https://sandbox.orcid.org` |
| `FRONTEND_URL` | Base URL of the Angular app (used for CORS + redirects) |
| `LLM_MODE` | `local` (Ollama) or `api` (OpenAI-compatible endpoint) |
| `OLLAMA_MODEL` | Ollama model name, e.g. `gemma3:4b` |
| `LLM_DAILY_QUOTA` | Max Copilot calls per ORCID user per day (default: 5) |
| `SMTP_HOST` / `SMTP_PASS` | Email credentials for notification emails |

---

## Project Structure

```
dome-registry-v2/
├── schema/
│   ├── dome-registry-schema.v2.json      ← DOME entry source of truth
│   ├── dome-registry-user-schema.v2.json ← user document schema
│   ├── scoring-weights.json              ← field path → compliance weight map
│   └── notDefinedValues.json             ← null-equivalent string list
├── backend/                              ← NestJS API
│   └── src/
│       ├── auth/                         ← ORCID OAuth, JWT, guards
│       ├── registry/                     ← CRUD, versioning, scoring
│       ├── copilot/                      ← proxy to Copilot service
│       ├── moderation/                   ← state machine, journal queues
│       ├── scoring/                      ← schema-driven score calculation
│       ├── mail/                         ← Nodemailer + Handlebars templates
│       ├── models/                       ← Mongoose documents
│       └── schemas/                      ← generated TS interfaces (do not edit)
├── frontend/                             ← Angular 17 app
│   └── src/app/
│       ├── auth/                         ← ORCID login flow, JWT storage
│       ├── pages/                        ← search, editor, upload, admin, etc.
│       ├── shared/                       ← schema-driven form components
│       └── services/                     ← schema, scoring, registry API
├── copilot/                              ← Python FastAPI LLM service
│   └── app/
│       ├── main.py                       ← POST /process endpoint
│       └── llm_adapter.py               ← Ollama / API mode switcher
└── docker/
    ├── nginx/nginx.conf
    └── mongo/init/01-init.js             ← collection setup + indexes
```

---

## Schema

`schema/dome-registry-schema.v2.json` is the single source of truth for the entire system. It drives:
- MongoDB `$jsonSchema` collection validation
- TypeScript interfaces (backend + frontend)
- Angular form generation (schema-driven, no hardcoded fields)
- Compliance scoring via `scoring-weights.json`
- Copilot annotation structure

The DOME section hierarchy is: **publication · data · optimization · model · evaluation**, each with subsections and leaf fields tagged with `x-complianceLevel: REQUIREMENT | RECOMMENDATION`.

---

## Data Storage

MongoDB data is stored in a Docker named volume (`mongo-data`) on the host machine — it is **not** in the git repository and persists across container restarts and rebuilds.

**Backup:**
```bash
docker exec dome-registry-v2-mongodb-1 mongodump --out /backup
docker cp dome-registry-v2-mongodb-1:/backup ./mongo-backup
```

**Wipe and reset (destructive):**
```bash
docker-compose -f docker-compose.dev.yml down -v
```

---

## Security Notes

- PDFs never touch disk — processed in memory only (`multer memoryStorage`)
- Copilot service has no public port — reachable only from backend via internal Docker network
- JWTs are short-lived (1 h), HTTPS-only in production via nginx
- `helmet.js` enabled on NestJS; CORS restricted to `FRONTEND_URL`
- MongoDB uses `$jsonSchema` validation at collection level
- All DTOs validated with `class-validator`

---

## License

This work is licensed under the [Creative Commons Attribution 4.0 International License (CC BY 4.0)](LICENSE.md).

You are free to share and adapt this material for any purpose, provided appropriate credit is given, a link to the licence is included, and any changes are indicated.

