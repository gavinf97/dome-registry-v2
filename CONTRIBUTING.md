# Contributing to DOME Registry V2

Thank you for your interest in contributing. This project is a research tool for the bioinformatics and machine learning communities. Contributions of all kinds are welcome.

## Ways to Contribute

- **Bug reports** — open an issue describing the problem, expected behaviour, and steps to reproduce
- **Feature requests** — open an issue labelled `enhancement` with a clear use-case
- **Code contributions** — bug fixes, new features, performance improvements
- **Schema improvements** — proposals to extend or revise the DOME annotation schema
- **Documentation** — corrections, clarifications, translations

---

## Reporting Bugs

Before reporting a bug, please:
1. Check existing [issues](https://github.com/gavinf97/dome-registry-v2/issues) to avoid duplicates
2. Confirm the bug is reproducible on a clean `docker-compose -f docker-compose.dev.yml up --build`

When filing an issue include:
- OS and Docker version
- The service that is failing (backend / frontend / copilot / MongoDB)
- Relevant log output (`docker logs <container>`)
- Steps to reproduce

---

## Development Setup

See the [README](README.md) for the full local dev setup. In brief:

```bash
cp .env.example .env   # fill in secrets
docker-compose -f docker-compose.dev.yml up --build
```

Hot-reload is enabled for all services in dev mode. Mongo Express is available at `http://localhost:8081`.

---

## Branch and Commit Conventions

- Branch from `main`, name your branch `feat/<topic>` or `fix/<topic>`
- Commits should follow [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat: ...` for new features
  - `fix: ...` for bug fixes
  - `docs: ...` for documentation only
  - `refactor: ...` for code changes that neither fix a bug nor add a feature
  - `chore: ...` for tooling, dependencies, CI
- Keep commits focused — one logical change per commit

---

## Code Style

| Service | Style |
|---------|-------|
| Backend (NestJS) | TypeScript strict mode; `class-validator` on all DTOs; no raw query strings |
| Frontend (Angular) | Angular style guide; schema-driven form components only (no hardcoded fields) |
| Copilot (FastAPI) | PEP 8; async handlers; no file persistence for PDFs |

Run the existing build checks before submitting:

```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npx ng build --configuration development

# Copilot (linting)
cd copilot && python -m py_compile app/main.py app/llm_adapter.py
```

---

## Schema Changes

The canonical schema at `schema/dome-registry-schema.v2.json` drives the entire system (form, scoring, MongoDB validation, TypeScript interfaces). Any proposed schema change must:
1. Be justified against the DOME recommendations ([doi:10.1093/gigascience/giae094](https://doi.org/10.1093/gigascience/giae094))
2. Update `scoring-weights.json` if new fields are added
3. Be discussed in an issue before a PR is opened

---

## Pull Requests

1. Fork the repository and create a branch from `main`
2. Make your changes, following the code style above
3. Confirm both builds pass (backend and frontend)
4. Open a PR against `main` with a clear description of the change and motivation
5. Reference any related issues (`Closes #123`)

PRs that introduce new dependencies should justify their inclusion.

---

## Security

Please **do not** open public issues for security vulnerabilities. Email the maintainer directly at the address in the GitHub profile. See also the [OWASP Top 10](https://owasp.org/www-project-top-ten/) checklist applied in this codebase.

---

## Licence

By contributing you agree that your contributions will be licensed under the [CC BY 4.0 licence](LICENSE.md) that covers this project.
