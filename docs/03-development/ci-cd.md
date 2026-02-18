# CI/CD (Continuous Integration / Deployment)

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Zespół deweloperski

---

Procesy automatyzacji: GitHub Actions dla CI, automatyczny deploy na Hetzner VPS via Docker Compose.

## 1. Filozofia

1. **Fail Fast**: Błędy (lint, testy, type check) wyłapywane na etapie PR — przed merge na `main`.
2. **Automatyzacja**: Formatowanie, testy, build, deploy — wszystko zautomatyzowane.
3. **Determinizm**: Docker images budowane w CI, identyczne lokalnie i na produkcji.
4. **Prostota**: GitHub Actions + SSH deploy. Bez Kubernetes, bez Terraform, bez ArgoCD.

---

## 2. Pipeline CI (Pull Request)

Dla każdego PR i pusha na `main` uruchamiany jest pipeline:

```
PR opened / push
    │
    ├──► [Backend CI]
    │     ├── Install Python deps (pip install -r requirements.txt)
    │     ├── Lint (ruff check)
    │     ├── Format check (ruff format --check)
    │     ├── Test (pytest --cov)
    │     └── Build Docker image (verify build)
    │
    ├──► [Frontend CI]
    │     ├── Install deps (npm ci)
    │     ├── Lint (eslint)
    │     ├── Format check (prettier --check)
    │     ├── Type check (tsc --noEmit)
    │     ├── Test (vitest run)
    │     └── Build (vite build)
    │
    └──► [Docs CI] (opcjonalny)
          └── Markdown lint (markdownlint)
```

> **Gate:** Jeśli którykolwiek krok zawiedzie, PR nie może zostać zmergowany (branch protection rule).

### Przykładowy workflow — Backend CI

```yaml
# .github/workflows/ci-backend.yml
name: Backend CI

on:
  pull_request:
    paths:
      - "apps/api/**"
      - "requirements*.txt"
  push:
    branches: [main]
    paths:
      - "apps/api/**"

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: timescale/timescaledb:latest-pg16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: stagebrain_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: "pip"

      - name: Install dependencies
        run: pip install -r apps/api/requirements.txt -r apps/api/requirements-dev.txt

      - name: Lint
        run: ruff check apps/api/src/

      - name: Format check
        run: ruff format --check apps/api/src/

      - name: Run tests
        env:
          DATABASE_URL: postgresql+asyncpg://test:test@localhost:5432/stagebrain_test
          REDIS_URL: redis://localhost:6379
        run: |
          cd apps/api
          alembic upgrade head
          pytest --cov=src --cov-report=term-missing
```

### Przykładowy workflow — Frontend CI

```yaml
# .github/workflows/ci-frontend.yml
name: Frontend CI

on:
  pull_request:
    paths:
      - "apps/web/**"
      - "packages/**"
  push:
    branches: [main]
    paths:
      - "apps/web/**"
      - "packages/**"

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
          cache-dependency-path: apps/web/package-lock.json

      - name: Install dependencies
        run: cd apps/web && npm ci

      - name: Lint
        run: cd apps/web && npm run lint

      - name: Type check
        run: cd apps/web && npm run typecheck

      - name: Test
        run: cd apps/web && npm run test -- --run

      - name: Build
        run: cd apps/web && npm run build
```

---

## 3. Path Filters

Nie uruchamiamy całego pipeline dla każdej zmiany. GitHub Actions `paths` filtruje:

| Zmiana w... | Uruchamia |
|:---|:---|
| `apps/api/**` | Backend CI |
| `apps/web/**` | Frontend CI |
| `packages/**` | Frontend CI (bo frontend importuje shared-types) |
| `infra/**` | Brak CI (deploy config, nie wymaga testów) |
| `docs/**` | Opcjonalnie: Markdown lint |
| `.github/**` | Odpowiedni workflow |

---

## 4. CD (Continuous Deployment)

### Flow

```
Push/Merge na main
    │
    ├──► CI Pipeline (lint + test + build) ──► ✅
    │
    └──► Deploy Pipeline
          │
          ├── Build Docker images (api + web)
          ├── Push to GHCR (GitHub Container Registry)
          │     ├── ghcr.io/org/stagebrain-api:latest
          │     └── ghcr.io/org/stagebrain-web:latest
          │
          ├── SSH to VPS
          │     ├── docker compose pull
          │     ├── docker compose up -d --remove-orphans
          │     └── docker compose exec api alembic upgrade head
          │
          └── Health check
                └── curl https://stagebrain.example.com/health
```

### Przykładowy workflow — Deploy

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      packages: write
    steps:
      - uses: actions/checkout@v4

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push API image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: infra/docker/api.Dockerfile
          push: true
          tags: ghcr.io/${{ github.repository }}/api:latest

      - name: Build and push Web image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: infra/docker/web.Dockerfile
          push: true
          tags: ghcr.io/${{ github.repository }}/web:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/stagebrain
            docker compose pull
            docker compose up -d --remove-orphans
            docker compose exec -T api alembic upgrade head
            sleep 5
            curl -sf http://localhost:8000/health || exit 1
            echo "Deploy successful"
```

---

## 5. Sekrety GitHub Actions

| Sekret | Opis |
|:---|:---|
| `VPS_HOST` | IP lub domena serwera Hetzner |
| `VPS_USER` | Użytkownik SSH (np. `deploy`) |
| `VPS_SSH_KEY` | Klucz prywatny SSH (Ed25519) |
| `GITHUB_TOKEN` | Automatyczny — dostęp do GHCR |

### Sekrety na VPS (w `.env` na serwerze)

```env
DATABASE_URL=postgresql+asyncpg://stagebrain:<password>@postgres:5432/stagebrain
REDIS_URL=redis://redis:6379
SECRET_KEY=<production-secret>
SENTRY_DSN=https://<key>@sentry.io/<project>
```

> **Sekrety nigdy nie są w repozytorium.** Plik `.env` na VPS jest tworzony ręcznie przy pierwszym setup.

---

## 6. Rollback

```bash
# Na VPS — powrót do poprzedniej wersji
ssh deploy@stagebrain.example.com

# Sprawdź poprzedni image
docker compose images

# Rollback (jeśli tagi z SHA)
docker compose pull ghcr.io/org/stagebrain-api:<previous-sha>
docker compose up -d

# Rollback migracji (jeśli potrzebne)
docker compose exec api alembic downgrade -1
```

> **Zasada:** Deploy zawsze między koncertami, nigdy w trakcie live show. W trakcie koncertu VPS jest "zamrożony".
