# Repository Structure

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Zespół deweloperski

---

Struktura monorepo StageBrain. Dwie aplikacje (Python backend + React frontend), współdzielone typy i infrastruktura w jednym repozytorium.

## Główny podział

```text
stagebrain/
│
├── apps/                       # Aplikacje (deployable)
│   ├── api/                    # Backend — Python / FastAPI
│   └── web/                    # Frontend — React / TypeScript / Vite
│
├── packages/                   # Biblioteki współdzielone
│   └── shared-types/           # TypeScript types generowane z OpenAPI
│
├── infra/                      # Infrastruktura i deployment
│   ├── docker/                 # Dockerfiles (api, web)
│   ├── caddy/                  # Konfiguracja Caddy (reverse proxy)
│   └── scripts/                # Skrypty operacyjne (backup, deploy)
│
├── docs/                       # Dokumentacja (Single Source of Truth)
│
├── docker-compose.yml          # Stack lokalny + produkcyjny
├── docker-compose.override.yml # Nadpisania dla lokalnego dewelopmentu
├── .github/                    # GitHub Actions workflows
├── .env.example                # Przykładowe zmienne środowiskowe
└── README.md                   # Punkt wejścia projektu
```

---

## Szczegóły: `apps/api/` (Backend)

```text
apps/api/
├── src/
│   ├── main.py                 # Punkt wejścia FastAPI (app factory)
│   ├── config.py               # Pydantic Settings (env vars)
│   ├── database.py             # SQLAlchemy async engine + session
│   │
│   ├── core/                   # Moduł współdzielony
│   │   ├── auth.py             # Middleware autentykacji
│   │   ├── dependencies.py     # FastAPI dependencies (DB session, auth)
│   │   └── health.py           # Health check endpoint
│   │
│   ├── audio/                  # Moduł audio pipeline
│   │   ├── router.py           # WebSocket endpoint (audio ingest)
│   │   ├── processor.py        # librosa feature extraction
│   │   ├── classifier.py       # YAMNet event classification
│   │   └── buffer.py           # Ring buffer (5-10s okna)
│   │
│   ├── engagement/             # Moduł engagement scoring
│   │   ├── router.py           # REST endpoints (kalibracja)
│   │   ├── scorer.py           # Agregacja → score 0-1
│   │   ├── calibration.py      # Venue-specific calibration
│   │   └── models.py           # SQLAlchemy models (EngagementMetric)
│   │
│   ├── recommendations/        # Moduł rekomendacji ML
│   │   ├── router.py           # WebSocket decision endpoint
│   │   ├── engine.py           # LightGBM ranking
│   │   ├── fallback.py         # Rule-based fallback
│   │   ├── features.py         # Feature engineering
│   │   └── models.py           # SQLAlchemy models (RecommendationLog)
│   │
│   ├── setlist/                # Moduł setlisty
│   │   ├── router.py           # CRUD endpoints
│   │   ├── service.py          # Logika biznesowa
│   │   ├── csv_import.py       # Import setlisty z CSV
│   │   └── models.py           # SQLAlchemy models (Setlist, Segment, SegmentVariant)
│   │
│   ├── shows/                  # Moduł koncertów i czasu
│   │   ├── router.py           # Show lifecycle endpoints
│   │   ├── service.py          # Logika biznesowa (start/end/pause)
│   │   ├── time_tracking.py    # Time recovery, curfew projection
│   │   ├── tags.py             # Operator tags
│   │   └── models.py           # SQLAlchemy models (Show, ShowTimeline, Venue)
│   │
│   ├── analytics/              # Moduł analityki post-show
│   │   ├── router.py           # Analytics + export endpoints
│   │   ├── service.py          # Agregacja danych
│   │   ├── export.py           # CSV/JSON export
│   │   └── report.py           # PDF generation (weasyprint)
│   │
│   ├── websocket/              # Moduł WebSocket
│   │   ├── manager.py          # Connection manager (connect/disconnect/broadcast)
│   │   └── handlers.py         # Message routing (audio stream, panel broadcast)
│   │
│   └── scripts/                # Skrypty pomocnicze
│       └── seed.py             # Dane testowe (venues, calibration presets)
│
├── alembic/                    # Migracje bazy danych
│   ├── alembic.ini
│   ├── env.py
│   └── versions/               # Pliki migracji
│
├── tests/                      # Testy backend
│   ├── conftest.py             # Fixtures (test DB, test client)
│   ├── unit/                   # Testy jednostkowe
│   ├── integration/            # Testy integracyjne (z DB)
│   └── factories/              # Factory Boy factories
│
├── requirements.txt            # Zależności Python (pinned)
├── pyproject.toml              # Konfiguracja Python (ruff, pytest, etc.)
└── Dockerfile                  # Multi-stage build
```

### Konwencje backend

- **Jeden moduł = jeden katalog** z `router.py`, `service.py` (opcjonalny), `models.py`.
- **router.py** — FastAPI router (endpoints). Importowany w `main.py`.
- **service.py** — Logika biznesowa. Router wywołuje service, service wywołuje DB.
- **models.py** — SQLAlchemy ORM models. Importowane w `database.py` dla Alembic.
- Moduły **nie importują od siebie nawzajem** bezpośrednio — komunikacja przez DB lub Redis pub/sub.

---

## Szczegóły: `apps/web/` (Frontend)

```text
apps/web/
├── src/
│   ├── main.tsx                # Punkt wejścia React
│   ├── App.tsx                 # Root component + routing
│   │
│   ├── api/                    # API client (fetch wrapper)
│   │   ├── client.ts           # Bazowy klient HTTP
│   │   ├── websocket.ts        # WebSocket connection manager
│   │   └── hooks/              # React Query hooks (useShow, useSetlist, ...)
│   │
│   ├── features/               # Feature-based modules
│   │   ├── setup/              # Pre-show: konfiguracja, import setlisty
│   │   ├── live/               # Live panel: engagement, rekomendacje, czas
│   │   └── analytics/          # Post-show: wykresy, eksport, raport
│   │
│   ├── components/             # Współdzielone komponenty UI
│   │   ├── layout/             # Shell, sidebar, header
│   │   └── ui/                 # Buttons, cards, gauges, charts
│   │
│   ├── store/                  # Zustand stores
│   │   ├── useShowStore.ts     # Stan aktywnego show
│   │   ├── useEngagementStore.ts # Engagement real-time data
│   │   └── useWebSocketStore.ts  # WebSocket connection state
│   │
│   ├── hooks/                  # Custom hooks
│   ├── utils/                  # Helpers, formatters
│   └── types/                  # Lokalne typy (importy z shared-types)
│
├── public/                     # Static assets
├── index.html                  # HTML entry point
├── vite.config.ts              # Vite configuration
├── tailwind.config.ts          # Tailwind CSS config
├── tsconfig.json               # TypeScript config
├── package.json
└── Dockerfile                  # Multi-stage build (Vite build → nginx)
```

### Konwencje frontend

- **Feature-based structure**: `features/<nazwa>/` grupuje pages, components, hooks per feature.
- **Zustand** dla global state (engagement, WebSocket, active show).
- **React Query** (TanStack Query) dla server state (REST API calls).
- **WebSocket** zarządzany osobno w `api/websocket.ts` — pushuje do Zustand store.

---

## Szczegóły: `packages/shared-types/`

```text
packages/shared-types/
├── api.ts          # Auto-generowane z OpenAPI spec (openapi-typescript)
├── websocket.ts    # Ręcznie definiowane typy wiadomości WebSocket
└── index.ts        # Re-export
```

**Pipeline:** FastAPI → `/openapi.json` → `openapi-typescript` → `api.ts`

```bash
# Generowanie typów (uruchamiane z apps/web/)
npx openapi-typescript http://localhost:8000/openapi.json -o ../packages/shared-types/api.ts
```

---

## Szczegóły: `infra/`

```text
infra/
├── docker/
│   ├── api.Dockerfile          # Python multi-stage build
│   └── web.Dockerfile          # Node build → nginx serve
│
├── caddy/
│   └── Caddyfile               # Reverse proxy config (SSL, routing)
│
└── scripts/
    ├── deploy.sh               # Deploy script (SSH → pull → up)
    ├── backup.sh               # PostgreSQL backup → Object Storage
    └── restore.sh              # Restore from backup
```

---

## Zasady importów

```
apps/web  ──imports──►  packages/shared-types  ◄──generated-from──  apps/api
    │                                                                    │
    │                    NIE importuje                                    │
    └──────────── ✗ ──────────────────────────────────── ✗ ──────────────┘

apps/api  ──────────  NIE importuje ──────────  apps/web
```

- `apps/web/` może importować z `packages/shared-types/`.
- `apps/api/` **nie** importuje z `apps/web/` ani `packages/` (Python ≠ TypeScript).
- `packages/shared-types/` jest generowane z OpenAPI spec backendu — to most typów między Python a TypeScript.
- Moduły wewnątrz `apps/api/src/` komunikują się przez DB i Redis pub/sub, nie przez bezpośrednie importy między modułami.
