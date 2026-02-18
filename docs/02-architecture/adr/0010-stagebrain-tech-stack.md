# ADR-0010: StageBrain — Stack Technologiczny i Decyzje Architektoniczne

**Status**: Proposed
**Data**: 2026-02-18
**Autorzy**: Zespół architektury (dyskusja grupowa)
**Kontekst projektu**: StageBrain MVP Plus (Wariant B, 10 tygodni)

---

## 1. Kontekst

StageBrain to system wsparcia decyzyjnego w czasie rzeczywistym dla showcallera/reżysera koncertu. System analizuje audio publiczności, oblicza metrykę zaangażowania, rekomenduje kolejność utworów i monitoruje czas do curfew.

Kluczowe wymagania architektoniczne:
- **Real-time processing**: analiza audio w oknach 5-10s z niską latencją
- **ML pipeline**: klasyfikacja zdarzeń dźwiękowych + ranking utworów
- **Operator UI**: panel odporny na stres, szybkie decyzje, real-time updates
- **Fail-safe**: awaria systemu nie blokuje koncertu
- **Budżet**: 200-800 PLN/miesiąc na infrastrukturę
- **Timeline**: 10 tygodni do pilota (maj 2026)
- **Skala MVP**: jeden koncert na raz, jeden operator

---

## 2. Decyzje

### 2.1 Backend: Python 3.12+ z FastAPI

**Decyzja**: Cały backend w Pythonie z frameworkiem FastAPI.

**Rozważane alternatywy:**
1. **NestJS (TypeScript)** — silny w modularnych monolitach, ale ekosystem audio/ML jest znacząco słabszy. Wymusiłby polyglot (NestJS + Python microservice dla ML), co zwiększa złożoność przy 10-tygodniowym timeline.
2. **Go** — doskonała wydajność, ale brak ekosystemu ML/audio. Nie jest znany zespołowi.
3. **Elixir/Phoenix** — idealny do real-time (Erlang VM), ale brak ekosystemu ML i nowy język dla zespołu.

**Uzasadnienie:**
- Ekosystem audio/ML: librosa, torchaudio, YAMNet, LightGBM, NumPy, SciPy — wszystko natywne w Pythonie
- FastAPI: async/await, natywne WebSockety, automatyczna dokumentacja OpenAPI, Pydantic v2 do walidacji
- Zespół zna Python — zero czasu na naukę
- Jeden język na całym backendzie = prostsze CI/CD, debugging, onboarding
- Wydajność: przy skali MVP (1 koncert, 1 operator) Python z uvicorn jest więcej niż wystarczający

**Konsekwencje:**
- (+) Najszybszy czas development dla pipeline audio + ML + API
- (+) Jeden język = jedna konfiguracja lintingu, testów, CI
- (-) Python jest wolniejszy niż Go/Rust — akceptowalne przy obecnej skali
- (-) GIL (Global Interpreter Lock) — mitygacja: asyncio dla I/O, procesy worker dla CPU-intensive audio processing

**Kluczowe biblioteki:**
- `fastapi` + `uvicorn` — serwer ASGI
- `pydantic` v2 — walidacja i serializacja
- `sqlalchemy` 2.0 + `alembic` — ORM i migracje
- `asyncpg` — async driver PostgreSQL
- `redis` (aioredis) — async Redis client
- `librosa` + `soundfile` — audio feature extraction
- `tensorflow-lite` lub `onnxruntime` — inferencja YAMNet
- `lightgbm` — ML ranking
- `pytest` + `httpx` — testy
- `celery` lub `arq` — task queue (raporty, eksport)

---

### 2.2 Frontend: React 19 + TypeScript + Vite

**Decyzja**: Single Page Application w React z TypeScript, budowane przez Vite.

**Rozważane alternatywy:**
1. **Next.js** — SSR/SSG niepotrzebne (to nie SEO app), a dodaje złożoność. Panel operatora to czysta SPA.
2. **Vue 3** — porównywalny, ale mniejszy ekosystem komponentów wizualizacyjnych.
3. **Svelte/SvelteKit** — mniejszy bundle, ale mniejszy ekosystem i mniej devów na rynku.

**Uzasadnienie:**
- Zespół zna TypeScript/React
- Największy ekosystem komponentów (wykresy, tabele, UI kit)
- Type safety z generowanymi typami z OpenAPI backendu
- Vite: szybki HMR, prosty config, nowoczesny bundler

**UI/UX — specyfika panelu operatora:**
- **Ciemny motyw** (domyślny) — backstage jest ciemny, jasny ekran oślepia
- **Duże elementy dotykowe** — min. 48px, obsługa na tablecie w rękawiczkach
- **Wysoki kontrast** — kolory statusowe (zielony/żółty/czerwony) jasno czytelne
- **Minimalna ilość kliknięć** do decyzji (1-2 tapy max)
- **Stabilny layout** — żadnych przesunięć elementów przy aktualizacji danych

**Biblioteki:**
- `react` 19 + `typescript` 5.x
- `vite` — build tool
- `tailwindcss` — utility-first CSS, ciemny motyw natywnie
- `zustand` — state management (lekki, prosty)
- `recharts` lub `visx` — wykresy engagement timeline
- `@tanstack/react-table` — setlista, logi, dane tabelaryczne
- `openapi-typescript` + `openapi-fetch` — generowane typy i klient API z OpenAPI spec

---

### 2.3 Baza danych: PostgreSQL 16 + TimescaleDB

**Decyzja**: PostgreSQL z rozszerzeniem TimescaleDB dla danych time-series.

**Rozważane alternatywy:**
1. **Czysty PostgreSQL** — wystarczający na MVP, ale brak optymalizacji dla zapytań temporalnych w analityce post-show.
2. **PostgreSQL + InfluxDB** — dodatkowa baza = dodatkowy koszt operacyjny i złożoność.
3. **MongoDB** — brak potrzeby schemaless; dane setlisty i koncertów są silnie ustrukturyzowane.

**Uzasadnienie:**
- TimescaleDB to extension (nie osobna baza) — zero dodatkowego kosztu operacyjnego
- Hypertable na dane engagement (automatyczne partycjonowanie po czasie)
- Continuous aggregates — pre-obliczone średnie dla post-show analytics
- Kompresja danych historycznych — oszczędność storage
- Wszystkie dane relacyjne (setlisty, koncerty, venue, konfiguracje) w standardowych tabelach PostgreSQL

**Schemat danych — kluczowe tabele:**

```
venues              — obiekty koncertowe z parametrami kalibracji
shows               — konkretne wydarzenia (koncert + venue + data + setlista)
setlists            — setlisty (kolekcja segmentów)
segments            — segmenty/utwory w setliście (kolejność, warianty full/short, czas trwania)
show_timeline       — faktyczny przebieg koncertu (start/stop segmentów, tagi)
engagement_metrics  — [hypertable] metryki engagement co 5-10s (energia, trend, klasy zdarzeń)
recommendations_log — log rekomendacji systemu i decyzji operatora
operator_tags       — manualne tagi showcallera (problem techniczny, energia spada, etc.)
calibration_presets — presety kalibracji per venue/gatunek
reports             — wygenerowane raporty post-show
```

---

### 2.4 Cache i Real-time: Redis 7

**Decyzja**: Redis jako warstwa cache, pub/sub dla real-time broadcast, i opcjonalnie task queue.

**Uzasadnienie:**
- **Pub/sub**: backend publikuje metryki engagement → Redis channel → WebSocket handler broadcastuje do wszystkich podłączonych klientów panelu
- **Cache stanu live**: aktualny segment, czas od startu, aktualna energia — szybki read bez query do DB
- **Task queue** (opcjonalnie): generowanie raportów PDF, eksport CSV — operacje które mogą trwać dłużej

**Alternatywa**: Bez Redis, z in-memory state w FastAPI. Działa dla MVP (1 instancja), ale Redis dodaje:
- Persistence stanu między restartami serwera
- Gotowość na skalowanie (wiele instancji API)
- Natywny pub/sub bez custom kodu

---

### 2.5 Audio Pipeline: librosa + YAMNet (hybrid)

**Decyzja**: Dwuwarstwowe przetwarzanie audio — metryki podstawowe (librosa) + klasyfikacja zdarzeń (YAMNet).

**Warstwa 1 — Metryki sygnałowe (librosa):**
- **RMS Energy** — głośność w oknie czasowym (bazowy wskaźnik energii)
- **Spectral Centroid** — "jasność" dźwięku (wysoka wartość = krzyk/oklaski, niska = mruczenie/cisza)
- **Zero-Crossing Rate** — szum vs ton (pomaga odróżnić oklaski od skandowania)
- **Spectral Rolloff** — rozkład energii w widmie
- Obliczenia na oknach 5-10s, wynik co ~5s

**Warstwa 2 — Klasyfikacja zdarzeń (YAMNet):**
- Pre-trenowany model Google (AudioSet, 521 klas)
- Relevantne klasy: Applause, Cheering, Crowd, Chanting, Singing, Silence, Music
- Inferencja przez TensorFlow Lite lub ONNX Runtime (szybsza, mniejszy footprint)
- Wynik: rozkład prawdopodobieństw klas → aggregacja do "typu reakcji publiczności"

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

Formuła agregacji będzie iterowana na danych z testów — na start prosta ważona suma, potem możliwa optymalizacja.

**Kalibracja per venue (ręczna przed show):**
- Operator wybiera preset: typ venue (hala, stadion, klub, open air), pojemność, gatunek muzyczny
- Preset ustawia: baseline energy threshold, czułość klasyfikatora, normalizację głośności
- Opcja: ręczne nadpisanie poszczególnych parametrów
- Dane kalibracji zapisywane w `calibration_presets` i powiązane z `venues`

---

### 2.6 ML Ranking utworów: LightGBM

**Decyzja**: LightGBM do rankingu rekomendowanych następnych utworów/segmentów.

**Rozważane alternatywy:**
1. **Reguły (if/else)** — Wariant A. Prostsze, ale nie wykorzystuje danych historycznych.
2. **Deep Learning (transformer/RNN)** — overkill przy małym zbiorze danych, wolniejsza inferencja.
3. **Collaborative filtering** — wymaga danych z wielu koncertów; na start ich nie mamy.

**Uzasadnienie:**
- LightGBM: szybki trening, szybka inferencja (~1ms), świetny na danych tabelarycznych
- Features per utwór: aktualna energia, trend energii, pozycja w setliście, historyczna skuteczność, wariant (full/short), czas trwania, gatunek/tempo
- Target: "skuteczność" = zmiana engagement score po zagraniu tego utworu
- Na start: trening na danych syntetycznych + reguły eksperckie od TINAP, potem fine-tune na realnych danych z koncertów

**Fallback**: Jeśli model ML nie ma wystarczającej pewności (confidence < threshold), system wraca do rankingu regułowego (prosty scoring: energia utworu × dopasowanie do aktualnego poziomu).

---

### 2.7 Real-time Communication: WebSocket

**Decyzja**: Natywny WebSocket (FastAPI) do komunikacji real-time z panelem operatora.

**Przepływy WebSocket:**

1. **Audio ingest** (`ws://api/v1/audio/stream`):
   - Klient na venue → serwer
   - Binary frames: chunki audio PCM 16-bit 16kHz mono (lub Opus z przeglądarki)
   - Serwer potwierdza odbiór każdego chunka

2. **Operator panel** (`ws://api/v1/live/{show_id}`):
   - Serwer → panel operatora
   - JSON messages: engagement update, recommendation update, time status update, alert
   - Panel → serwer: operator tag, segment advance, recommendation accept/reject

**Reconnect strategy:**
- Klient implementuje exponential backoff reconnect
- Serwer utrzymuje stan w Redis → po reconnect klient dostaje aktualny snapshot
- Fail-safe: jeśli WebSocket padnie, panel pokazuje ostatni znany stan + "OFFLINE" badge

---

### 2.8 Deployment: Docker Compose na VPS

**Decyzja**: Docker Compose na pojedynczym VPS (Hetzner Cloud lub DigitalOcean).

**Konfiguracja MVP:**
```yaml
services:
  api:          # FastAPI backend (API + WebSocket + Audio processing)
  worker:       # Celery/arq worker (raporty, eksport — opcjonalny)
  web:          # Nginx serwujący React SPA (lub osobny CDN)
  postgres:     # PostgreSQL 16 + TimescaleDB
  redis:        # Redis 7
  # caddy/traefik:  # Reverse proxy + auto SSL (Let's Encrypt)
```

**Rekomendacja VPS:**
- **Hetzner CPX31**: 4 vCPU (AMD), 8 GB RAM, 160 GB SSD — €15.90/miesiąc (~68 PLN)
- lub **Hetzner CAX21** (ARM): 4 vCPU, 8 GB RAM — €7.49/miesiąc (~32 PLN) — tańszy, ale wymaga ARM builds
- Alternatywnie: **DigitalOcean Droplet**: 4 vCPU, 8 GB RAM — $48/miesiąc (~195 PLN)

**Backup:**
- PostgreSQL: automated daily dump → Object Storage (Hetzner/DO Spaces/Cloudflare R2)
- Całość w Docker volumes z regularnym snapshotem VPS

**CI/CD (GitHub Actions):**
1. Push na `main` → build Docker images → push do GitHub Container Registry
2. SSH do VPS → docker compose pull → docker compose up -d
3. Alembic migration → restart API

---

### 2.9 Audio Input na Venue: Web Audio API (przeglądarka)

**Decyzja**: Pierwsza iteracja — przeglądarka Chrome na laptopie przy FOH, korzystająca z Web Audio API do przechwytywania audio z mikrofonu i wysyłania przez WebSocket.

**Uzasadnienie:**
- Zero instalacji — wystarczy URL
- Natychmiastowe testy (soundcheck, próby)
- Web Audio API + MediaRecorder API dają wystarczający dostęp do audio
- Fallback: prosty Python script (pyaudio + websocket-client) jeśli przeglądarka zawodzi

**Format audio:**
- Preferowany: PCM 16-bit, 16kHz, mono (niski rozmiar, wystarczająca jakość)
- Z przeglądarki: MediaRecorder daje Opus/WebM → serwer dekoduje do PCM
- Okna: 5-10 sekund bufora → wysyłka jako jeden WebSocket binary frame

**Wymagania sieciowe na venue:**
- Stabilne połączenie internetowe (Wi-Fi lub LTE z hotspot)
- Bandwidth: ~32 kbps (PCM 16kHz mono) do ~64 kbps (Opus) — minimalny
- Latencja: tolerancja do ~2s (system nie jest real-time w sensie muzycznym, a analitycznym)

---

## 3. Podsumowanie ryzyk architektonicznych

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|--------|-------------------|-------|-----------|
| Jakość audio z mikrofonu ambient zbyt niska dla klasyfikacji | Średnie | Wysoki | Testy z różnymi źródłami (ambient, audience mic, FOH feed); fallback na samą RMS energy |
| Latencja chmura za wysoka dla UX | Niskie | Średni | 5-10s okna analizy dają bufor; UI pokazuje engagement z opóźnieniem ~10-15s — akceptowalne |
| YAMNet nie rozróżnia typów reakcji koncertowych | Średnie | Średni | Fine-tuning na danych z pierwszych testów; fallback na podstawowe metryki sygnałowe |
| Utrata połączenia WebSocket na venue | Średnie | Niski | Auto-reconnect, buforowanie lokalne w przeglądarce, Redis zachowuje stan |
| Brak danych do treningu ML ranking | Wysokie (na start) | Średni | Hybrid: reguły eksperckie + ML; ML uczy się z każdym koncertem |
| GIL Python blokuje audio processing | Niskie | Średni | ProcessPoolExecutor dla CPU-intensive librosa/YAMNet; asyncio dla I/O |

---

## 4. Diagramy

### 4.1 Architektura kontenerowa (C4 — Container)

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

### 4.2 Przepływ danych — Live Show

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
