# Testing Strategy

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Zespół deweloperski

---

Podejście do testowania StageBrain. Piramida testów dostosowana do specyfiki projektu: real-time audio, WebSocket, ML ranking.

## 1. Piramida Testów

```
        ┌───────────┐
        │    E2E    │  ← Playwright (kluczowe ścieżki)
        │  (mało)   │
        ├───────────┤
        │Integration│  ← pytest + httpx (API + DB)
        │ (średnio) │     Vitest (komponenty + API mock)
        ├───────────┤
        │   Unit    │  ← pytest (logika), Vitest (hooks, utils)
        │  (dużo)   │
        └───────────┘
```

| Poziom | Backend | Frontend | Ilość |
|:---|:---|:---|:---|
| **Unit** | pytest | Vitest | Dużo (~70% testów) |
| **Integration** | pytest + httpx + TestClient | Vitest + MSW (mock API) | Średnio (~25%) |
| **E2E** | — | Playwright | Mało (~5%, kluczowe flows) |

---

## 2. Backend — pytest

### Setup

```toml
# pyproject.toml
[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
filterwarnings = ["ignore::DeprecationWarning"]
```

### Struktura testów

```text
apps/api/tests/
├── conftest.py              # Fixtures: test DB, test client, factories
├── unit/
│   ├── test_engagement_scorer.py
│   ├── test_audio_processor.py
│   ├── test_recommendation_fallback.py
│   ├── test_time_tracking.py
│   └── test_csv_import.py
├── integration/
│   ├── test_shows_api.py
│   ├── test_setlist_api.py
│   ├── test_analytics_api.py
│   └── test_websocket_audio.py
└── factories/
    ├── show_factory.py
    └── segment_factory.py
```

### Fixtures (`conftest.py`)

```python
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

from src.main import app
from src.database import Base, get_db


@pytest.fixture
async def db_session():
    """Isolated database session per test (transaction rollback)."""
    engine = create_async_engine(settings.test_database_url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSession(engine) as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client(db_session):
    """Async test client with DB override."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
```

### Przykład — Unit test

```python
# tests/unit/test_engagement_scorer.py
from src.engagement.scorer import calculate_engagement_score


def test_high_rms_and_cheering_gives_high_score():
    score = calculate_engagement_score(
        rms_energy=0.8,
        spectral_centroid=3500.0,
        zcr=0.12,
        event_type="cheering",
        event_confidence=0.9,
    )
    assert 0.7 <= score <= 1.0


def test_low_rms_and_silence_gives_low_score():
    score = calculate_engagement_score(
        rms_energy=0.1,
        spectral_centroid=500.0,
        zcr=0.02,
        event_type="silence",
        event_confidence=0.95,
    )
    assert 0.0 <= score <= 0.3


def test_score_always_in_range():
    """Score musi być w zakresie 0-1 niezależnie od inputu."""
    score = calculate_engagement_score(
        rms_energy=999.0,  # absurdalnie wysoki
        spectral_centroid=0.0,
        zcr=-1.0,
        event_type="unknown",
        event_confidence=0.0,
    )
    assert 0.0 <= score <= 1.0
```

### Przykład — Integration test

```python
# tests/integration/test_shows_api.py
import pytest


@pytest.mark.asyncio
async def test_create_and_start_show(client, db_session):
    # Create venue
    resp = await client.post("/api/v1/venues", json={
        "name": "COS Torwar",
        "city": "Warszawa",
        "capacity": 10000,
    })
    assert resp.status_code == 201
    venue_id = resp.json()["id"]

    # Create show
    resp = await client.post("/api/v1/shows", json={
        "name": "Test Concert",
        "venue_id": venue_id,
        "planned_start": "2026-05-15T20:00:00Z",
        "curfew": "2026-05-15T22:30:00Z",
    })
    assert resp.status_code == 201
    show_id = resp.json()["id"]
    assert resp.json()["status"] == "setup"

    # Start show
    resp = await client.post(f"/api/v1/shows/{show_id}/start")
    assert resp.status_code == 200
    assert resp.json()["status"] == "live"
```

### Komendy

```bash
# Wszystkie testy
cd apps/api && pytest

# Tylko unit
pytest tests/unit/

# Tylko integration
pytest tests/integration/

# Z coverage
pytest --cov=src --cov-report=term-missing

# Konkretny test
pytest tests/unit/test_engagement_scorer.py::test_high_rms_and_cheering_gives_high_score

# Verbose
pytest -v
```

---

## 3. Frontend — Vitest

### Setup

```typescript
// vite.config.ts (fragment)
export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
});
```

### Struktura testów

```text
apps/web/src/
├── features/
│   ├── live/
│   │   ├── EngagementGauge.tsx
│   │   ├── EngagementGauge.test.tsx    ← test obok komponentu
│   │   └── ...
│   └── setup/
│       ├── SetlistImport.tsx
│       └── SetlistImport.test.tsx
├── hooks/
│   ├── useWebSocket.ts
│   └── useWebSocket.test.ts
└── utils/
    ├── formatTime.ts
    └── formatTime.test.ts
```

### Przykład — Unit test (utility)

```typescript
// src/utils/formatTime.test.ts
import { describe, it, expect } from "vitest";
import { formatDuration, formatCurfewDelta } from "./formatTime";

describe("formatDuration", () => {
  it("formats seconds to HH:MM:SS", () => {
    expect(formatDuration(5535)).toBe("01:32:15");
  });

  it("handles zero", () => {
    expect(formatDuration(0)).toBe("00:00:00");
  });
});

describe("formatCurfewDelta", () => {
  it("shows negative delta as ahead of schedule", () => {
    expect(formatCurfewDelta(-165)).toBe("-2:45 (ahead)");
  });

  it("shows positive delta as behind schedule", () => {
    expect(formatCurfewDelta(300)).toBe("+5:00 (behind)");
  });
});
```

### Przykład — Component test

```typescript
// src/features/live/EngagementGauge.test.tsx
import { render, screen } from "@testing-library/react";
import { EngagementGauge } from "./EngagementGauge";

describe("EngagementGauge", () => {
  it("displays score as percentage", () => {
    render(<EngagementGauge score={0.72} trend="rising" />);
    expect(screen.getByText("72")).toBeInTheDocument();
  });

  it("shows rising trend indicator", () => {
    render(<EngagementGauge score={0.5} trend="rising" />);
    expect(screen.getByTestId("trend-rising")).toBeInTheDocument();
  });
});
```

### Komendy

```bash
# Wszystkie testy (watch mode)
cd apps/web && npm run test

# Single run (CI)
npm run test -- --run

# Coverage
npm run test -- --run --coverage

# Konkretny plik
npm run test -- src/utils/formatTime.test.ts
```

---

## 4. E2E — Playwright

### Zakres

E2E testy tylko dla **Critical User Journeys** — nie testujemy każdego komponentu E2E.

| Flow | Opis | Priorytet |
|:---|:---|:---|
| **Show setup + start** | Stwórz show, importuj setlistę, startuj | Krytyczny |
| **Live panel render** | Panel live wyświetla engagement, segmenty, czas | Krytyczny |
| **Segment lifecycle** | Start/end/skip segment z panelu | Wysoki |
| **Post-show analytics** | Widok analytics po zakończeniu show | Średni |

### Setup

```typescript
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
  },
  webServer: [
    {
      command: "docker compose up -d && cd apps/web && npm run dev",
      url: "http://localhost:5173",
      reuseExistingServer: true,
    },
  ],
});
```

### Przykład

```typescript
// e2e/show-lifecycle.spec.ts
import { test, expect } from "@playwright/test";

test("operator can create and start a show", async ({ page }) => {
  await page.goto("/setup");

  // Create show
  await page.fill('[data-testid="show-name"]', "Test Concert");
  await page.click('[data-testid="create-show"]');

  await expect(page.getByText("Test Concert")).toBeVisible();

  // Start show
  await page.click('[data-testid="start-show"]');

  // Verify live panel
  await expect(page).toHaveURL(/\/live\//);
  await expect(page.getByTestId("engagement-gauge")).toBeVisible();
});
```

### Komendy

```bash
# Uruchom E2E
npx playwright test

# Z UI (debug)
npx playwright test --ui

# Konkretny test
npx playwright test e2e/show-lifecycle.spec.ts
```

---

## 5. Co testujemy, a czego nie

### Testujemy (must-have)

| Obszar | Co | Jak |
|:---|:---|:---|
| Engagement scoring | Formuła scoring (rms + spectral + event → score 0-1) | Unit test (pytest) |
| Recommendation fallback | Rule-based scoring (energy match, contrast, fatigue) | Unit test (pytest) |
| Time tracking | Curfew projection, delay calculation, recovery scenarios | Unit test (pytest) |
| CSV import | Parsing setlisty z CSV, walidacja | Unit test (pytest) |
| API endpoints | CRUD shows, setlists, segments, timeline | Integration test (pytest + httpx) |
| WebSocket audio | Binary frame handling, processing pipeline | Integration test (pytest) |
| UI components | Engagement gauge, segment timeline, recommendation cards | Component test (Vitest) |
| Critical flows | Show setup → live → end | E2E (Playwright) |

### Nie testujemy (na MVP)

| Obszar | Dlaczego nie |
|:---|:---|
| LightGBM model accuracy | Model trenowany na syntetycznych danych — testy accuracy nie mają sensu przed real data |
| Audio quality | Jakość audio zależy od mikrofonu na venue — testujemy processing, nie input |
| Caddy SSL | Caddy robi to automatycznie, testowanie SSL to testowanie Caddy |
| Docker Compose | Infrastruktura testowana przy deploy, nie w unit testach |

---

## 6. Dobre Praktyki

1. **Testuj zachowanie, nie implementację** — test sprawdza output, nie prywatne metody.
2. **Niezależność** — każdy test działa samodzielnie, w dowolnej kolejności.
3. **Szybkość** — unit testy < 1s. Integration testy < 5s. E2E < 30s per test.
4. **Test przy bugfix** — każdy bugfix zawiera regression test reprodukujący bug.
5. **Factories** — nie twórz obiektów ręcznie w testach, używaj Factory Boy (backend) / factory functions (frontend).
6. **Realistyczne dane** — nazwy segmentów, venue, engagement scores powinny wyglądać jak prawdziwe dane koncertowe.

---

## 7. Coverage Target

| Warstwa | Target | Uzasadnienie |
|:---|:---|:---|
| Backend (Python) — logika biznesowa | 80%+ | Scoring, time tracking, recommendations — krytyczne |
| Backend (Python) — routery/CRUD | 60%+ | CRUD jest prosty, ale integracyjne testy ważne |
| Frontend (TypeScript) — utils/hooks | 80%+ | Logika formatowania, kalkulacji |
| Frontend (TypeScript) — komponenty | 50%+ | Kluczowe komponenty (gauge, timeline) |
| E2E | 3-5 scenariuszy | Tylko critical user journeys |

> **Pragmatyzm:** Coverage to metryka orientacyjna, nie cel sam w sobie. Lepiej 60% dobrych testów niż 90% testów sprawdzających getter/setter.
