# StageBrain — Sesje architektoniczne

> Mapa tematów do rozstrzygnięcia przed rozpoczęciem implementacji.
> Każda sesja to osobny, zamknięty temat do przepracowania w dedykowanym czacie AI.
> Sesje są uporządkowane w fazy — niektóre decyzje blokują inne.
>
> Uzupełnienie do: `DOMENY_PYTANIA.md` (pytania produktowe/domenowe)
> Ten dokument dotyczy **decyzji technicznych i architektonicznych**.

---

## Jak korzystać z tego dokumentu

1. Każda sesja ma **cel**, **pytania do rozstrzygnięcia** i **zależności** od innych sesji.
2. Pracuj w kolejności faz (1 → 2 → 3). Wewnątrz fazy — sesje można prowadzić równolegle, chyba że zaznaczono inaczej.
3. Po każdej sesji zapisz decyzje jako ADR (Architecture Decision Record) w `docs/02-architecture/adr/`.
4. Wynik każdej sesji powinien być konkretny: wybrana technologia, schemat, diagram, lub zdefiniowany kontrakt.

---

## Spis sesji

| Faza | # | Sesja | Blokowana przez |
|------|---|-------|-----------------|
| **1 — Fundamenty** | 1 | Stack backend | — |
| | 2 | Stack frontend | — |
| | 3 | Architektura systemu | 1, 2 |
| | 4 | Baza danych i model danych | 3 |
| | 5 | Security, auth i prywatność danych | 3 |
| **2 — Komponenty** | 6 | Audio pipeline — ingest i przetwarzanie | 1, 4 |
| | 7 | Engagement score — metryka energii | 6 |
| | 8 | Silnik rekomendacji i ML | 7 |
| | 9 | Kontrola czasu i scenariusze odzysku | 4 |
| | 10 | Real-time communication i event architecture | 3 |
| | 11 | Stan live show i fail-safe | 4, 10 |
| **3 — Delivery** | 12 | API design i kontrakty | 3, 10 |
| | 13 | Panel post-show, eksport i raporty | 4, 12 |
| | 14 | Infrastruktura i deployment | 3 |
| | 15 | Testing strategy | 6, 8, 11 |
| | 16 | Developer experience i projekt setup | 1, 2, 3 |

---

## FAZA 1 — Fundamenty

Decyzje, które warunkują wszystko inne. Rozstrzygnij je najpierw.

---

### Sesja 1: Stack technologiczny — Backend ✅

**Status:** Rozstrzygnięta (2026-02-18)
**Decyzje:** `ai/StageBrain_Architektura_i_Plan.md` §3.1

**Podsumowanie decyzji:**

1. **Python 3.12+ / FastAPI** — natywny ekosystem ML/audio, najprostszy framework backendowy, AI generuje mniej błędów
2. **Deweloper = frontend dev (React/TS)** — backend w całości pisany przez AI, deweloper reviewuje
3. **Mono-repo** — `apps/api/`, `apps/web/`, `packages/`, `infra/`
4. **ML w tym samym procesie** — jeden serwis, zero integracji między językami
5. ADR w `docs/` to template OpsDesk (NestJS) — nieaktualne, decyzja to FastAPI

**Odrzucone alternatywy:** NestJS (złożone patterns, słaby ekosystem audio/ML), Hybrid TS+Python (dwa serwisy = więcej błędów), Go (brak ekosystemu ML), Django (synchroniczny)

---

### Sesja 2: Stack technologiczny — Frontend ✅

**Status:** Rozstrzygnięta (2026-02-18, uzupełniona 2026-02-19)
**Decyzje:** `ai/StageBrain_Architektura_i_Plan.md` §3.2

**Podsumowanie decyzji:**

1. **React 19 (SPA)** + TypeScript 5.x + Vite — deweloper zna React/TS, SSR niepotrzebne (nie SEO app)
2. **Tailwind CSS 4** + **shadcn/ui** (Radix UI pod spodem) — ciemny motyw natywnie, dostępne komponenty, duże touch targets, pełna kontrola nad kodem (komponenty kopiowane do projektu)
3. **Recharts lub visx** — wykresy engagement timeline
4. **TanStack Table** — setlista, logi, dane tabelaryczne
5. **Zustand** — lekki state management
6. **openapi-typescript + openapi-fetch** — generowane typy i klient API z OpenAPI spec backendu
7. **Dark mode jako default** — backstage jest ciemny
8. **Tablet-first** — min. 48px touch targets, responsywny layout
9. **Podejście code-first do UI** — shadcn/ui daje profesjonalny design system od razu, bez Figmy, iterujemy wizualnie

**Odrzucone alternatywy:** Next.js (SSR niepotrzebne), Vue 3 (mniejszy ekosystem wizualizacji), SvelteKit (mniejszy ekosystem), MUI/Chakra (cięższe, mniej kontroli)

---

### Sesja 3: Architektura systemu — wzorzec i struktura ✅

**Status:** Rozstrzygnięta (2026-02-18)
**Decyzje:** `ai/StageBrain_Architektura_i_Plan.md` §5, §6

**Podsumowanie decyzji:**

1. **Modular monolith** — jeden serwis FastAPI, zero integracji między serwisami
2. **Podział na moduły** w `apps/api/src/`:
   - `audio/` — ingest, feature extraction, YAMNet
   - `engagement/` — scoring, kalibracja, trend
   - `recommendations/` — ML ranking (LightGBM), rekomendacje
   - `setlist/` — zarządzanie setlistą, import, warianty
   - `shows/` — koncerty, timeline, kontrola czasu, tagi
   - `analytics/` — post-show, raporty, eksport
   - `websocket/` — WebSocket handlers (audio ingest + live panel)
   - `core/` — konfiguracja, DB, auth, utils
3. **Komunikacja wewnętrzna**: direct imports + Redis pub/sub dla real-time broadcast
4. **Audio/ML pipeline**: w tym samym procesie, CPU-intensive przez ProcessPoolExecutor
5. **Jeden gateway**: FastAPI eksponuje wszystkie endpointy, moduły to pakiety Python
6. Diagramy C4: `docs/02-architecture/c4/` to template OpsDesk — **do usunięcia/przepisania**

**Odrzucone:** Microservices (zbyt ryzykowne na 10 tyg.), osobny ML serwis (niepotrzebna złożoność)

---

### Sesja 4: Baza danych i model danych 🟡

**Status:** Częściowo rozstrzygnięta (2026-02-18)
**Decyzje:** `ai/StageBrain_Architektura_i_Plan.md` §3.3, §4

**Co rozstrzygnięte:**

1. **PostgreSQL 16 + TimescaleDB** (extension, nie osobna baza)
2. **TimescaleDB hypertable** na `engagement_metrics` (automatyczne partycjonowanie po czasie)
3. **SQLAlchemy 2.0** (async) + **Alembic** (migracje) + **asyncpg** (driver)
4. **Tabele zdefiniowane** (high-level): venues, shows, setlists, segments, segment_variants, show_timeline, engagement_metrics, recommendations_log, operator_tags, calibration_presets, reports
5. **Stany**: segment (`planned→active→completed|skipped`), show (`setup→live→paused→ended`)

**Co do doprecyzowania przy implementacji (sesja impl. 4):**
- Szczegółowe kolumny i typy danych per tabela
- Indeksy i constrainty
- Seedowanie danych testowych
- ER diagram (powstanie z kodu SQLAlchemy)

---

### Sesja 5: Security, auth i prywatność danych

**Cel:** Zdefiniować minimum bezpieczeństwa dla MVP (bez pełnego hardeningu z Wariantu C).

**Zależności:** Sesja 3 (znamy architekturę)

**Kontekst:**
- Full RBAC i hardening to Wariant C (out of scope)
- Ale MVP też musi mieć **podstawowe zabezpieczenia** — operator panel nie może być publiczny
- Audio publiczności to dane, które mogą podlegać regulacjom (RODO/GDPR)
- System będzie testowany na realnym koncercie w maju

**Pytania do rozstrzygnięcia:**

1. Autentykacja operatora:
   - Prosty login (email + hasło)?
   - Magic link (email)?
   - PIN/kod (szybki dostęp backstage)?
   - Kombinacja: setup via email, live access via PIN?
2. Autoryzacja:
   - MVP: jeden typ użytkownika (operator/showcaller)?
   - Czy ktoś inny musi mieć dostęp (producent, reżyser) — z ograniczonym widokiem?
   - Prosty flag admin/viewer zamiast pełnego RBAC?
3. API security:
   - JWT vs session-based auth?
   - HTTPS everywhere (obowiązkowe)?
   - Rate limiting?
   - CORS policy?
4. Dane audio — prywatność:
   - Czy audio publiczności jest przetwarzane i odrzucane (tylko metryki), czy przechowywane?
   - Jeśli przechowywane — jak długo? Kto ma dostęp?
   - RODO — czy potrzebna podstawa prawna do nagrywania audio publiczności?
   - Czy organizator koncertu informuje publiczność o nagrywaniu?
5. Dane w spoczynku i w tranzycie:
   - Szyfrowanie połączeń (TLS)?
   - Szyfrowanie bazy danych?
   - Backup — gdzie i jak szyfrowany?
6. Anonimizacja danych w raportach post-show?

**Deliverable:** Security checklist dla MVP, ADR z podejściem auth, notatka prawna o audio/RODO.

---

## FAZA 2 — Kluczowe komponenty techniczne

Projektowanie poszczególnych podsystemów. Wymaga rozstrzygniętych fundamentów.

---

### Sesja 6: Audio pipeline — ingest i przetwarzanie 🟡

**Status:** Częściowo rozstrzygnięta (2026-02-18)
**Decyzje:** `ai/StageBrain_Architektura_i_Plan.md` §3.5, §3.9

**Co rozstrzygnięte:**

1. **WebSocket binary stream** — chunki audio co 5-10s przez `ws://api/v1/audio/stream`
2. **Web Audio API + MediaRecorder** w przeglądarce Chrome na laptopie przy FOH
3. **Format**: PCM 16-bit, 16kHz, mono (~32 kbps). Z przeglądarki: Opus/WebM → serwer dekoduje do PCM
4. **Ring buffer** w pamięci, okna 5-10s
5. **librosa**: RMS Energy, Spectral Centroid, Zero-Crossing Rate, Spectral Rolloff
6. **YAMNet** (TFLite/ONNX): klasyfikacja zdarzeń (Applause, Cheering, Crowd, Silence, Music)
7. **Latency target**: < 15s end-to-end (5-10s okno + processing + broadcast)
8. **Fallback**: prosty Python script (pyaudio + websocket-client) jeśli przeglądarka nie wystarczy
9. **ProcessPoolExecutor** dla CPU-intensive obliczeń (mitygacja GIL)

**Co do doprecyzowania przy implementacji (sesje impl. 8-9):**
- Szczegóły dekodowania Opus/WebM → PCM na serwerze
- Konfiguracja ring buffer (rozmiar, overlap okien)
- Testowanie z różnymi źródłami audio (mikrofon ambient, audience mic, FOH feed — do ustalenia z TINAP)
- Syntetyczne dane audio do testów pipeline

---

### Sesja 7: Engagement score — metryka energii 🟡

**Status:** Częściowo rozstrzygnięta (2026-02-18)
**Decyzje:** `ai/StageBrain_Architektura_i_Plan.md` §3.5

**Co rozstrzygnięte:**

1. **Engagement score v1**: ważona suma (prosta formuła na start, iteracja po danych z testów)
   ```
   engagement_score = f(rms_energy_normalized, spectral_brightness,
                        crowd_event_type, crowd_event_confidence,
                        trend_last_3_windows, venue_calibration_offset)
   ```
2. **Kalibracja manualna przed show**: operator wybiera preset (typ venue, pojemność, gatunek) + ręczne nadpisanie parametrów
3. **Presety**: hala, stadion, klub, open air — ustawiają baseline energy threshold, czułość klasyfikatora, normalizację głośności
4. **Trend**: rosnący/malejący/stabilny (ostatnie 3 okna)

**Co do doprecyzowania przy implementacji (sesja impl. 9):**
- Dokładne wagi formuły engagement score
- Agregacja: rolling window vs EMA — do ustalenia empirycznie
- Normalizacja per pojemność venue
- Walidacja: porównanie z oceną showcallera po pilocie
- Profile gatunkowe: predefiniowane presety vs per-artysta

---

### Sesja 8: Silnik rekomendacji i ML 🟡

**Status:** Częściowo rozstrzygnięta (2026-02-18)
**Decyzje:** `ai/StageBrain_Architektura_i_Plan.md` §3.6

**Co rozstrzygnięte:**

1. **LightGBM** — gradient boosting, szybki, interpretowalny
2. **Hybrid approach**: ML + fallback regułowy (jeśli confidence < threshold)
3. **Features per utwór**: energia engagement, trend (3 okna), pozycja w setliście, historyczna skuteczność, wariant full/short, tempo/BPM, gatunek, kontrast vs poprzedni segment
4. **Target**: "skuteczność" = zmiana engagement score po zagraniu utworu
5. **Cold start**: dane syntetyczne + reguły eksperckie od TINAP, potem fine-tune na realnych danych
6. **Model w procesie backendowym** (nie osobny serwis)
7. **Log rekomendacji + decyzji operatora** → feedback loop do treningu

**Co do doprecyzowania przy implementacji (sesja impl. 13):**
- Reguły twarde (constraints) — do ustalenia z TINAP
- Dokładny format reguł (hardcoded na start, konfiguracja JSON w przyszłości)
- Prezentacja: top 3-5 z confidence score + expected engagement change
- Generator danych syntetycznych do pierwszego treningu

---

### Sesja 9: Kontrola czasu i scenariusze odzysku

**Cel:** Zaprojektować mechanizm śledzenia czasu, prognozowania i generowania scenariuszy.

**Zależności:** Sesja 4 (model danych)

**Kontekst:**
- Druga kluczowa funkcja systemu (obok engagement)
- Opóźnienia są codziennością koncertów — system musi pomóc je zarządzać
- Konsekwencje: kary finansowe, konflikty z obiektem, stres artysty

**Pytania do rozstrzygnięcia:**

1. Model czasu:
   - Jak reprezentować "plan" vs "rzeczywistość"?
   - `PlannedTimeline` vs `ActualTimeline` vs `Delta`?
   - Granularność: per utwór? Per segment? Per element (intro, main, outro)?
2. Śledzenie czasu na żywo:
   - Skąd system wie, że utwór się zaczął/skończył?
     - Manual trigger (operator klika "start"/"stop")?
     - Auto-detection z audio (beat matching do timecode)?
     - Timecode sync?
   - Co gdy operator nie kliknie na czas?
3. Prognozowanie:
   - Proste: `czas_do_końca = suma_pozostałych_planowanych_czasów + aktualne_opóźnienie`
   - Z wariantami: "jeśli full → +3min, jeśli short → -2min, jeśli pominiesz → -5min"
   - Probabilistyczne: uwzględnienie typowego overrun per utwór z historii?
4. Generowanie scenariuszy odzysku:
   - Skąd system wie, jakie opcje są dostępne? (które utwory można skrócić/pominąć)
   - Jak prezentować scenariusze? ("Opcja A: skróć X i Y → -4min, Opcja B: pomiń Z → -5min")
   - Ile scenariuszy pokazywać? (top 3? wszystkie możliwe?)
   - Constraints: "nie pomiń hitu", "po pirotechnice musi być przerwa"
5. Alerty i progi:
   - Kiedy system sygnalizuje problem? (np. > 2min opóźnienia? > 5min?)
   - Konfigurowalne progi per show?
   - Kolor/ikona: zielony → żółty → czerwony?
6. Bufor czasowy:
   - Czy setlista ma planowany bufor? Jak go uwzględnić?
   - Dynamiczny bufor: "masz jeszcze N min luzu"?

**Deliverable:** Algorytm prognozowania, format scenariuszy, schema timeline events, ADR.

---

### Sesja 10: Real-time communication i event architecture ✅

**Status:** Rozstrzygnięta (2026-02-18)
**Decyzje:** `ai/StageBrain_Architektura_i_Plan.md` §3.4, §3.7

**Podsumowanie decyzji:**

1. **Natywny WebSocket (FastAPI)** — full-duplex, bidirectional
   - `ws://api/v1/audio/stream` — venue → serwer (binary PCM/Opus)
   - `ws://api/v1/live/{show_id}` — serwer ↔ panel (JSON: engagement, rekomendacje, czas, alerty; panel wysyła tagi, akceptacje)
2. **Redis 7 pub/sub** — event bus wewnętrzny: backend publikuje metryki → Redis channel → WebSocket handler broadcastuje do panelu
3. **Reconnect strategy**: exponential backoff na kliencie, stan w Redis → po reconnect klient dostaje aktualny snapshot
4. **Fail-safe**: panel pokazuje ostatni znany stan + "OFFLINE" badge
5. **Skala MVP**: 1 show, 1-5 operatorów, plain WebSocket wystarczy

**Odrzucone:** SSE (brak bidirectionality), NATS/RabbitMQ (overkill), WebRTC (zbyt złożone)

---

### Sesja 11: Stan live show i fail-safe 🟡

**Status:** Częściowo rozstrzygnięta (2026-02-18)
**Decyzje:** `ai/StageBrain_Architektura_i_Plan.md` §3.4, §3.7

**Co rozstrzygnięte:**

1. **Stan live w Redis** — przeżywa restart backendu, szybki odczyt
2. **Fail-safe per komponent** (strategia ogólna):
   - Audio pipeline padł → UI: "brak danych audio", engagement zamrożony
   - ML model padł → fallback na rule engine
   - Frontend stracił połączenie → reconnect + snapshot z Redis, "OFFLINE" badge
   - Cały backend padł → koncert idzie klasycznie (human-in-the-loop)
3. **Health endpoint** (`/health`) + structured logging (JSON)
4. **Reconnect**: exponential backoff, po reconnect klient dostaje aktualny snapshot z Redis

**Co do doprecyzowania przy implementacji (sesja impl. 17):**
- Częstotliwość snapshot do bazy (co ile sekund?)
- Recovery flow: automatyczny vs manualny po restarcie
- Graceful degradation UI: które sekcje wyszarzone vs ukryte
- Pre-show checklist / go-no-go dashboard
- Heartbeat na WebSocket (interwał, timeout)

---

## FAZA 3 — Delivery i operacje

Wszystko, co potrzebne do dostarczenia, przetestowania i uruchomienia systemu.

---

### Sesja 12: API design i kontrakty

**Cel:** Zaprojektować API (REST + WebSocket) między frontendem a backendem.

**Zależności:** Sesja 3 (architektura), Sesja 10 (eventy)

**Pytania do rozstrzygnięcia:**

1. Styl API:
   - REST (CRUD) + WebSocket (real-time)?
   - GraphQL (elastyczne query) + subscriptions?
   - tRPC (end-to-end type safety, jeśli TS na obu końcach)?
2. Kluczowe endpointy REST (propozycja do zweryfikowania):
   - `POST /shows` — utwórz show
   - `GET/PUT /shows/:id/setlist` — zarządzaj setlistą
   - `POST /shows/:id/start` — rozpocznij show
   - `POST /shows/:id/songs/:id/start` — rozpocznij utwór
   - `POST /shows/:id/tags` — dodaj manualny tag
   - `GET /shows/:id/timeline` — historia eventów
   - `GET /shows/:id/report` — raport post-show
   - `GET /venues` / `POST /venues/:id/calibration`
3. Kontrakty WebSocket:
   - Jakie wiadomości server → client? (engagement_update, time_update, recommendation, alert)
   - Jakie wiadomości client → server? (tag, song_action, recommendation_response)
   - Format wiadomości: JSON z `type` + `payload`?
4. Wersjonowanie API (v1)?
5. Error handling i format błędów (RFC 7807 Problem Details?)?
6. Dokumentacja API:
   - OpenAPI/Swagger (auto-generated)?
   - Postman collection?
7. Rate limiting i pagination?

**Deliverable:** OpenAPI spec (draft), WebSocket message catalog, ADR z wyborem stylu API.

---

### Sesja 13: Panel post-show, eksport danych i raporty

**Cel:** Zaprojektować system analityki po koncercie.

**Zależności:** Sesja 4 (model danych), Sesja 12 (API)

**Pytania do rozstrzygnięcia:**

1. Panel post-show — co zawiera?
   - Timeline koncertu (oś czasu z wydarzeniami)
   - Krzywa engagement score w czasie
   - Heatmap: które momenty show miały najwyższą/najniższą energię
   - Lista decyzji (rekomendacje zaakceptowane / odrzucone)
   - Manual tagi z komentarzami
   - Porównanie plan vs rzeczywistość (czas)
   - Anomalie i alerty, które wystąpiły
2. Eksport danych — formaty:
   - CSV (surowe dane)
   - JSON (strukturalne)
   - PDF (wizualny raport)
   - Który format jest priorytetem?
3. Automatyczne raporty:
   - Kiedy generowane? (automatycznie po zakończeniu show? triggered?)
   - Co zawierają? (summary, highlights, areas of concern)
   - Czy AI/LLM generuje opis tekstowy? Czy to templated text?
   - Kto je otrzymuje? (email? link do panelu?)
4. Porównanie między koncertami:
   - Porównanie engagement curve między datami na tej samej trasie?
   - Średnie metryki per utwór across shows?
   - To MVP czy post-MVP?
5. Retencja danych:
   - Jak długo przechowujemy surowe dane audio (jeśli w ogóle)?
   - Jak długo przechowujemy metryki i logi?
   - Archiwizacja starych show?

**Deliverable:** Wireframe panelu post-show, schema raportów, ADR z podejściem do eksportu.

---

### Sesja 14: Infrastruktura i deployment ✅

**Status:** Rozstrzygnięta (2026-02-18)
**Decyzje:** `ai/StageBrain_Architektura_i_Plan.md` §3.8

**Podsumowanie decyzji:**

1. **Hetzner Cloud CPX31** (rekomendacja) — 4 vCPU AMD, 8 GB RAM, 160 GB SSD, ~68 PLN/mies.
2. **Docker Compose** na VPS — dev i produkcja
   - Serwisy: api, worker (opcjonalny), web (Nginx), postgres (+TimescaleDB), redis, caddy (reverse proxy + auto SSL)
3. **GitHub Actions** — lint + test na PR, auto-deploy: build → push images → SSH → pull → up
4. **Self-hosted baza** na tym samym VPS (PostgreSQL + TimescaleDB w kontenerze)
5. **Caddy** — reverse proxy + automatyczny SSL (Let's Encrypt)
6. **Backup**: daily PostgreSQL dump → Object Storage (Hetzner/Cloudflare R2)
7. **Monitoring minimum**: Sentry (error tracking), Uptime Robot (health), structured logging (JSON)

**Odrzucone:** AWS/GCP (za drogo na MVP), Kubernetes (overkill), managed DB (dodatkowy koszt)

---

### Sesja 15: Testing strategy

**Cel:** Zdefiniować, co i jak testujemy na etapie MVP.

**Zależności:** Sesja 6 (audio pipeline), Sesja 8 (rekomendacje), Sesja 11 (fail-safe)

**Kontekst:**
- 10 tygodni na MVP — nie ma czasu na 100% coverage
- Pilot na realnym koncercie w maju — musi działać
- Audio pipeline i real-time to najtrudniejsze do testowania

**Pytania do rozstrzygnięcia:**

1. Piramida testów — co priorytetowe?
   - Unit testy: engagement score calculation, time forecast, recommendation engine
   - Integration testy: audio pipeline end-to-end, API endpoints
   - E2E testy: cały flow "start show → play songs → get recommendations → end show"
   - Ile coverage jest realistyczne w 10 tygodni?
2. Testowanie audio pipeline:
   - Zestaw nagrań testowych (synthetic + real recordings)
   - Golden tests: "ten audio clip → oczekiwany engagement score w zakresie X-Y"
   - Jak symulować różne venue i gatunki?
3. Testowanie real-time:
   - Symulacja show (odtwarzanie nagrania + timeline events)
   - Load test: czy system wytrzymuje 90-minutowy ciągły stream?
   - Network degradation: co przy packet loss, high latency?
4. Testowanie UI pod stresem:
   - User testing z TINAP? (showcaller używa panelu w symulowanych warunkach)
   - Responsywność: tablet, laptop, różne rozdzielczości
   - Ciemne środowisko, rękawiczki, zmęczenie — czy UI jest nadal czytelny?
5. Testowanie fail-safe:
   - Chaos testing: ubij audio pipeline w trakcie show — co się dzieje?
   - Reconnect testing: rozłącz WebSocket — czy UI się odtworzy?
   - Database restart — czy show jest kontynuowany?
6. Acceptance testing z TINAP:
   - Kryteria akceptacji: co musi działać, żeby pilot się odbył?
   - Dry run na "koncercie testowym" (nagranie odtworzone na głośnikach w hali)?
   - Go/no-go checklist przed realnym pilotem

**Deliverable:** Test plan, lista przypadków testowych (critical path), strategy document.

---

### Sesja 16: Developer experience i projekt setup 🟡

**Status:** Częściowo rozstrzygnięta (2026-02-18)
**Decyzje:** `ai/StageBrain_Architektura_i_Plan.md` §6

**Co rozstrzygnięte:**

1. **Mono-repo** — jedno repozytorium
2. **Struktura katalogów** zdefiniowana:
   ```
   /apps
     /api          — backend (FastAPI / Python)
     /web          — frontend (React / TypeScript / Vite / shadcn/ui)
   /packages
     /shared-types  — schematy API (generowane z OpenAPI)
   /infra           — Docker, Dockerfiles
   /ai              — dokumenty projektu
   /scripts         — narzędzia deweloperskie, seed data
   ```
3. **`docs/` to template OpsDesk** — do usunięcia/przerobienia (decyzja otwarta, patrz §9.1)
4. **Docker Compose** do lokalnego developmentu (postgres + redis), backend i frontend odpalane natywnie

**Co do doprecyzowania przy implementacji (sesja impl. 1-3):**
- Linter/formatter: Ruff (Python), ESLint/Biome (TypeScript) — do decyzji
- Pre-commit hooks (Husky + lint-staged) — do decyzji
- Commit convention — patrz `.claude/git-conventions.md`
- Git workflow — do decyzji (rekomendacja: GitHub Flow)
- Hot reload config (uvicorn --reload + Vite HMR)

---

## Diagram zależności

```
Sesja 1 (Backend) ──────┐
                         ├──→ Sesja 3 (Architektura) ──┬──→ Sesja 5 (Security)
Sesja 2 (Frontend) ─────┘                              │
                                                        ├──→ Sesja 10 (Real-time) ──→ Sesja 12 (API)
                                                        │                                    │
                                                        ├──→ Sesja 14 (Infra)                │
                                                        │                                    │
                                                        └──→ Sesja 4 (Dane) ─────┬──→ Sesja 6 (Audio) ──→ Sesja 7 (Engagement) ──→ Sesja 8 (ML/Rekom.)
                                                                                  │
                                                                                  ├──→ Sesja 9 (Czas)
                                                                                  │
                                                                                  ├──→ Sesja 11 (Live state) ←── Sesja 10
                                                                                  │
                                                                                  └──→ Sesja 13 (Post-show) ←── Sesja 12


Sesja 16 (DX/Setup) ←── Sesja 1 + 2 + 3  (można prowadzić równolegle z Fazą 2)

Sesja 15 (Testing) ←── Sesja 6 + 8 + 11   (na końcu, gdy komponenty zaprojektowane)
```

---

## Sesje, które można prowadzić równolegle

| Równolegle | Sesje |
|------------|-------|
| Start | 1 (Backend) + 2 (Frontend) |
| Po sesji 3 | 4 (Dane) + 5 (Security) + 10 (Real-time) + 14 (Infra) + 16 (DX) |
| Po sesji 4 | 6 (Audio) + 9 (Czas) |
| Po sesji 10+4 | 11 (Live state) + 12 (API) |
| Po sesji 7 | 8 (ML/Rekom.) |
| Po sesji 12 | 13 (Post-show) |
| Na końcu | 15 (Testing) |

---

## Checklist postępu

| # | Sesja | Status | Notatki | Data |
|---|-------|--------|---------|------|
| 1 | Stack backend | ✅ Rozstrzygnięta | Python 3.12+ / FastAPI. Patrz §3.1 | 2026-02-18 |
| 2 | Stack frontend | ✅ Rozstrzygnięta | React 19 / TS / Vite / Tailwind / **shadcn/ui**. Patrz §3.2 | 2026-02-19 |
| 3 | Architektura systemu | ✅ Rozstrzygnięta | Modular monolith, jeden serwis FastAPI. Patrz §5, §6 | 2026-02-18 |
| 4 | Baza danych i model danych | 🟡 Wystarczy na start | PostgreSQL 16 + TimescaleDB, SQLAlchemy 2.0. Detale kolumn przy impl. | 2026-02-18 |
| 5 | Security, auth i prywatność | ⬜ Otwarta | Rekomendacja: prosty JWT, jedno konto. Do rozstrzygnięcia przy sesji impl. 2 | — |
| 6 | Audio pipeline | 🟡 Wystarczy na start | WebSocket binary, librosa + YAMNet, Web Audio API. Detale przy impl. | 2026-02-18 |
| 7 | Engagement score | 🟡 Wystarczy na start | Ważona suma v1, kalibracja manualna. Wagi do iteracji po testach | 2026-02-18 |
| 8 | Silnik rekomendacji i ML | 🟡 Wystarczy na start | LightGBM + fallback regułowy. Features zarysowane | 2026-02-18 |
| 9 | Kontrola czasu | ⬜ Otwarta | Plan implementacji jest, detale algorytmu przy sesji impl. 12 | — |
| 10 | Real-time communication | ✅ Rozstrzygnięta | WebSocket (FastAPI) + Redis pub/sub. Patrz §3.4, §3.7 | 2026-02-18 |
| 11 | Stan live show i fail-safe | 🟡 Wystarczy na start | Stan w Redis, fail-safe per komponent. Detale przy sesji impl. 17 | 2026-02-18 |
| 12 | API design i kontrakty | ⬜ Otwarta | Endpointy zarysowane, OpenAPI spec generowany automatycznie z FastAPI | — |
| 13 | Post-show, eksport, raporty | ⬜ Otwarta | Zakres opisany w planie. Architektura przy sesji impl. 15-16 | — |
| 14 | Infrastruktura i deployment | ✅ Rozstrzygnięta | Hetzner VPS, Docker Compose, Caddy, GitHub Actions. Patrz §3.8 | 2026-02-18 |
| 15 | Testing strategy | ⬜ Otwarta | Rekomendacja: 70%+ core logic. Do rozstrzygnięcia w trakcie impl. | — |
| 16 | Developer experience | 🟡 Wystarczy na start | Mono-repo, struktura zdefiniowana. Tooling przy sesji impl. 1 | 2026-02-18 |

> **Referencje:**
> - Decyzje architektoniczne: `ai/StageBrain_Architektura_i_Plan.md`
> - Plan sesji implementacyjnych: `ai/StageBrain_Strategia_Pracy_z_AI.md`
> - Otwarte tematy: `ai/StageBrain_Architektura_i_Plan.md` §9

---

## Podejście do otwartych sesji

Otwarte sesje (⬜) i częściowo rozstrzygnięte (🟡) **nie blokują implementacji**. Będą doprecyzowywane just-in-time przy odpowiednich sesjach implementacyjnych:

| Sesja architektoniczna | Rozstrzygana przy sesji implementacyjnej |
|------------------------|------------------------------------------|
| 5 — Security/auth | Sesja impl. 2 (FastAPI boilerplate) |
| 9 — Kontrola czasu | Sesja impl. 12 (kontrola czasu + curfew) |
| 12 — API design | Automatycznie — FastAPI generuje OpenAPI spec |
| 13 — Post-show | Sesja impl. 15-16 (post-show analytics) |
| 15 — Testing strategy | Na bieżąco — testy razem z kodem w każdej sesji |
| 16 — DX (tooling) | Sesja impl. 1 (szkielet monorepo) |
