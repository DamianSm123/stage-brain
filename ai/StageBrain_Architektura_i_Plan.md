# StageBrain — Architektura, Decyzje Technologiczne i Plan Implementacji

> **Dokument referencyjny** — scalenie dyskusji architektonicznej z 2026-02-18.
> Zawiera: decyzje technologiczne, uzasadnienia, plan implementacji, otwarte tematy.
> Służy jako źródło wiedzy dla kolejnych sesji pracy nad projektem.

**Status**: Proposed (do zatwierdzenia przed rozpoczęciem implementacji)
**Data**: 2026-02-18
**Kontekst**: StageBrain MVP Plus — Wariant B (10 tygodni)
**Dokumentacja produktowa**: `ai/StageBrain_Dokumentacja_Kompletna.md`

---

## Spis treści

- [1. Kontekst i założenia wejściowe](#1-kontekst-i-założenia-wejściowe)
- [2. Ustalenia z zespołem (Q&A)](#2-ustalenia-z-zespołem-qa)
- [3. Decyzje architektoniczne](#3-decyzje-architektoniczne)
  - [3.1 Backend: Python 3.12+ / FastAPI](#31-backend-python-312--fastapi)
  - [3.2 Frontend: React 19 / TypeScript / Vite / Tailwind](#32-frontend-react-19--typescript--vite--tailwind)
  - [3.3 Baza danych: PostgreSQL 16 + TimescaleDB](#33-baza-danych-postgresql-16--timescaledb)
  - [3.4 Cache i real-time: Redis 7](#34-cache-i-real-time-redis-7)
  - [3.5 Audio pipeline: librosa + YAMNet (hybrid)](#35-audio-pipeline-librosa--yamnet-hybrid)
  - [3.6 ML ranking utworów: LightGBM](#36-ml-ranking-utworów-lightgbm)
  - [3.7 Real-time communication: WebSocket](#37-real-time-communication-websocket)
  - [3.8 Deployment: Docker Compose na VPS](#38-deployment-docker-compose-na-vps)
  - [3.9 Audio input na venue: Web Audio API](#39-audio-input-na-venue-web-audio-api)
- [4. Schemat danych](#4-schemat-danych)
- [5. Diagramy architektury](#5-diagramy-architektury)
- [6. Struktura repozytorium](#6-struktura-repozytorium)
- [7. Ryzyka architektoniczne](#7-ryzyka-architektoniczne)
- [8. Plan implementacji — 10 tygodni](#8-plan-implementacji--10-tygodni)
- [9. Otwarte tematy do dalszej dyskusji](#9-otwarte-tematy-do-dalszej-dyskusji)
- [10. Tabela podsumowująca stack](#10-tabela-podsumowująca-stack)

---

## 1. Kontekst i założenia wejściowe

StageBrain to **system wsparcia decyzyjnego w czasie rzeczywistym** dla showcallera / reżysera / producenta koncertu. Analizuje audio publiczności, oblicza metrykę zaangażowania, rekomenduje kolejność utworów i monitoruje czas do curfew.

**Kluczowe wymagania architektoniczne:**

| Wymaganie | Opis |
|-----------|------|
| Real-time processing | Analiza audio w oknach 5-10s z niską latencją |
| ML pipeline | Klasyfikacja zdarzeń dźwiękowych + ranking utworów |
| Operator UI | Panel odporny na stres, szybkie decyzje, real-time updates |
| Fail-safe | Awaria systemu nie blokuje koncertu (human-in-the-loop) |
| Budżet infra | 200-800 PLN/miesiąc |
| Timeline | 10 tygodni do pilota (maj 2026) |
| Skala MVP | Jeden koncert na raz, jeden operator |
| Tylko web | Bez aplikacji mobilnej — panel w przeglądarce (tablet/laptop) |

**Czego NIE realizujemy (out of scope):**
- Wariant C: tryb offline/edge, role użytkowników, hardening
- Moduł wideo, integracje zewnętrzne, multi-venue/multi-tour
- Rozpoznawanie twarzy, analiza emocji jednostek
- Automatyzacja koncertu, sterowanie oświetleniem/pirotechniką

---

## 2. Profil dewelopera i ustalenia z zespołem

### 2.1 Realny profil dewelopera

> **WAŻNE — kontekst dla przyszłych sesji AI:**
> Główny deweloper to **frontend developer** (React / TypeScript). Nie ma doświadczenia z backendem — ani w Pythonie, ani w TypeScript (NestJS/Express). Backend w całości jest pisany przez AI (Claude). Deweloper reviewuje kod, rozumie logikę, ale nie pisze backendu samodzielnie.

**Co to oznacza dla pracy z AI:**
- AI pisze cały kod backendu (Python/FastAPI) — deweloper reviewuje i zatwierdza
- Deweloper samodzielnie pracuje nad frontendem (React/TypeScript)
- Zmiany w backendzie wymagają sesji z AI — scope zmian powinien być jasno opisany
- Debugging backendu: AI analizuje logi i proponuje fixy; deweloper stosuje
- Architektura celowo najprostsza z możliwych — mniej ruchomych części = mniej problemów

### 2.2 Ustalenia (Q&A z sesji architektonicznej)

| Pytanie | Odpowiedź | Wpływ na architekturę |
|---------|-----------|----------------------|
| Doświadczenie technologiczne? | **Frontend: React/TS. Backend: brak — AI pisze.** | All-Python (FastAPI) — najprostszy framework backendowy, AI popełnia w nim najmniej błędów |
| Preferencje co do cloud providera? | **Bez preferencji** — decyzja architektoniczna | Wolna ręka → rekomendacja: Hetzner Cloud (najlepszy koszt) lub DigitalOcean (prostota) |
| Urządzenie do przechwytywania audio na venue? | **Jeszcze nie wiadomo** — do ustalenia | Architektura agnostyczna wobec źródła audio. Uniwersalny WebSocket ingest. |
| Aplikacja mobilna? | **Nie, tylko web** | SPA w React, nie potrzeba React Native/Flutter |
| Kalibracja per venue? | **Ręczna przed show** — operator ustawia parametry | Presety venue + ręczne korekty. Bez auto-kalibracji na MVP. |
| Format setlisty? | **Nie wiadomo** — do ustalenia z TINAP | Elastyczny import (CSV na start, rozszerzamy po warsztacie z TINAP). |
| Hybrid (TS+Python) vs All-Python? | **All-Python** — potwierdzone po dyskusji | Jeden serwis, zero integracji między językami, prostsze dla AI |

---

## 3. Decyzje architektoniczne

### 3.1 Backend: Python 3.12+ / FastAPI

**Decyzja**: Cały backend w Pythonie z frameworkiem FastAPI.

**Rozważane alternatywy i dlaczego odrzucone:**

| Alternatywa | Dlaczego odrzucona |
|-------------|-------------------|
| NestJS (TypeScript) | Ekosystem audio/ML znacząco słabszy. Wymusza polyglot (NestJS + Python microservice). Ponadto: NestJS ma złożone patterns (DI, moduły, guardy, pipe'y) — zbędna złożoność gdy AI pisze backend. |
| Hybrid (NestJS + Python service) | Rozważany poważnie, odrzucony. Deweloper nie zna NestJS patterns (controllers, services, DI) — korzyść "70% kodu w TS" nie istnieje. Dwa serwisy + integracja = więcej miejsc na błędy. |
| Go | Doskonała wydajność, ale brak ekosystemu ML/audio. |
| Elixir/Phoenix | Idealny do real-time (Erlang VM), ale brak ekosystemu ML i nowy język. |
| Django | Synchroniczny, brak natywnych WebSocketów (wymaga Channels), cięższy. |

**Uzasadnienie:**
- Ekosystem audio/ML: librosa, torchaudio, YAMNet, LightGBM, NumPy, SciPy — natywne w Pythonie
- FastAPI: async/await, natywne WebSockety, automatyczna dokumentacja OpenAPI, Pydantic v2
- **Najprostszy framework backendowy** — endpoint to funkcja z dekoratorem, bez klas/DI/modułów. Idealne gdy AI pisze kod (mniej abstrakcji = mniej błędów AI)
- **AI generuje mniej błędów w FastAPI niż w NestJS** — mniej plików na feature (1-2 vs 4-6), mniej warstw abstrakcji do pomylenia
- Jeden język na backendzie = prostsze CI/CD, debugging, onboarding
- **Jeden serwis = zero integracji** — nie ma API kontraktu między serwisami, nie ma serializacji między językami, nie ma "serwis A zwraca X a serwis B oczekuje Y"
- Wydajność: przy skali MVP (1 koncert, 1 operator) Python z uvicorn jest wystarczający

**Konsekwencje:**
- (+) Najszybszy development dla pipeline audio + ML + API
- (+) Jeden język = jedna konfiguracja lintingu, testów, CI
- (+) Prostszy debugging — jeden serwis, jeden zestaw logów, AI analizuje jedno miejsce
- (+) Python jest czytelny nawet bez znajomości języka — `if show.status == "live":` jest zrozumiałe
- (-) Python wolniejszy niż Go/Rust — akceptowalne przy obecnej skali
- (-) GIL — mitygacja: asyncio dla I/O, ProcessPoolExecutor dla CPU-intensive audio
- (-) Deweloper nie zna Pythona — mitygacja: AI pisze cały backend, Python naturalnie się przyswaja przez code review

**Architektura backend: Modular/Domain-Based**

Wzorzec organizacji kodu backendowego: **flat domain modules** (inspiracja: zhanymkanov/fastapi-best-practices, Netflix Dispatch).

Każdy moduł domenowy zawiera stały zestaw plików:

| Plik | Rola |
|------|------|
| `router.py` | Thin HTTP endpoints (FastAPI `APIRouter`) |
| `service.py` | Logika biznesowa (plain async functions) |
| `schemas.py` | Pydantic v2 request/response (XxxCreate, XxxResponse, XxxUpdate) |
| `dependencies.py` | Annotated FastAPI deps, reusable per moduł |
| `exceptions.py` | Domain exceptions (router konwertuje na HTTP) |
| `ws.py` | WebSocket handler (tylko moduły z real-time: `audio/`, `shows/`) |

Pliki dodatkowe per domena (tylko gdzie potrzebne):
- `pipeline.py`, `classifier.py` — audio processing (w `audio/`)
- `ml_model.py`, `fallback.py` — ML inference (w `recommendations/`)
- `scoring.py` — engagement score formula (w `engagement/`)
- `calibration.py` — logika kalibracji (w `venues/`)
- `reports.py` — generowanie raportów (w `analytics/`)

**Kluczowe decyzje strukturalne:**

- **Modele ORM centralizowane w `models/`** — nie per-moduł. Modele mają gęste cross-domain relacje (Show → Setlist → Segment → SegmentVariant, Show → Venue → CalibrationPreset). Rozdzielenie per moduł tworzy circular imports. Centralizacja upraszcza Alembic autogen i daje pełny widok schematu w jednym miejscu.
- **WebSocket handlery co-located z domeną** — `audio/ws.py` (binary audio ingest), `shows/ws.py` (live panel JSON broadcast). Bez osobnego top-level `websocket/` modułu — AI i developer mają cały kod domeny w jednym folderze.
- **ML code w dedykowanych plikach** — `service.py` orchestruje, dedykowane pliki (`pipeline.py`, `ml_model.py`) zawierają inference. Jasne rozdzielenie logiki biznesowej od ML.

**Dlaczego flat modular (a nie Clean Architecture / DDD / Vertical Slice):**
- Backend serwuje JSON, nie renderuje zagnieżdżonych komponentów — cross-domain to proste importy między service'ami, nie wymaga warstw kompozycji.
- Clean Architecture / DDD dodają 2-4x więcej plików (porty, adaptery, agregaty, repozytoria) bez proporcjonalnej korzyści przy umiarkowanej złożoności domeny StageBrain.
- FastAPI jest zaprojektowane pod ten wzorzec — `APIRouter` per moduł, `Depends()` jako DI, Pydantic per moduł.
- AI pisze cały backend — flat structure z identycznym zestawem plików per moduł = zero ambiguity, zero indirection.

**Kluczowe biblioteki:**

| Biblioteka | Rola |
|-----------|------|
| `fastapi` + `uvicorn` | Serwer ASGI |
| `pydantic` v2 | Walidacja i serializacja |
| `sqlalchemy` 2.0 + `alembic` | ORM i migracje DB |
| `asyncpg` | Async driver PostgreSQL |
| `redis` (aioredis) | Async Redis client |
| `librosa` + `soundfile` | Audio feature extraction |
| `tensorflow-lite` lub `onnxruntime` | Inferencja YAMNet |
| `lightgbm` | ML ranking utworów |
| `pytest` + `httpx` | Testy |
| `celery` lub `arq` | Task queue (raporty, eksport) |

---

### 3.2 Frontend: React 19 / TypeScript / Vite / Tailwind

**Decyzja**: Single Page Application w React z TypeScript, budowane przez Vite.

**Rozważane alternatywy:**

| Alternatywa | Dlaczego odrzucona |
|-------------|-------------------|
| Next.js | SSR/SSG niepotrzebne (nie SEO app), dodaje złożoność. Panel operatora to czysta SPA. |
| Vue 3 | Porównywalny, ale mniejszy ekosystem komponentów wizualizacyjnych. |
| Svelte/SvelteKit | Mniejszy bundle, ale mniejszy ekosystem i mniej devów na rynku. |

**Specyfika UI panelu operatora (wymagania UX backstage):**
- **Ciemny motyw** (domyślny) — backstage jest ciemny, jasny ekran oślepia
- **Duże elementy dotykowe** — min. 48px, obsługa na tablecie w rękawiczkach
- **Wysoki kontrast** — kolory statusowe (zielony/żółty/czerwony) jasno czytelne
- **Minimalna ilość kliknięć** do decyzji (1-2 tapy max)
- **Stabilny layout** — żadnych przesunięć elementów przy aktualizacji danych

**Biblioteki frontend:**

| Biblioteka | Rola |
|-----------|------|
| `react` 19 + `typescript` 5.x | Framework + type safety |
| `vite` | Build tool (szybki HMR) |
| `tailwindcss` | Utility-first CSS, ciemny motyw natywnie |
| `shadcn/ui` | Design system — gotowe, dostępne komponenty (Radix UI + Tailwind). Ciemny motyw natywnie. Komponenty kopiowane do projektu (pełna kontrola nad kodem). |
| `zustand` | State management (lekki, prosty) |
| `recharts` lub `visx` | Wykresy engagement timeline |
| `@tanstack/react-table` | Setlista, logi, dane tabelaryczne |
| `openapi-typescript` + `openapi-fetch` | Generowane typy i klient API z OpenAPI spec backendu |

**Dlaczego shadcn/ui:**
- Oparty na Radix UI — dostępność (a11y) i duże touch targets out of the box
- Tailwind-native — spójna integracja ze stylem projektu, zero konfliktu CSS
- Ciemny motyw jako default — kluczowe dla backstage (ciemne otoczenie)
- Nie jest biblioteką npm — komponenty kopiowane do `src/shared/ui/` (warstwa shared w FSD), pełna kontrola nad customizacją
- Podejście code-first do UI: shadcn daje profesjonalny design system od razu, iterujemy wizualnie bez Figmy

**Architektura frontend: Feature-Sliced Design (FSD)**

Wzorzec organizacji kodu frontendowego: **FSD v2** (https://feature-sliced.design).

Warstwy (od najwyższej do najniższej):

| Warstwa | Rola w StageBrain |
|---------|-------------------|
| `app/` | Router, providers, global error boundaries |
| `pages/` | Kompozycje per route — SetupPage, LivePage, PostShowPage, AudioSourcePage |
| `widgets/` | Samodzielne bloki UI — EngagementGauge, CurfewClock, RecommendationPanel, SetlistEditor itp. |
| `features/` | Akcje użytkownika — StartShow, ControlSegment, AcceptRecommendation, AddTag, ImportSetlist itp. |
| `entities/` | Modele domenowe + bazowe UI — Show, Segment, Venue, EngagementMetric, Recommendation |
| `shared/` | shadcn/ui, openapi-fetch client, WebSocket manager, utils, typy globalne |

**Reguły importów (strict):** warstwa importuje tylko z warstw poniżej. Slices na tej samej warstwie nie importują z siebie nawzajem. Każdy slice eksponuje public API przez `index.ts`.

**Dlaczego FSD (a nie Bulletproof React / flat features):**
- **Entity sharing** — Segment, Show, Venue są używane w 3+ stronach. Warstwa `entities/` rozwiązuje to by design, bez ad-hoc przenoszenia do shared.
- **Kompozycja live panelu** — 6+ niezależnych bloków UI (gauge, clock, recommendations, timeline, tags, segment control) to naturalne widgety. Bez warstwy `widgets/` feature live-panel staje się god-folderem.
- **Nawigacja AI w kodzie** — strict rules = zero ambiguity. AI (współautor backendu i części frontendu) zawsze wie gdzie szukać i tworzyć pliki.
- **shadcn/ui** — komponenty w `shared/ui/`, zero konfliktu z architekturą.

**Segmenty wewnątrz slice'ów:** `ui/`, `model/`, `api/`, `lib/`, `config/` — grupowanie po przeznaczeniu, nie po typie pliku.

**Bridge backend ↔ frontend:**
FastAPI natywnie generuje OpenAPI spec → `openapi-typescript` generuje typy TS → frontend ma type safety bez ręcznego utrzymywania DTO. Zmiana modelu w Pydantic → automatyczna aktualizacja typów w React.

---

### 3.3 Baza danych: PostgreSQL 16 + TimescaleDB

**Decyzja**: PostgreSQL z rozszerzeniem TimescaleDB dla danych time-series.

**Rozważane alternatywy:**

| Alternatywa | Dlaczego odrzucona |
|-------------|-------------------|
| Czysty PostgreSQL | Wystarczający na MVP, ale brak optymalizacji time-series dla post-show analytics |
| PostgreSQL + InfluxDB | Dodatkowa baza = dodatkowy koszt operacyjny |
| MongoDB | Dane setlisty/koncertów są silnie ustrukturyzowane — nie potrzeba schemaless |

**Uzasadnienie TimescaleDB:**
- Extension (nie osobna baza) — zero dodatkowego kosztu operacyjnego
- Hypertable na dane engagement (automatyczne partycjonowanie po czasie)
- Continuous aggregates — pre-obliczone średnie dla post-show analytics
- Kompresja danych historycznych — oszczędność storage
- Dane relacyjne (setlisty, koncerty, venue) w standardowych tabelach PostgreSQL

---

### 3.4 Cache i real-time: Redis 7

**Decyzja**: Redis jako warstwa cache, pub/sub dla real-time broadcast, i opcjonalnie task queue.

**Zastosowania:**
- **Pub/sub**: backend publikuje metryki engagement → Redis channel → WebSocket handler broadcastuje do panelu
- **Cache stanu live**: aktualny segment, czas od startu, energia — szybki read bez query do DB
- **Task queue** (opcjonalnie): generowanie raportów PDF, eksport CSV

**Dlaczego nie in-memory w FastAPI**: Redis dodaje persistence stanu między restartami serwera, gotowość na skalowanie (wiele instancji API), natywny pub/sub.

---

### 3.5 Audio pipeline: librosa + YAMNet (hybrid)

**Decyzja**: Dwuwarstwowe przetwarzanie audio.

**Warstwa 1 — Metryki sygnałowe (librosa):**

| Metryka | Co mierzy |
|---------|----------|
| RMS Energy | Głośność w oknie czasowym (bazowy wskaźnik energii) |
| Spectral Centroid | "Jasność" dźwięku (wysoka = krzyk/oklaski, niska = mruczenie/cisza) |
| Zero-Crossing Rate | Szum vs ton (odróżnia oklaski od skandowania) |
| Spectral Rolloff | Rozkład energii w widmie |

Obliczenia na oknach 5-10s, wynik co ~5s.

**Warstwa 2 — Klasyfikacja zdarzeń (YAMNet):**
- Pre-trenowany model Google (AudioSet, 521 klas)
- Relevantne klasy: Applause, Cheering, Crowd, Chanting, Singing, Silence, Music
- Inferencja przez TensorFlow Lite lub ONNX Runtime
- Wynik: rozkład prawdopodobieństw klas → "typ reakcji publiczności"

**Engagement Score — agregacja:**
```
engagement_score = f(
    rms_energy_normalized,       # 0-1, znormalizowany do kalibracji venue
    spectral_brightness,         # 0-1
    crowd_event_type,            # z YAMNet (oklaski=wysoko, cisza=nisko)
    crowd_event_confidence,      # pewność klasyfikacji
    trend_last_3_windows,        # rosnący/malejący/stabilny
    venue_calibration_offset     # korekta per venue
)
```

Na start: prosta ważona suma. Iteracja formuły po danych z testów.

**Kalibracja per venue (ręczna przed show):**
- Operator wybiera preset: typ venue (hala, stadion, klub, open air), pojemność, gatunek
- Preset ustawia: baseline energy threshold, czułość klasyfikatora, normalizację głośności
- Opcja: ręczne nadpisanie parametrów
- Dane kalibracji zapisywane w `calibration_presets`, powiązane z `venues`

---

### 3.6 ML ranking utworów: LightGBM

**Decyzja**: LightGBM do rankingu rekomendowanych następnych segmentów.

**Rozważane alternatywy:**

| Alternatywa | Dlaczego odrzucona |
|-------------|-------------------|
| Reguły (if/else) | Wariant A — prostsze, ale nie wykorzystuje danych historycznych |
| Deep Learning (transformer/RNN) | Overkill przy małym zbiorze danych, wolna inferencja |
| Collaborative filtering | Wymaga danych z wielu koncertów — na start ich nie mamy |

**Features per utwór:**
- Aktualna energia engagement
- Trend energii (ostatnie 3 okna)
- Pozycja w setliście (% show za nami)
- Historyczna skuteczność segmentu
- Wariant: full vs short
- Tempo/BPM, gatunek
- Kontrast vs poprzedni segment (szybki po wolnym = potencjał)

**Target**: "skuteczność" = zmiana engagement score po zagraniu utworu.

**Start**: trening na danych syntetycznych + reguły eksperckie od TINAP, potem fine-tune na realnych danych.

**Fallback**: Jeśli model ML nie ma wystarczającej pewności (confidence < threshold) → ranking regułowy (prosty scoring: energia utworu × dopasowanie do aktualnego poziomu).

---

### 3.7 Real-time communication: WebSocket

**Decyzja**: Natywny WebSocket (FastAPI) do komunikacji real-time.

**Przepływy:**

| Endpoint | Kierunek | Format | Opis |
|----------|----------|--------|------|
| `ws://api/v1/audio/stream` | Venue → Serwer | Binary (PCM/Opus) | Chunki audio co 5-10s |
| `ws://api/v1/live/{show_id}` | Serwer ↔ Panel | JSON | Engagement, rekomendacje, czas, alerty. Panel wysyła: tagi, akceptacje. |

**Reconnect strategy:**
- Klient: exponential backoff reconnect
- Serwer: stan w Redis → po reconnect klient dostaje aktualny snapshot
- Fail-safe: panel pokazuje ostatni znany stan + "OFFLINE" badge

---

### 3.8 Deployment: Docker Compose na VPS

**Decyzja**: Docker Compose na pojedynczym VPS (Hetzner Cloud lub DigitalOcean).

**Konfiguracja MVP:**
```yaml
services:
  api:          # FastAPI backend (API + WebSocket + Audio processing)
  worker:       # Celery/arq worker (raporty, eksport — opcjonalny)
  web:          # Nginx serwujący React SPA
  postgres:     # PostgreSQL 16 + TimescaleDB
  redis:        # Redis 7
  caddy:        # Reverse proxy + auto SSL (Let's Encrypt)
```

**Rekomendacja VPS:**

| Opcja | Spec | Koszt |
|-------|------|-------|
| **Hetzner CPX31** | 4 vCPU AMD, 8 GB RAM, 160 GB SSD | ~68 PLN/mies. |
| Hetzner CAX21 (ARM) | 4 vCPU, 8 GB RAM | ~32 PLN/mies. (wymaga ARM builds) |
| DigitalOcean Droplet | 4 vCPU, 8 GB RAM | ~195 PLN/mies. |

**CI/CD (GitHub Actions):**
1. Push na `main` → build Docker images → push do GitHub Container Registry
2. SSH do VPS → `docker compose pull` → `docker compose up -d`
3. Alembic migration → restart API

**Backup:**
- PostgreSQL: daily dump → Object Storage (Hetzner/DO Spaces/Cloudflare R2)
- Docker volumes + regularny snapshot VPS

---

### 3.9 Audio input na venue: Web Audio API

**Decyzja**: Przeglądarka Chrome na laptopie przy FOH, Web Audio API do przechwytywania audio.

**Uzasadnienie:**
- Zero instalacji — wystarczy URL
- Web Audio API + MediaRecorder API = wystarczający dostęp do audio
- Fallback: prosty Python script (pyaudio + websocket-client)

**Format audio:**
- Preferowany: PCM 16-bit, 16kHz, mono (~32 kbps)
- Z przeglądarki: MediaRecorder → Opus/WebM → serwer dekoduje do PCM
- Okna: 5-10 sekund → wysyłka jako jeden WebSocket binary frame

**Wymagania sieciowe na venue:**
- Stabilne połączenie (Wi-Fi lub LTE hotspot)
- Bandwidth: ~32-64 kbps (minimalny)
- Latencja: tolerancja do ~2s (system jest analityczny, nie muzyczny)

---

## 4. Schemat danych

**Kluczowe tabele PostgreSQL:**

```
venues                — obiekty koncertowe z parametrami kalibracji
shows                 — konkretne wydarzenia (koncert + venue + data + setlista)
setlists              — setlisty (kolekcja segmentów)
segments              — segmenty/utwory w setliście (kolejność, warianty full/short, czas)
segment_variants      — warianty segmentu (full, short, z czasami)
show_timeline         — faktyczny przebieg koncertu (start/stop segmentów)
engagement_metrics    — [hypertable TimescaleDB] metryki co 5-10s (energia, trend, klasy)
recommendations_log   — log rekomendacji systemu i decyzji operatora
operator_tags         — manualne tagi showcallera (z timestampami)
calibration_presets   — presety kalibracji per venue/gatunek
reports               — wygenerowane raporty post-show
```

**Stany segmentu:** `planned` → `active` → `completed` | `skipped`
**Stany show:** `setup` → `live` → `paused` → `ended`

---

## 5. Diagramy architektury

### 5.1 Architektura kontenerowa (C4 — Container)

```
┌─────────────────────────────────────────────────────────────────┐
│                        StageBrain System                        │
│                                                                 │
│  ┌──────────────┐    WebSocket     ┌──────────────────────────┐│
│  │ Audio Source  │────(binary)────► │     FastAPI Backend      ││
│  │ (Browser/    │                  │                          ││
│  │  Script)     │                  │  ┌─────────┐ ┌────────┐ ││
│  └──────────────┘                  │  │ Audio   │ │ Setlist│ ││
│                                    │  │ Pipeline│ │ & Time │ ││
│  ┌──────────────┐    WebSocket     │  ├─────────┤ ├────────┤ ││
│  │ Operator     │◄───(JSON)──────► │  │ Engage- │ │ Recom- │ ││
│  │ Panel        │                  │  │ ment    │ │ menda- │ ││
│  │ (React SPA)  │    REST API      │  │ Score   │ │ tions  │ ││
│  │              │◄───(JSON)──────► │  ├─────────┤ ├────────┤ ││
│  └──────────────┘                  │  │ Post-   │ │ Core   │ ││
│                                    │  │ Show    │ │ (Auth, │ ││
│                                    │  │ Analyt. │ │  DB)   │ ││
│                                    │  └─────────┘ └────────┘ ││
│                                    └───────┬───────┬──────────┘│
│                                            │       │           │
│                                    ┌───────▼──┐ ┌──▼────────┐ │
│                                    │PostgreSQL│ │  Redis    │ │
│                                    │+Timescale│ │ (pub/sub, │ │
│                                    │  DB      │ │  cache)   │ │
│                                    └──────────┘ └───────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Przepływ danych — Live Show

```
1. Audio chunk (5-10s) ──► WebSocket Ingest
                                │
2.              ┌───────────────┼───────────────┐
                ▼               ▼               ▼
         librosa:           YAMNet:        Zapisz raw
         RMS, spectral      klasyfikacja    audio ref
         features           zdarzeń         (opcj.)
                │               │
3.              └───────┬───────┘
                        ▼
                 Engagement Score
                 (aggregacja + kalibracja venue)
                        │
4.              ┌───────┼───────────────────┐
                ▼       ▼                   ▼
           Redis     LightGBM          TimescaleDB
           pub/sub   ranking            (zapis metryk)
                │       │
5.              └───┬───┘
                    ▼
             WebSocket broadcast
             do panelu operatora
                    │
6.                  ▼
             Panel: engagement bar,
             rekomendacje, status czasu
```

### 5.3 Przepływ interakcji operatora

```
PRE-SHOW                          LIVE                              POST-SHOW
─────────                         ────                              ─────────

Wybierz/importuj setlistę ──►  Panel Live:                    Panel Post-show:
Konfiguruj venue/kalibrację      │                               │
Ustaw curfew                     ├─ Engagement gauge             ├─ Engagement timeline
Test audio (baseline)            ├─ Timeline segmentów           ├─ Tabela segmentów
                                 ├─ Rekomendacje ML              ├─ Wykresy
    ──► START SHOW ──►           ├─ Status czasu/curfew          ├─ Decyzje operatora
                                 ├─ Scenariusze odzysku          ├─ Eksport CSV/JSON
                                 ├─ Quick tagi                   ├─ Raport PDF
                                 └─ Start/End/Skip segment       │

                                     ──► END SHOW ──►            Automatyczny raport
```

---

## 6. Struktura repozytorium

```
stage-brain/
├── apps/
│   ├── api/                      # FastAPI backend (Modular/Domain-Based)
│   │   ├── src/
│   │   │   ├── core/             # Infrastruktura (NIE logika biznesowa)
│   │   │   │   ├── database.py   # Engine, session factory, get_session()
│   │   │   │   ├── settings.py   # Pydantic Settings
│   │   │   │   ├── exceptions.py # Base exception classes
│   │   │   │   └── middleware.py # CORS, error handlers
│   │   │   ├── models/           # SQLAlchemy ORM (centralizowane — gęste cross-domain FK)
│   │   │   │   ├── base.py       # DeclarativeBase, TimestampMixin
│   │   │   │   ├── show.py
│   │   │   │   ├── venue.py      # Venue + CalibrationPreset
│   │   │   │   ├── setlist.py    # Setlist, Segment, SegmentVariant
│   │   │   │   ├── timeline.py
│   │   │   │   ├── engagement.py
│   │   │   │   ├── recommendation.py
│   │   │   │   ├── tag.py
│   │   │   │   └── report.py
│   │   │   ├── shows/            # Koncerty, timeline, kontrola czasu
│   │   │   │   ├── router.py     # REST: CRUD show, start/end/pause
│   │   │   │   ├── service.py    # Logika: stany show, timeline tracking
│   │   │   │   ├── schemas.py    # ShowCreate, ShowResponse, ShowUpdate...
│   │   │   │   ├── dependencies.py
│   │   │   │   ├── exceptions.py
│   │   │   │   └── ws.py         # WebSocket: live panel JSON broadcast
│   │   │   ├── setlists/         # Zarządzanie setlistą, import, warianty
│   │   │   │   ├── router.py
│   │   │   │   ├── service.py
│   │   │   │   ├── schemas.py
│   │   │   │   └── exceptions.py
│   │   │   ├── audio/            # Audio ingest + feature extraction
│   │   │   │   ├── router.py     # REST: audio status, test endpoints
│   │   │   │   ├── service.py    # Orchestracja pipeline
│   │   │   │   ├── schemas.py
│   │   │   │   ├── pipeline.py   # librosa: RMS, spectral, ZCR
│   │   │   │   ├── classifier.py # YAMNet: event classification
│   │   │   │   └── ws.py         # WebSocket: binary audio ingest
│   │   │   ├── engagement/       # Engagement scoring, kalibracja, trend
│   │   │   │   ├── router.py
│   │   │   │   ├── service.py
│   │   │   │   ├── schemas.py
│   │   │   │   └── scoring.py    # Engagement score formula + calibration
│   │   │   ├── recommendations/  # ML ranking (LightGBM), rekomendacje
│   │   │   │   ├── router.py
│   │   │   │   ├── service.py
│   │   │   │   ├── schemas.py
│   │   │   │   ├── ml_model.py   # LightGBM inference
│   │   │   │   └── fallback.py   # Rule-based fallback ranking
│   │   │   ├── venues/           # Obiekty koncertowe, kalibracja
│   │   │   │   ├── router.py
│   │   │   │   ├── service.py
│   │   │   │   ├── schemas.py
│   │   │   │   └── calibration.py # Calibration logic, preset management
│   │   │   ├── analytics/        # Post-show, raporty, eksport
│   │   │   │   ├── router.py
│   │   │   │   ├── service.py
│   │   │   │   ├── schemas.py
│   │   │   │   └── reports.py    # PDF generation (weasyprint)
│   │   │   └── tags/             # Manualne tagi operatora
│   │   │       ├── router.py
│   │   │       ├── service.py
│   │   │       └── schemas.py
│   │   ├── ml_models/            # Wytrenowane modele ML (YAMNet, LightGBM weights)
│   │   ├── alembic/              # Alembic migrations
│   │   ├── tests/                # Mirrors src/ structure
│   │   └── pyproject.toml
│   │
│   └── web/                      # React frontend (FSD v2)
│       ├── src/
│       │   ├── app/              # Router, providers, global error boundaries
│       │   ├── pages/            # Kompozycje per route
│       │   │   ├── setup/        # Konfiguracja koncertu, venue, kalibracja
│       │   │   ├── live/         # Panel operatora (real-time)
│       │   │   ├── post-show/    # Analityka post-show, raporty
│       │   │   └── audio-source/ # Strona przechwytywania audio
│       │   ├── widgets/          # Samodzielne bloki UI
│       │   │   ├── engagement-gauge/    # Wskaźnik energii
│       │   │   ├── segment-timeline/    # Timeline setlisty
│       │   │   ├── curfew-clock/        # Zegar + prognoza curfew
│       │   │   ├── recommendation-panel/# Rekomendacje ML
│       │   │   ├── operator-tags/       # Quick-tag panel
│       │   │   └── setlist-editor/      # Drag & drop + import
│       │   ├── features/         # Akcje użytkownika
│       │   │   ├── start-show/          # Rozpocznij koncert
│       │   │   ├── control-segment/     # Start / end / skip segment
│       │   │   ├── accept-recommendation/
│       │   │   ├── add-tag/
│       │   │   ├── import-setlist/
│       │   │   ├── calibrate-venue/
│       │   │   └── export-report/
│       │   ├── entities/         # Modele domenowe + bazowe UI
│       │   │   ├── show/         # Show model + ShowCard
│       │   │   ├── segment/      # Segment model + SegmentRow
│       │   │   ├── venue/        # Venue model
│       │   │   ├── engagement-metric/
│       │   │   ├── recommendation/
│       │   │   └── operator-tag/
│       │   └── shared/           # shadcn/ui, API client, WebSocket, utils
│       │       ├── ui/           # shadcn/ui components
│       │       ├── api/          # openapi-fetch client, WebSocket manager
│       │       ├── lib/          # cn(), formattery, utils
│       │       ├── model/        # Globalne typy, Zustand helpers
│       │       └── config/       # Stałe, env
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared-types/             # Schematy API (generowane z OpenAPI)
│
├── infra/
│   ├── docker-compose.yml        # Pełny stack lokalnie
│   ├── docker-compose.prod.yml   # Produkcja
│   ├── Dockerfile.api
│   └── Dockerfile.web
│
├── ai/                           # Dokumenty źródłowe i architektoniczne projektu
├── docs/                         # Dokumentacja techniczna (do uporządkowania)
└── scripts/                      # Narzędzia deweloperskie, seed data
```

---

## 7. Ryzyka architektoniczne

| Ryzyko | P-stwo | Wpływ | Mitygacja |
|--------|--------|-------|-----------|
| Jakość audio z mikrofonu ambient zbyt niska dla klasyfikacji | Średnie | Wysoki | Testy z różnymi źródłami (ambient, audience mic, FOH feed); fallback na samą RMS energy |
| Latencja chmura za wysoka dla UX | Niskie | Średni | 5-10s okna dają bufor; UI z opóźnieniem ~10-15s — akceptowalne analitycznie |
| YAMNet nie rozróżnia typów reakcji koncertowych | Średnie | Średni | Fine-tuning na danych z testów; fallback na metryki sygnałowe |
| Utrata połączenia WebSocket na venue | Średnie | Niski | Auto-reconnect, buforowanie lokalne, Redis zachowuje stan |
| Brak danych do treningu ML ranking | Wysokie | Średni | Hybrid: reguły eksperckie + ML; ML uczy się z każdym koncertem |
| GIL Python blokuje audio processing | Niskie | Średni | ProcessPoolExecutor dla CPU-intensive; asyncio dla I/O |
| Format setlisty od TINAP niezgodny z oczekiwaniami | Niskie | Niski | Elastyczny parser CSV + możliwość rozszerzenia |

---

## 8. Plan implementacji — 10 tygodni

### Przegląd faz

| Faza | Nazwa | Czas | Tydzień | Płatność |
|------|-------|------|---------|----------|
| 0 | Kick-off + Setup | 3-5 dni | T1 | **40% — start** |
| 1 | Prototyp UX + Specyfikacja | 1 tydzień | T2 | |
| 2 | Fundamenty Real-time | 2 tygodnie | T3-T4 | |
| 3 | Setlista + Kontrola Czasu | 2 tygodnie | T5-T6 | **40% — po Fazie 3** |
| 4 | Rekomendacje + Kalibracja ML | 2 tygodnie | T7-T8 | |
| 5 | Post-show + Eksport + Raporty | 1 tydzień | T9 | |
| 6 | Pilot + Poprawki | 1-2 tygodnie | T10(+) | **20% — po pilocie** |

---

### Faza 0: Kick-off + Setup (3-5 dni, T1)

**Techniczne:**
- Monorepo zainicjalizowane (apps/api, apps/web, packages/, infra/)
- FastAPI boilerplate: konfiguracja, SQLAlchemy 2.0 + Alembic, health check, pytest
- React + Vite + TypeScript + Tailwind boilerplate: ciemny motyw, routing, Zustand
- Docker Compose (api + web + postgres + redis) — `docker compose up` uruchamia stack
- GitHub Actions: lint + test na PR
- VPS postawiony z Docker Compose (staging)

**Produktowe (warsztat z TINAP):**
- Mapa decyzji showcallera
- Format setlisty (Excel/CSV/JSON → schema importu)
- Źródło audio na venue
- Metryki sukcesu pilota
- 3-5 typowych scenariuszy decyzyjnych

---

### Faza 1: Prototyp UX + Specyfikacja (1 tydzień, T2)

**Ekrany do zaprojektowania:**
1. **Panel Live** — engagement gauge, timeline, rekomendacje, status czasu, tagi, aktualny segment
2. **Ekran setup pre-show** — setlista, venue, kalibracja, curfew
3. **Panel post-show** — timeline z metrykami, tabela segmentów, wykresy, eksport, raport

**Specyfikacja:**
- User stories w backlogu
- Flow: setup → live → post-show
- Stany segmentu i show
- API contract draft (OpenAPI)

---

### Faza 2: Fundamenty Real-time (2 tygodnie, T3-T4)

**T3 — Audio Ingest + Feature Extraction:**
- WebSocket endpoint audio ingest (binary chunks)
- Audio buffer (ring buffer, okna 5-10s)
- librosa: RMS, spectral centroid, ZCR
- Zapis metryk do TimescaleDB
- Redis pub/sub: publish engagement updates
- Frontend Audio Source: Web Audio API, WebSocket wysyłka, reconnect

**T4 — Engagement Score + Panel Live v1:**
- YAMNet integration (TFLite/ONNX)
- Engagement Score v1 (ważona suma)
- WebSocket broadcast do panelu
- Panel Live v1: gauge, trend, mini-timeline, etykieta klasyfikacji

**Deliverable**: Demo end-to-end: mikrofon → serwer → panel (latencja < 15s)

---

### Faza 3: Setlista + Kontrola Czasu (2 tygodnie, T5-T6)

**T5 — Model Setlisty + CRUD:**
- Model danych: setlisty, segmenty, warianty (full/short)
- REST API: CRUD setlista, import CSV/Excel
- Show timeline: start/end/skip segment
- Manualne tagi operatora
- Frontend: setup setlisty, drag & drop, import, widok live

**T6 — Kontrola Czasu + Prognoza Curfew:**
- Time tracking engine (planowane vs faktyczne czasy, delta, suma)
- Prognoza do curfew
- Scenariusze odzysku (skróć segmenty / pomiń / hybryd)
- Frontend: zegar, opóźnienie, prognoza, scenariusze z przyciskiem "Zastosuj"

**Milestone**: Płatność 40%

---

### Faza 4: Rekomendacje ML + Kalibracja (2 tygodnie, T7-T8)

**T7 — Rekomendacje:**
- Feature engineering (energia, trend, pozycja, historia, tempo, kontrast)
- LightGBM model (start: dane syntetyczne + reguły TINAP)
- Fallback regułowy
- Log rekomendacji + decyzji operatora
- Frontend: top 3-5 rekomendacji, accept/reject, visual cue przy spadku energii

**T8 — Kalibracja per Venue:**
- Model kalibracji: presety (hala, stadion, klub, open air)
- Parametry: energy_baseline, sensitivity, noise_floor, spectral_threshold
- Normalizacja engagement z kalibracją
- Frontend: wizard setup, dropdown venue, sliders korekty

---

### Faza 5: Post-show + Eksport + Raporty (1 tydzień, T9)

- Endpoint analytics (engagement timeline, per-segment stats, rekomendacje, tagi)
- Eksport CSV/JSON
- Automatyczny raport PDF (Celery/arq task, weasyprint)
- Frontend post-show: interaktywny wykres, tabela, heatmap, eksport, lista show

---

### Faza 6: Pilot + Poprawki (1-2 tygodnie, T10+)

**Testy:**
1. Laboratoryjny — nagrania przez głośnik → mikrofon → system (90 min stability)
2. Próba na żywo — soundcheck z TINAP (jeśli dostępny)
3. Dress rehearsal — pełny flow setup → live → post-show

**Kryteria sukcesu pilota:**
- Stabilność 90+ minut
- Engagement koreluje z obserwowaną energią (ocena TINAP)
- Prognoza curfew ±2 min
- Rekomendacje "mają sens" wg showcallera
- Panel czytelny w backstage (ciemno, stres, tablet)
- Reconnect < 10 sekund

---

## 9. Otwarte tematy do dalszej dyskusji

Poniższe tematy zostały zasygnalizowane podczas dyskusji architektonicznej, ale wymagają dalszego doprecyzowania lub decyzji.

### 9.1 Istniejąca dokumentacja w `docs/`

**Problem**: Cała struktura `docs/` to template z innego projektu ("OpsDesk" — system ticketów). Nie ma nic wspólnego z StageBrain.

**Do decyzji:**
- Usunąć i zacząć od nowa z dokumentacją StageBrain?
- Przerobić strukturę (zachować format ADR, C4, sequences, ale zamienić content)?
- Zostawić jako reference template i tworzyć nową dokumentację obok?

**Rekomendacja**: Usunąć content OpsDesk, zachować strukturę katalogów (jest dobra), wypełnić danymi StageBrain.

---

### 9.2 Autentykacja i autoryzacja

**Obecny stan**: Nie omówione szczegółowo. MVP zakłada jednego operatora.

**Do decyzji:**
- Czy na MVP wystarczy prosty mechanizm (np. token/hasło per show)?
- Czy potrzebny SSO / OAuth od razu?
- Wariant C przewiduje "role użytkowników" — ale to poza scope MVP Plus

**Rekomendacja**: Prosty API key lub JWT z jednym kontem operatora. Zaprojektować middleware auth tak, żeby łatwo rozszerzyć potem.

---

### 9.3 Testowanie audio pipeline na realnych danych

**Problem**: Nie mamy nagrań z koncertów do walidacji engagement score.

**Do ustalenia z TINAP:**
- Czy mają nagrania audio z publiczności z poprzednich koncertów?
- Czy możemy użyć nagrań z YouTube/social media do pierwszych testów?
- Czy mogą zorganizować nagranie testowe na próbie/soundchecku?

**Rekomendacja**: Jak najwcześniej zdobyć 3-5 nagrań z różnych momentów koncertu (cisza, oklaski, skandowanie, pełna energia) do kalibracji i walidacji pipeline.

---

### 9.4 Format i źródło setlisty

**Problem**: Nie wiemy jak TINAP przygotowuje setlisty.

**Do ustalenia na warsztacie (Faza 0):**
- W jakim formacie przychodzi setlista? (Excel, Google Sheets, PDF, aplikacja?)
- Jakie dane per segment? (nazwa, czas, warianty, BPM, gatunek, elementy techniczne?)
- Czy segmenty mają zdefiniowane warianty (full/short) z góry?
- Jak wygląda "idealny" format setlisty z perspektywy showcallera?

**Rekomendacja**: Na start prosty CSV parser z kolumnami: nazwa, czas_full, czas_short, bpm, gatunek. Rozszerzamy po warsztacie.

---

### 9.5 Źródło audio na venue — szczegóły techniczne

**Problem**: Odpowiedź "jeszcze nie wiadomo". To krytyczne dla Fazy 2.

**Opcje do zbadania z TINAP:**
1. **Mikrofon ambient na statywie** (blisko publiczności) — najczystszy sygnał crowd
2. **Audience mic** (często stosowany w produkcji koncertowej) — dedykowany mic na publiczność
3. **FOH feed** (mix z miksera frontowego) — zawiera muzykę + crowd, trudniejszy do separacji
4. **Mikrofon wbudowany w laptop** — najłatwiejszy setup, najgorsza jakość

**Do ustalenia:**
- Jaki sprzęt jest standardowo dostępny na venue?
- Czy TINAP ma audience mici na swoich produkcjach?
- Czy możemy podpiąć się do istniejącej infrastruktury audio?

**Rekomendacja**: Architektura jest agnostyczna (WebSocket binary stream). Testujemy z różnymi źródłami w Fazie 2 i wybieramy najlepsze.

---

### 9.6 Monitoring i observability na MVP

**Problem**: Wariant C zawiera "observability" — ale zupełny brak monitoringu to ryzyko.

**Minimum viable monitoring dla MVP:**
- **Sentry** — error tracking (backend + frontend), darmowy plan
- **Uptime Robot** — czy serwer żyje, darmowy
- **Prosty health check** endpoint + Docker health checks
- **Structured logging** (JSON) w backendzie — do późniejszej analizy

**Nie potrzebujemy na MVP:**
- Prometheus/Grafana stack
- Distributed tracing
- Custom dashboardy

---

### 9.7 Strategia testowania

**Do doprecyzowania:**
- Jaki coverage target na MVP? (rekomendacja: 70%+ na core logic, mniej na UI)
- E2E testy? (Playwright na flow: setup → start show → view engagement)
- Load testing? (Locust/k6 — symulacja 90 min streamu audio)
- Czy robimy contract testing (OpenAPI schema validation)?

---

### 9.8 Przyszłościowa skalowalność (po MVP)

Architektura MVP jest zaprojektowana z myślą o ewolucji:

| Potrzeba przyszła | Jak obecna architektura to wspiera |
|-------------------|------------------------------------|
| Multi-venue / multi-tour | Redis pub/sub z channels per show; DB schema już rozdziela shows/venues |
| Tryb offline/edge (Wariant C) | Audio pipeline w Pythonie — przenośny na edge device (laptop/RPi) |
| Moduł wideo | Osobny feature extraction service, ten sam engagement score aggregator |
| Więcej operatorów | WebSocket rooms per show, auth z rolami |
| Większa skala ML | LightGBM → może deep learning; TimescaleDB → dane historyczne gotowe |

---

### 9.9 Czyszczenie repozytorium

**Obecny stan repo:**
- `docs/` — template OpsDesk (do usunięcia/przerobienia)
- `ai/` — dokumenty źródłowe StageBrain (poprawne)
- `.claude/` — konfiguracja Claude Code
- Brak kodu źródłowego (jeszcze nie zaczęliśmy implementacji)

**Do zrobienia przed Fazą 0:**
- Decyzja co z `docs/` (patrz punkt 9.1)
- Inicjalizacja struktury monorepo (apps/, packages/, infra/)
- `.gitignore` dostosowany do Python + React + Docker

---

## 10. Tabela podsumowująca stack

| Warstwa | Technologia | Wersja | Rola |
|---------|-------------|--------|------|
| Backend framework | FastAPI | latest | API + WebSocket + async |
| Backend runtime | Python | 3.12+ | Cały backend |
| Backend server | uvicorn | latest | ASGI server |
| ORM | SQLAlchemy | 2.0 | Database access |
| Migracje | Alembic | latest | DB schema management |
| Walidacja | Pydantic | v2 | Request/response validation |
| Audio features | librosa | latest | RMS, spectral analysis |
| Audio klasyfikacja | YAMNet (TFLite/ONNX) | — | Crowd event classification |
| ML ranking | LightGBM | latest | Song recommendation |
| Task queue | Celery lub arq | latest | Background jobs |
| Frontend framework | React | 19 | SPA |
| Frontend language | TypeScript | 5.x | Type safety |
| Frontend build | Vite | latest | Build + HMR |
| Frontend styling | Tailwind CSS | 4.x | Utility-first CSS |
| Frontend UI components | shadcn/ui (Radix UI) | latest | Design system, dostępne komponenty, dark mode |
| Frontend state | Zustand | latest | State management |
| Frontend charts | Recharts lub visx | latest | Engagement visualization |
| Frontend tables | TanStack Table | latest | Setlist, logs |
| API types bridge | openapi-typescript | latest | Backend → Frontend types |
| Database | PostgreSQL | 16 | Main data store |
| Time-series | TimescaleDB | latest | Extension: engagement metrics |
| Cache / Pub-sub | Redis | 7 | Real-time broadcast, state cache |
| Reverse proxy | Caddy | latest | HTTPS, auto SSL |
| Containerization | Docker + Compose | latest | Local dev + production |
| CI/CD | GitHub Actions | — | Lint, test, deploy |
| VPS | Hetzner Cloud (CPX31) | — | 4 vCPU, 8 GB RAM |
| Error tracking | Sentry | — | Backend + Frontend errors |
| Uptime | Uptime Robot | — | Health monitoring |
