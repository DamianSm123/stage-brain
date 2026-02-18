# Getting Started & Local Setup

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Zespół deweloperski

---

Przewodnik konfiguracji środowiska lokalnego i pierwszego uruchomienia StageBrain.

## 1. Wymagania wstępne

| Narzędzie | Wersja | Uwagi |
|:---|:---|:---|
| **Git** | najnowsza | — |
| **Docker** + **Docker Compose** | Docker 24+, Compose v2+ | Cały backend stack uruchamiany jest w kontenerach |
| **Node.js** | v20 LTS+ (sprawdź `.nvmrc`) | Frontend (React) |
| **npm** | 10+ (z Node.js LTS) | Package manager dla frontend |
| **Python** | 3.12+ | Backend (FastAPI). Wymagany do dewelopmentu poza Docker |
| **IDE** | VS Code (rekomendowany) | Rozszerzenia: Python, ESLint, Prettier, Tailwind CSS IntelliSense |

### Rekomendowane rozszerzenia VS Code

```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.vscode-pylance",
    "charliermarsh.ruff",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-azuretools.vscode-docker"
  ]
}
```

---

## 2. Pierwsze kroki

### 2.1 Klonowanie repozytorium

```bash
git clone <repo-url>
cd stagebrain
```

### 2.2 Konfiguracja zmiennych środowiskowych

```bash
# Root — Docker Compose env
cp .env.example .env

# Backend
cp apps/api/.env.example apps/api/.env

# Frontend
cp apps/web/.env.example apps/web/.env
```

Kluczowe zmienne w `.env` (root):

```env
# PostgreSQL
POSTGRES_USER=stagebrain
POSTGRES_PASSWORD=localdev
POSTGRES_DB=stagebrain

# Redis
REDIS_URL=redis://redis:6379

# Backend
DATABASE_URL=postgresql+asyncpg://stagebrain:localdev@postgres:5432/stagebrain
SECRET_KEY=dev-secret-key-change-in-production
```

### 2.3 Uruchomienie infrastruktury (Docker Compose)

```bash
# Uruchom cały stack infrastruktury
docker compose up -d postgres redis

# Poczekaj na gotowość PostgreSQL (~5s)
docker compose exec postgres pg_isready
```

### 2.4 Uruchomienie backend (Python / FastAPI)

**Opcja A — Docker (rekomendowana na start):**

```bash
docker compose up -d api
```

API dostępne pod: `http://localhost:8000`
Dokumentacja Swagger: `http://localhost:8000/docs`

**Opcja B — Lokalnie (dla aktywnego dewelopmentu):**

```bash
cd apps/api

# Utwórz wirtualne środowisko Python
python3.12 -m venv .venv
source .venv/bin/activate  # macOS / Linux

# Zainstaluj zależności
pip install -r requirements.txt
# lub jeśli używamy poetry:
# poetry install

# Uruchom migracje
alembic upgrade head

# Uruchom serwer z hot-reload
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### 2.5 Uruchomienie frontend (React)

```bash
cd apps/web

# Zainstaluj zależności
npm install

# Uruchom dev server
npm run dev
```

Panel operatora dostępny pod: `http://localhost:5173`

### 2.6 Worker (opcjonalny)

Worker obsługuje zadania asynchroniczne (raporty PDF, eksport CSV). Nie jest wymagany do codziennego dewelopmentu.

```bash
# Via Docker
docker compose up -d worker

# Lub lokalnie (wymaga aktywnego venv)
cd apps/api
celery -A src.worker worker --loglevel=info
```

---

## 3. Pełny stack jedną komendą

```bash
# Cały stack (infra + API + worker)
docker compose up -d

# Frontend osobno (hot-reload)
cd apps/web && npm run dev
```

> **Dlaczego frontend osobno?** Vite HMR (Hot Module Replacement) działa najlepiej bezpośrednio na hoście, nie w Dockerze. Docker Compose uruchamia backend + infrastrukturę, frontend uruchamiamy natywnie.

---

## 4. Komendy po setup

### Migracje bazy danych

```bash
# Via Docker
docker compose exec api alembic upgrade head

# Lokalnie
cd apps/api && alembic upgrade head

# Nowa migracja (po zmianie modeli)
alembic revision --autogenerate -m "add_segment_variants_table"
```

### Generowanie typów (OpenAPI → TypeScript)

```bash
# Generuj TypeScript types z OpenAPI spec backendu
cd apps/web
npm run generate-types
```

To generuje `packages/shared-types/api.ts` z endpointu `/openapi.json` backendu.

### Seed data (dane testowe)

```bash
# Załaduj dane testowe (venue, presets kalibracji)
docker compose exec api python -m src.scripts.seed
```

---

## 5. Weryfikacja instalacji

```bash
# Backend health check
curl http://localhost:8000/health
# Oczekiwany: {"status": "ok", "db": "connected", "redis": "connected"}

# Backend testy
cd apps/api && pytest

# Frontend testy
cd apps/web && npm run test

# Frontend lint
cd apps/web && npm run lint
```

Jeśli health check zwraca `200` i testy przechodzą — środowisko jest gotowe.

---

## 6. Porty lokalne

| Serwis | Port | URL |
|:---|:---|:---|
| **FastAPI** (API + WebSocket) | 8000 | `http://localhost:8000` |
| **Swagger UI** | 8000 | `http://localhost:8000/docs` |
| **React Panel** (Vite dev) | 5173 | `http://localhost:5173` |
| **PostgreSQL** | 5432 | `postgresql://stagebrain:localdev@localhost:5432/stagebrain` |
| **Redis** | 6379 | `redis://localhost:6379` |

---

## 7. Zatrzymywanie środowiska

```bash
# Zatrzymaj wszystkie kontenery (dane zachowane w volumes)
docker compose down

# Zatrzymaj i usuń dane (czyste środowisko)
docker compose down -v
```
