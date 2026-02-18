# StageBrain — Strategia dekompozycji pracy z AI

> **Cel dokumentu**: Rozplanowanie implementacji na autonomiczne, zamknięte sesje pracy z AI.
> Każda sesja = jedno wejście, jeden konkretny rezultat, zero zależności od kontekstu poprzedniej sesji.
> **Data**: 2026-02-18

---

## Filozofia podejścia

### Dlaczego nie "wszystko na raz"?

1. **Kontekst AI jest ograniczony** — im więcej kodu w jednym promptcie, tym więcej błędów i halucynacji
2. **Każda sesja powinna być weryfikowalna** — po zakończeniu sesji uruchamiasz `docker compose up` lub `npm run dev` i widzisz że działa
3. **Łatwiejsze code review** — mniejszy diff = łatwiej zrozumieć co AI napisał
4. **Rollback** — jeśli sesja pójdzie źle, cofasz jeden commit, nie cały projekt

### Zasady dekompozycji

| Zasada | Opis |
|--------|------|
| **Vertical slices** | Każda sesja daje coś działającego end-to-end (backend + frontend), nie "cały backend a potem cały frontend" |
| **Najpierw szkielet, potem mięso** | Najpierw struktura, konfiguracja, Docker — potem logika biznesowa |
| **Zależności w dół** | Sesja N+1 może zależeć od N, ale nigdy od N+2. Liniowa kolejność. |
| **Jeden scope per sesja** | Każda sesja ma jasno zdefiniowany input i output. Zero "a może jeszcze to dorzucimy" |
| **Testy razem z kodem** | Każda sesja zawiera testy do napisanego kodu — nie odkładamy testów na "potem" |

---

## Plan sesji — 18 kroków

### Legenda

- **Typ B** = Backend (AI pisze, deweloper reviewuje)
- **Typ F** = Frontend (deweloper pisze samodzielnie lub z AI)
- **Typ I** = Infrastruktura (AI pisze, deweloper uruchamia)
- **Typ BF** = Full-stack (backend + frontend w jednej sesji)

---

### BLOK 1: Fundamenty (sesje 1-4)

> Cel: `docker compose up` uruchamia cały stack, każdy serwis odpowiada, baza istnieje.

#### Sesja 1 — Szkielet monorepo + Docker Compose
**Typ**: I | **Czas**: ~1h | **Faza planu**: 0

**Input**: Struktura z dokumentu architektonicznego (sekcja 6)

**Scope**:
- Inicjalizacja struktury katalogów (`apps/api/`, `apps/web/`, `packages/`, `infra/`, `scripts/`)
- `.gitignore` (Python + Node + Docker)
- `docker-compose.yml` z serwisami: `api`, `web`, `postgres` (z TimescaleDB), `redis`
- `Dockerfile.api` (Python 3.12, FastAPI)
- `Dockerfile.web` (Node 22, Vite)
- `apps/api/pyproject.toml` z zależnościami
- `apps/web/package.json` z zależnościami

**Output**: `docker compose up` buduje i uruchamia 4 kontenery. Każdy loguje "ready".

**Weryfikacja**:
```
docker compose up → 4 kontenery zielone
curl http://localhost:8000 → {"status": "ok"}
curl http://localhost:5173 → strona React
```

---

#### Sesja 2 — FastAPI boilerplate + konfiguracja
**Typ**: B | **Czas**: ~1.5h | **Faza planu**: 0

**Scope**:
- Struktura `apps/api/src/` (core/, moduły)
- Konfiguracja: `settings.py` (Pydantic Settings, .env)
- SQLAlchemy 2.0 async setup + session factory
- Alembic inicjalizacja
- Health check endpoint (`GET /api/v1/health`)
- CORS middleware
- Structured logging (JSON)
- Pytest setup + test health check
- Error handling middleware (globalna obsługa wyjątków)

**Output**: API odpowiada na health check, łączy się z bazą, logi w JSON.

**Weryfikacja**:
```
pytest → zielone
GET /api/v1/health → {"status": "ok", "db": "connected", "redis": "connected"}
GET /docs → Swagger UI
```

---

#### Sesja 3 — React boilerplate + ciemny motyw
**Typ**: F | **Czas**: ~1.5h | **Faza planu**: 0

**Scope**:
- Vite + React 19 + TypeScript 5.x konfiguracja
- Tailwind CSS 4 z ciemnym motywem (domyślny)
- Routing (React Router): `/setup`, `/live`, `/audio-source`, `/post-show`
- Layout: sidebar/header, responsywny (tablet 10"+)
- Zustand — pusty store (placeholder)
- Placeholder pages (4 strony z tytułem i opisem)
- Komponent: `StatusBadge` (online/offline)
- Komponent: `PageLayout` (wrapper z nawigacją)

**Output**: SPA z nawigacją między 4 stronami, ciemny motyw, responsywny layout.

**Weryfikacja**:
```
npm run dev → działa
Nawigacja między stronami → poprawna
Ciemny motyw → czytelny
Tablet view (Chrome DevTools) → layout ok
```

---

#### Sesja 4 — Schema bazy danych + migracje
**Typ**: B | **Czas**: ~2h | **Faza planu**: 0

**Scope**:
- Wszystkie modele SQLAlchemy (venues, shows, setlists, segments, segment_variants, show_timeline, engagement_metrics, recommendations_log, operator_tags, calibration_presets, reports)
- Stany: segment (`planned→active→completed|skipped`), show (`setup→live→paused→ended`)
- TimescaleDB hypertable na `engagement_metrics`
- Alembic migration (initial)
- Seed script: przykładowy venue + setlista + show
- Testy: model creation, relationships, constraints

**Output**: `alembic upgrade head` tworzy pełny schemat. Seed script wypełnia dane testowe.

**Weryfikacja**:
```
alembic upgrade head → sukces
python scripts/seed.py → dane w bazie
pytest tests/models/ → zielone
psql → tabele istnieją, relacje poprawne
```

---

### BLOK 2: CRUD i API bazowe (sesje 5-7)

> Cel: Kompletne REST API do zarządzania venues, shows, setlistami. Frontend je konsumuje.

#### Sesja 5 — Venues + Shows CRUD
**Typ**: BF | **Czas**: ~2h | **Faza planu**: 1-2

**Scope**:
- **Backend**: REST API — venues CRUD, shows CRUD
  - Pydantic schemas (request/response)
  - Endpointy: `GET/POST/PUT/DELETE /api/v1/venues`, `GET/POST/PUT/DELETE /api/v1/shows`
  - Show lifecycle: zmiana stanów (`setup→live→paused→ended`)
  - Testy API (httpx + pytest)
- **Frontend**: Generowanie typów z OpenAPI (`openapi-typescript`)
  - API client setup (`openapi-fetch`)
  - Strona Setup: lista shows, tworzenie nowego show, wybór venue

**Output**: Można tworzyć venues i shows przez API i przez UI.

---

#### Sesja 6 — Setlista: model, CRUD, import CSV
**Typ**: BF | **Czas**: ~2.5h | **Faza planu**: 3

**Scope**:
- **Backend**:
  - Setlists + Segments + Segment Variants CRUD
  - Import CSV (parser z kolumnami: nazwa, czas_full, czas_short, bpm, gatunek)
  - Reorder segments (drag & drop → PATCH z nową kolejnością)
  - Testy: CRUD + import CSV z edge cases
- **Frontend**:
  - Strona Setup → sekcja "Setlista"
  - Lista segmentów (TanStack Table)
  - Import CSV (upload + preview + confirm)
  - Drag & drop reorder (dnd-kit lub natywny)
  - Edycja segmentu inline

**Output**: Operator może importować setlistę z CSV, edytować ją, zmieniać kolejność.

---

#### Sesja 7 — Show Setup: venue, kalibracja, curfew
**Typ**: BF | **Czas**: ~2h | **Faza planu**: 3

**Scope**:
- **Backend**:
  - Calibration presets CRUD
  - Show config: venue, setlista, curfew time, kalibracja
  - Endpoint: `POST /api/v1/shows/{id}/configure`
  - Presety kalibracji: hala, stadion, klub, open air (seeded)
- **Frontend**:
  - Strona Setup → kompletny flow:
    1. Wybierz/utwórz show
    2. Wybierz venue (dropdown + create new)
    3. Importuj/wybierz setlistę
    4. Ustaw curfew (time picker)
    5. Kalibracja (preset dropdown + sliders)
    6. Przycisk "Start Show" → przejście do `/live`

**Output**: Kompletny flow pre-show setup. Operator konfiguruje show od zera.

---

### BLOK 3: Audio Pipeline (sesje 8-10)

> Cel: Audio z mikrofonu → serwer → metryki → Redis → panel. End-to-end.

#### Sesja 8 — WebSocket audio ingest + ring buffer
**Typ**: B | **Czas**: ~2h | **Faza planu**: 2

**Scope**:
- WebSocket endpoint: `ws://api/v1/audio/stream`
- Przyjmowanie binary chunks (Opus/WebM lub PCM)
- Dekodowanie do PCM 16-bit, 16kHz, mono
- Ring buffer: bufor ostatnich N sekund audio
- Windowing: wycinanie okien 5-10s do analizy
- Testy: WebSocket connection, chunk processing, buffer behavior
- Prosty health metric: "audio is flowing" boolean → Redis

**Output**: Serwer przyjmuje audio przez WebSocket, buforuje, tnie na okna.

---

#### Sesja 9 — librosa feature extraction + YAMNet
**Typ**: B | **Czas**: ~2.5h | **Faza planu**: 2

**Scope**:
- librosa: RMS Energy, Spectral Centroid, Zero-Crossing Rate, Spectral Rolloff
- YAMNet: pobranie modelu, inferencja TFLite/ONNX
- Filtrowanie klas YAMNet (Applause, Cheering, Crowd, Silence, Music...)
- ProcessPoolExecutor dla CPU-intensive obliczeń
- Engagement Score v1: ważona suma (prosty wzór)
- Zapis metryk do TimescaleDB (engagement_metrics hypertable)
- Redis pub/sub: publish engagement update na channel `show:{id}:engagement`
- Testy: feature extraction na sample audio, engagement score calculation

**Output**: Audio chunk → metryki → TimescaleDB + Redis. Pipeline działa end-to-end.

---

#### Sesja 10 — Frontend: Audio Source + Live Panel v1
**Typ**: F | **Czas**: ~2.5h | **Faza planu**: 2

**Scope**:
- **Strona Audio Source** (`/audio-source`):
  - Web Audio API: `getUserMedia()` → dostęp do mikrofonu
  - MediaRecorder API: nagrywanie chunków co 5-10s
  - WebSocket: wysyłka binary chunków do serwera
  - Status: connected/disconnected, audio level meter
  - Reconnect z exponential backoff
- **Panel Live v1** (`/live`):
  - WebSocket: `ws://api/v1/live/{show_id}` — odbiór engagement updates
  - Engagement gauge (okrągły/liniowy wskaźnik 0-100)
  - Trend arrow (↑ ↗ → ↘ ↓)
  - Mini-timeline (ostatnie 5 min)
  - Etykieta klasyfikacji YAMNet (np. "Applause", "Crowd noise")
  - Status: "LIVE" / "OFFLINE" badge

**Output**: Demo end-to-end: mikrofon → serwer → panel wyświetla engagement w real-time.

---

### BLOK 4: Show Timeline + Kontrola czasu (sesje 11-12)

> Cel: Operator steruje przebiegiem show, system liczy czas i prognozuje curfew.

#### Sesja 11 — Show timeline: start/end/skip segment
**Typ**: BF | **Czas**: ~2h | **Faza planu**: 3

**Scope**:
- **Backend**:
  - Show timeline API: `POST /api/v1/shows/{id}/segments/{seg_id}/start|end|skip`
  - Zapis do `show_timeline` (faktyczne czasy start/end per segment)
  - Operator tags: `POST /api/v1/shows/{id}/tags` (tekst + timestamp)
  - WebSocket broadcast: zmiana segmentu → update do panelu
- **Frontend** Panel Live rozszerzenie:
  - Lista segmentów setlisty z aktualnym statusem (planned/active/completed/skipped)
  - Przyciski: "Start", "End", "Skip" per segment
  - Aktualny segment highlighted
  - Quick tagi (przyciski: "Peak moment", "Low energy", "Technical issue", custom)

**Output**: Operator przeprowadza show segment po segmencie przez panel.

---

#### Sesja 12 — Kontrola czasu + prognoza curfew
**Typ**: BF | **Czas**: ~2h | **Faza planu**: 3

**Scope**:
- **Backend**:
  - Time tracking engine: planowany czas vs faktyczny per segment
  - Delta per segment (ahead/behind schedule)
  - Prognoza: estimated end time vs curfew
  - Scenariusze odzysku: "skróć 3 segmenty do short" → nowy estimated end
  - Endpoint: `GET /api/v1/shows/{id}/time-status`
  - Endpoint: `GET /api/v1/shows/{id}/recovery-scenarios`
- **Frontend** Panel Live rozszerzenie:
  - Zegar: elapsed time, remaining to curfew
  - Delta: +2:30 (ahead) / -1:15 (behind) z kolorem
  - Prognoza: "Estimated end: 22:47 | Curfew: 23:00"
  - Panel scenariuszy odzysku (lista opcji + przycisk "Zastosuj")

**Output**: Operator widzi w real-time czy mieści się w czasie. Ma opcje odzysku.

---

### BLOK 5: Rekomendacje ML (sesje 13-14)

> Cel: System sugeruje kolejny segment na podstawie engagement i kontekstu.

#### Sesja 13 — LightGBM model + recommendation engine
**Typ**: B | **Czas**: ~2.5h | **Faza planu**: 4

**Scope**:
- Feature engineering: energia, trend, pozycja w setliście, tempo, kontrast, wariant
- Dane syntetyczne do pierwszego treningu (generator)
- LightGBM: trening, serializacja modelu
- Recommendation engine: top 3-5 segmentów z confidence score
- Fallback regułowy (jeśli confidence < threshold)
- Log rekomendacji: co system zaproponował, co operator wybrał
- Endpoint: `GET /api/v1/shows/{id}/recommendations`
- Testy: recommendation logic, fallback, logging

**Output**: System generuje rekomendacje następnego segmentu. Model zapisany w `apps/api/models/`.

---

#### Sesja 14 — Frontend: rekomendacje + kalibracja venue
**Typ**: F | **Czas**: ~2h | **Faza planu**: 4

**Scope**:
- **Panel Live** rozszerzenie:
  - Sekcja "Recommended Next" — top 3-5 kart
  - Każda karta: nazwa segmentu, confidence %, expected engagement change
  - Przycisk: "Accept" → segment staje się następny w kolejce
  - Visual cue: pulsowanie przy spadku energii ("rozważ zmianę")
- **Strona Setup** rozszerzenie:
  - Kalibracja venue: wizard z presetami
  - Sliders: energy_baseline, sensitivity, noise_floor
  - Preview: "przy tych ustawieniach cisza = 15, oklaski = 78"

**Output**: Operator widzi rekomendacje w panelu live. Może kalibrować venue w setup.

---

### BLOK 6: Post-show + Raporty (sesje 15-16)

> Cel: Po koncercie operator widzi analitykę, eksportuje dane, generuje raport.

#### Sesja 15 — Post-show analytics API + eksport
**Typ**: B | **Czas**: ~2h | **Faza planu**: 5

**Scope**:
- Endpoint: `GET /api/v1/shows/{id}/analytics` — pełna analityka show
  - Engagement timeline (time-series z TimescaleDB continuous aggregates)
  - Per-segment stats (avg/min/max engagement, czas faktyczny vs planowany)
  - Rekomendacje: co system zaproponował vs co operator wybrał
  - Tagi operatora z timestampami
- Eksport: `GET /api/v1/shows/{id}/export?format=csv|json`
- Raport PDF: Celery/arq task → weasyprint → PDF zapisany w `reports`
- Endpoint: `POST /api/v1/shows/{id}/report` (generuj) + `GET /api/v1/reports/{id}` (pobierz)

**Output**: API zwraca kompletną analitykę show. Eksport do CSV/JSON/PDF działa.

---

#### Sesja 16 — Frontend: post-show dashboard
**Typ**: F | **Czas**: ~2h | **Faza planu**: 5

**Scope**:
- Strona Post-show (`/post-show/{show_id}`):
  - Engagement timeline chart (Recharts — line chart z kolorowaniem per segment)
  - Tabela segmentów: nazwa, czas planowany/faktyczny, delta, avg engagement
  - Heatmap engagement (opcjonalnie)
  - Lista tagów operatora na timeline
  - Lista decyzji (rekomendacje accepted/rejected)
  - Przyciski: "Export CSV", "Export JSON", "Generate PDF Report"
  - Lista show (strona `/post-show`) — wybór show do analizy

**Output**: Operator przegląda analitykę po koncercie, eksportuje dane.

---

### BLOK 7: Integracja + Polish (sesje 17-18)

> Cel: Wszystko spięte, przetestowane, gotowe do pilota.

#### Sesja 17 — Integracja end-to-end + error handling
**Typ**: BF | **Czas**: ~2.5h | **Faza planu**: 6

**Scope**:
- Pełny flow test: setup → start show → audio streaming → engagement → recommendations → end show → post-show
- WebSocket reconnect (backend + frontend)
- Error handling: co się dzieje gdy audio się zerwie, gdy Redis padnie, gdy DB nie odpowiada
- Fail-safe: panel pokazuje ostatni znany stan + "OFFLINE" badge
- Loading states, empty states, error states we frontendzie
- API validation edge cases
- Performance: czy audio pipeline nadąża w real-time

**Output**: Pełny flow działa stabilnie przez minimum 30 minut.

---

#### Sesja 18 — CI/CD + deployment + produkcja
**Typ**: I | **Czas**: ~2h | **Faza planu**: 0/6

**Scope**:
- GitHub Actions: lint + test na PR
- `docker-compose.prod.yml` (z Caddy, SSL, production settings)
- Deployment script: build → push images → SSH → pull → up
- Alembic migration w CI
- Backup script (PostgreSQL dump)
- README z instrukcją uruchomienia
- Env template (`.env.example`)

**Output**: Push na main → automatyczny deploy na VPS. System działa na produkcji.

---

## Podsumowanie — mapa zależności

```
Sesja 1 ─── Sesja 2 ─── Sesja 4 ─── Sesja 5 ─── Sesja 6 ─── Sesja 7
  │              │                       │
  └── Sesja 3    │                       └── Sesja 11 ── Sesja 12
                 │
                 └── Sesja 8 ── Sesja 9 ── Sesja 10
                                   │
                                   └── Sesja 13 ── Sesja 14
                                          │
                                          └── Sesja 15 ── Sesja 16

                              Sesja 17 (wymaga: 12, 14, 16)
                                          │
                                          └── Sesja 18
```

## Jak wygląda pojedyncza sesja z AI?

```
1. KONTEKST    → "Przeczytaj CLAUDE.md i architekturę. Robimy Sesję N."
2. SCOPE       → AI czyta scope sesji z tego dokumentu
3. IMPLEMENTACJA → AI pisze kod, deweloper reviewuje na bieżąco
4. WERYFIKACJA → Uruchomienie, testy, sprawdzenie output
5. COMMIT      → Zamknięcie sesji, git commit
```

### Wskazówki do sesji

| Wskazówka | Dlaczego |
|-----------|----------|
| **Jedna sesja = jeden commit** | Łatwy rollback, czytelna historia |
| **Nie skipuj testów** | Testy to dokumentacja zachowania — przydadzą się w kolejnych sesjach |
| **Review > blind accept** | AI pisze backend, ale Ty musisz rozumieć co robi |
| **Nie rozszerzaj scope w trakcie** | "A może jeszcze..." → zapisz na następną sesję |
| **Zaczynaj od końca** | Najpierw zdefiniuj "co mam zobaczyć po sesji", potem pisz kod |

---

## Estymacja czasowa

| Blok | Sesje | Łączny czas szacowany |
|------|-------|-----------------------|
| 1. Fundamenty | 1-4 | ~6h |
| 2. CRUD i API | 5-7 | ~6.5h |
| 3. Audio Pipeline | 8-10 | ~7h |
| 4. Show Timeline | 11-12 | ~4h |
| 5. Rekomendacje ML | 13-14 | ~4.5h |
| 6. Post-show | 15-16 | ~4h |
| 7. Integracja | 17-18 | ~4.5h |
| **Suma** | **18 sesji** | **~36.5h** |

> Estymacje są orientacyjne. Realna praca z AI bywa szybsza (boilerplate) lub wolniejsza (debugging edge cases).
