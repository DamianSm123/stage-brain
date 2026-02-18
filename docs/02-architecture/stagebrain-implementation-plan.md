# StageBrain — Plan Implementacji MVP Plus (Wariant B)

**Status**: Proposed
**Data**: 2026-02-18
**Timeline**: 10 tygodni (18 luty — ~29 kwiecień 2026)
**Cel**: Stabilny pilot do testu na wydarzeniu w maju 2026

---

## Przegląd faz

| Faza | Nazwa | Czas | Tydzień |
|------|-------|------|---------|
| 0 | Kick-off + Setup | 3-5 dni | T1 |
| 1 | Prototyp UX + Specyfikacja | 1 tydzień | T2 |
| 2 | Fundamenty Real-time | 2 tygodnie | T3-T4 |
| 3 | Setlista + Kontrola Czasu | 2 tygodnie | T5-T6 |
| 4 | Rekomendacje + Kalibracja ML | 2 tygodnie | T7-T8 |
| 5 | Post-show + Eksport + Raporty | 1 tydzień | T9 |
| 6 | Pilot + Poprawki | 1-2 tygodnie | T10(+) |

---

## Faza 0: Kick-off + Setup (3-5 dni, Tydzień 1)

### Cele
- Ustawienie środowiska deweloperskiego
- Inicjalizacja repozytorium z pełną strukturą projektu
- Doprecyzowanie workflow showcallera z TINAP

### Deliverables

**Techniczne:**
- [ ] Monorepo zainicjalizowane (apps/api, apps/web, packages/, infra/)
- [ ] FastAPI boilerplate z:
  - Konfiguracja (pydantic-settings, .env)
  - SQLAlchemy 2.0 + Alembic setup
  - Pierwsza migracja (tabele: venues, shows, segments)
  - Health check endpoint
  - Pytest z async fixtures
- [ ] React + Vite + TypeScript + Tailwind boilerplate z:
  - Ciemny motyw domyślny
  - Routing (react-router)
  - Zustand store (placeholder)
  - WebSocket hook (placeholder)
- [ ] Docker Compose (api + web + postgres + redis) — lokalne uruchomienie jedną komendą
- [ ] GitHub Actions: lint + test na PR
- [ ] Hetzner/DO VPS postawiony z Docker Compose (staging environment)

**Produktowe (warsztat z TINAP):**
- [ ] Mapa decyzji showcallera (kiedy i jakie decyzje podejmuje w trakcie show)
- [ ] Ustalenie formatu setlisty (Excel/CSV/JSON → definiujemy schema importu)
- [ ] Ustalenie źródła audio na venue (mikrofon, lokalizacja, typ podłączenia)
- [ ] Definicja metryk sukcesu pilota (co mierzy, żeby uznać test za udany)
- [ ] Lista 3-5 typowych scenariuszy decyzyjnych (case studies z poprzednich koncertów)

### Kryteria akceptacji
- `docker compose up` uruchamia pełny stack lokalnie
- API odpowiada na `GET /health`
- Frontend otwiera się w przeglądarce z ciemnym motywem
- Warsztat z TINAP odbyty, notatki zapisane

---

## Faza 1: Prototyp UX + Specyfikacja (1 tydzień, Tydzień 2)

### Cele
- Zaprojektowanie kluczowych ekranów panelu operatora
- Ustalenie flow interakcji operatora z systemem
- Backlog user stories na następne fazy

### Deliverables

**Ekrany do zaprojektowania (wireframes/mockupy):**

1. **Panel Live (główny ekran operatora):**
   - Engagement bar/gauge (aktualna energia, trend)
   - Timeline show (segmenty zaplanowane vs faktyczne, czas od startu)
   - Sekcja rekomendacji (3-5 następnych utworów z ranking score)
   - Status czasu (ile do curfew, prognoza, scenariusze)
   - Szybkie tagi (przyciski: "problem tech", "energia spada", "zmiana planu", custom)
   - Aktualny segment (nazwa, wariant, czas trwania, elapsed)

2. **Ekran setup pre-show:**
   - Wybór/import setlisty
   - Konfiguracja venue (preset lub ręcznie)
   - Kalibracja audio (test mikrofonu, baseline)
   - Ustawienie curfew i limitów czasowych

3. **Panel post-show:**
   - Timeline przebiegu z nałożonymi metrykami engagement
   - Tabela segmentów (zaplanowane vs faktyczne czasy)
   - Wykresy energii publiczności w czasie
   - Lista decyzji operatora (tagi, akceptacje rekomendacji)
   - Eksport danych (CSV/JSON)
   - Generowanie raportu (PDF)

**Specyfikacja:**
- [ ] User stories w backlogu (GitHub Issues lub Notion)
- [ ] Flow diagram: pełny przebieg od setup → live → post-show
- [ ] Definicja stanów segmentu: planned → active → completed / skipped
- [ ] Definicja stanów show: setup → live → paused → ended
- [ ] API contract draft (OpenAPI) dla kluczowych endpointów

### Kryteria akceptacji
- Wireframes zatwierdzone przez TINAP (lub na podstawie feedbacku z Fazy 0)
- Backlog user stories pokrywa cały scope Wariantu B
- API contract draft zreviewowany

---

## Faza 2: Fundamenty Real-time (2 tygodnie, Tydzień 3-4)

### Cele
- Działający pipeline: audio z przeglądarki → serwer → feature extraction → metryka energii → panel
- End-to-end flow od mikrofonu do wyświetlenia metryki na ekranie

### Tydzień 3: Audio Ingest + Feature Extraction

**Backend:**
- [ ] WebSocket endpoint `ws://api/v1/audio/stream` — odbiera binary audio chunks
- [ ] Audio buffer (ring buffer w pamięci, okna 5-10s)
- [ ] librosa integration: RMS energy, spectral centroid, ZCR z każdego okna
- [ ] Normalizacja i skalowanie metryk do 0-1
- [ ] Zapis raw metrics do PostgreSQL/TimescaleDB (tabela `engagement_metrics`)
- [ ] Redis pub/sub: publish engagement update po każdym oknie

**Frontend (Audio Source):**
- [ ] Strona `/audio-source` — przeglądarkowy klient przechwytujący audio
- [ ] Web Audio API: dostęp do mikrofonu, AudioWorklet do przechwytywania PCM
- [ ] WebSocket: wysyłka binary frames co 5-10s do backendu
- [ ] Status indicator: connected/disconnected, audio level meter
- [ ] Reconnect logic (exponential backoff)

### Tydzień 4: Engagement Score + Panel Live (v1)

**Backend:**
- [ ] YAMNet integration: klasyfikacja zdarzeń (oklaski, krzyk, skandowanie, cisza, muzyka)
- [ ] Inferencja przez TensorFlow Lite lub ONNX Runtime
- [ ] Engagement Score v1: ważona suma RMS + spectral brightness + crowd event type
- [ ] WebSocket endpoint `ws://api/v1/live/{show_id}` — broadcast engagement updates do panelu
- [ ] Endpoint `POST /api/v1/shows/{id}/start` i `POST /api/v1/shows/{id}/stop` — kontrola show

**Frontend (Operator Panel):**
- [ ] Ekran Live v1:
  - Engagement gauge (aktualny score 0-100, wizualny bar z kolorem)
  - Trend indicator (rosnący/stabilny/malejący, strzałka + kolor)
  - Timeline: miniaturowy wykres engagement z ostatnich 5-10 minut
  - Etykieta klasyfikacji (np. "Oklaski", "Skandowanie", "Cisza")
- [ ] WebSocket connection do `live/{show_id}` z Zustand store
- [ ] Connection status badge (LIVE / RECONNECTING / OFFLINE)

### Deliverables
- Demo: mikrofon na laptopie → przeglądarka przechwytuje → serwer przetwarza → panel pokazuje engagement w real-time
- Latencja end-to-end < 15 sekund (5-10s okno + processing + broadcast)

### Kryteria akceptacji
- Przeglądarka na jednym urządzeniu przechwytuje audio i wysyła do serwera
- Panel na drugim urządzeniu pokazuje engagement score aktualizowany co 5-10s
- Dane zapisywane w TimescaleDB
- Testy: unit testy feature extraction, integration test WebSocket flow

---

## Faza 3: Setlista + Kontrola Czasu (2 tygodnie, Tydzień 5-6)

### Tydzień 5: Model Setlisty + CRUD

**Backend:**
- [ ] Model danych: setlisty, segmenty, warianty (full/short per segment)
- [ ] Migracje Alembic dla tabel: `setlists`, `segments`, `segment_variants`
- [ ] REST API:
  - `POST /api/v1/setlists` — create setlist
  - `GET /api/v1/setlists/{id}` — get setlist with segments
  - `PUT /api/v1/setlists/{id}/segments` — reorder segments
  - `POST /api/v1/setlists/import` — import z CSV/Excel (prosty parser)
- [ ] Model danych: show timeline (faktyczny przebieg)
  - `POST /api/v1/shows/{id}/segments/{seg_id}/start` — segment started
  - `POST /api/v1/shows/{id}/segments/{seg_id}/end` — segment ended
  - `POST /api/v1/shows/{id}/segments/{seg_id}/skip` — segment skipped
- [ ] Manualne tagi operatora:
  - `POST /api/v1/shows/{id}/tags` — dodaj tag (preset lub custom text)
  - `GET /api/v1/shows/{id}/tags` — lista tagów

**Frontend:**
- [ ] Ekran Setup: formularz tworzenia setlisty (drag & drop segmentów)
- [ ] Import setlisty z pliku (upload CSV/Excel → preview → confirm)
- [ ] Widok setlisty w panelu Live: lista segmentów z statusami (upcoming / active / done / skipped)
- [ ] Przyciski: "Start segment", "End segment", "Skip segment"
- [ ] Quick tag buttons (preset: "problem tech", "energia spada", "extra", custom)

### Tydzień 6: Kontrola Czasu + Prognoza Curfew

**Backend:**
- [ ] Time tracking engine:
  - Planowany czas każdego segmentu (z setlisty)
  - Faktyczny czas (z timeline)
  - Delta (opóźnienie/przyspieszenie per segment)
  - Suma delty = aktualne opóźnienie łączne
- [ ] Prognoza do curfew:
  - Jeśli gramy dalej w aktualnym tempie → kiedy kończymy?
  - Ile minut nad/pod curfew?
- [ ] Scenariusze odzysku czasu:
  - Wariant 1: skrócenie kolejnych segmentów (użyj wariantów "short")
  - Wariant 2: pominięcie N segmentów
  - Wariant 3: hybryd (skróć X + pomiń Y)
  - Każdy scenariusz: ile czasu odzyskujemy, jaki wpływ na setlistę
- [ ] Broadcast scenariuszy przez WebSocket do panelu

**Frontend:**
- [ ] Panel Live rozszerzony:
  - Zegar: czas od startu show, czas do curfew
  - Opóźnienie: "+3:20 min" (czerwony jeśli > threshold)
  - Prognoza: "Koniec o 22:47 (curfew 22:30, +17 min)"
  - Sekcja scenariuszy:
    - "Scenariusz A: skróć 3 segmenty → -8 min → koniec 22:39 (+9 min)"
    - "Scenariusz B: pomiń 'Utwór X' → -4 min → koniec 22:43 (+13 min)"
    - "Scenariusz C: skróć 2 + pomiń 1 → -11 min → koniec 22:36 (+6 min)"
  - Przycisk: "Zastosuj scenariusz" → aktualizuje setlistę live

### Deliverables
- Pełny flow: stworzenie setlisty → start show → zarządzanie segmentami → kontrola czasu → scenariusze odzysku
- Milestone: **płatność 40%** (po Fazie 3 wg umowy)

### Kryteria akceptacji
- Setlista z 15+ segmentami poprawnie importowana z CSV
- Kontrola czasu pokazuje poprawną prognozę curfew
- Scenariusze odzysku generują się automatycznie przy opóźnieniu > 1 min
- Testy: unit testy time tracking engine, integration test scenariuszy

---

## Faza 4: Rekomendacje ML + Kalibracja (2 tygodnie, Tydzień 7-8)

### Tydzień 7: Rekomendacje

**Backend:**
- [ ] Feature engineering dla rankingu:
  - Aktualna energia engagement (z pipeline audio)
  - Trend energii (ostatnie 3 okna: rosnący/malejący/stabilny)
  - Pozycja w setliście (jaki % show za nami)
  - Historyczna skuteczność segmentu (średnia zmiana engagement po zagraniu — z danych)
  - Wariant: full vs short (różne scoring)
  - Tempo/BPM segmentu (metadata)
  - Kontrast vs poprzedni segment (szybki po wolnym = potencjał energetyczny)
- [ ] Model LightGBM:
  - Na start: trening na syntetycznych danych + reguły eksperckie od TINAP
  - Format: feature vector per kandydujący segment → predicted engagement delta
  - Ranking: posortowane segmenty po predicted delta (top 3-5)
- [ ] Fallback: jeśli model nie ma wystarczającej pewności → ranking regułowy
- [ ] API: rekomendacje broadcastowane przez WebSocket do panelu
- [ ] Log rekomendacji + decyzji operatora (accept / reject / ignore) do `recommendations_log`

**Frontend:**
- [ ] Sekcja rekomendacji w panelu Live:
  - Top 3-5 rekomendowanych następnych segmentów
  - Per segment: nazwa, scoring, reasoning ("energia spada — rekomenduję energetyczny utwór")
  - Przycisk: "Zaakceptuj" (→ segment staje się następny w kolejce)
  - Przycisk: "Odrzuć" (→ oznacz i pokaż następną propozycję)
- [ ] Visual cue: gdy engagement spada szybko → pulsujące/podświetlone rekomendacje

### Tydzień 8: Kalibracja per Venue

**Backend:**
- [ ] Model kalibracji:
  - Tabela `calibration_presets`: typ venue, pojemność, gatunek, parametry
  - Parametry: energy_baseline, energy_sensitivity, crowd_noise_floor, spectral_threshold
  - Pre-definied presets: "hala 5000+", "stadion", "klub 500", "open air"
- [ ] Endpoint:
  - `GET /api/v1/calibration/presets` — lista presetów
  - `POST /api/v1/shows/{id}/calibration` — przypisz/modyfikuj kalibrację do show
- [ ] Walidacja: test kalibracji na zapisanych danych z Fazy 2 (odtworzenie engagement z różnymi preset'ami)
- [ ] Normalizacja engagement score uwzględnia kalibrację venue

**Frontend:**
- [ ] Ekran Setup rozszerzony:
  - Dropdown: wybór venue / preset kalibracji
  - Sliders: ręczna korekta parametrów (energy sensitivity, noise floor)
  - Preview: "test z ostatniego show — jak wyglądałby engagement z tą kalibracją"
- [ ] Prosty wizard: "Nowy koncert → Wybierz venue → Kalibruj → Załaduj setlistę → Start"

### Deliverables
- Rekomendacje ML widoczne w panelu Live
- Kalibracja per venue z presetami

### Kryteria akceptacji
- Rekomendacje reagują na zmiany engagement score w real-time
- Przy spadku energii rekomendowane są energetyczne utwory (i odwrotnie)
- Różne presety kalibracji dają zauważalnie różne wyniki engagement score
- Log rekomendacji zapisywany z decyzjami operatora

---

## Faza 5: Post-show + Eksport + Raporty (1 tydzień, Tydzień 9)

### Cele
- Panel analityczny po koncercie
- Eksport danych
- Automatyczne raporty

### Deliverables

**Backend:**
- [ ] Endpoint: `GET /api/v1/shows/{id}/analytics` — zagregowane dane post-show:
  - Engagement timeline (engagement score co 5-10s przez cały show)
  - Per-segment stats: avg engagement, peak, duration planned vs actual
  - Czas: łączne opóźnienia, które scenariusze były użyte
  - Rekomendacje: ile zaakceptowanych, ile odrzuconych, ile ignorowanych
  - Tagi operatora z timestamps
- [ ] Eksport danych:
  - `GET /api/v1/shows/{id}/export?format=csv` — surowe metryki engagement
  - `GET /api/v1/shows/{id}/export?format=json` — pełne dane show (setlista + timeline + metryki)
- [ ] Automatyczny raport:
  - Generowany po zakończeniu show (task w tle: Celery/arq)
  - Format: HTML renderowany do PDF (weasyprint lub similar)
  - Treść: podsumowanie show, kluczowe metryki, wykresy, anomalie, decyzje
  - `GET /api/v1/shows/{id}/report` — pobranie PDF

**Frontend:**
- [ ] Ekran Post-show:
  - Interaktywny wykres engagement timeline (zoom, hover = szczegóły)
  - Tabela segmentów: kolumny (nazwa, czas planowany, czas faktyczny, delta, avg engagement)
  - Heatmap segmentów (kolor = engagement level)
  - Lista tagów operatora (kliknij → skocz do miejsca na timeline)
  - Lista rekomendacji z decyzjami
- [ ] Przyciski eksportu: "Pobierz CSV", "Pobierz JSON", "Generuj raport PDF"
- [ ] Lista show: `/shows` — historia koncertów z podstawowymi statystykami

### Kryteria akceptacji
- Panel post-show pokazuje sensowne dane z poprzednich faz (z testów w Fazie 2-4)
- Eksport CSV/JSON działa poprawnie
- Raport PDF generuje się automatycznie i jest czytelny
- Lista show z paginacją

---

## Faza 6: Pilot + Poprawki (1-2 tygodnie, Tydzień 10+)

### Cele
- Test systemu w warunkach zbliżonych do live
- Stabilizacja i bug fixing
- Gotowość na prawdziwy pilot w maju

### Plan testów

**Test 1 — Laboratoryjny (biuro/studio):**
- Symulacja: odtwarzanie nagrań z koncertów przez głośnik → mikrofon → system
- Weryfikacja: czy engagement score sensownie reaguje na różne fragmenty (cisza vs oklaski vs skandowanie)
- Stress test: 90 min ciągłej pracy bez przerw, memory leaks, stabilność WebSocket

**Test 2 — Próba na żywo (soundcheck/próba):**
- Jeśli TINAP ma dostęp do próby — test na żywym audio
- Kalibracja w realnym venue
- Feedback od showcallera: czy UI jest czytelny, czy rekomendacje mają sens

**Test 3 — Dress rehearsal:**
- Pełny przebieg: setup → live → post-show
- Simulated setlista (15+ segmentów)
- Symulowane opóźnienia i decyzje

### Deliverables
- [ ] Bug fixes z testów
- [ ] Performance optimization (jeśli potrzebne)
- [ ] Deployment produkcyjny (staging → production na VPS)
- [ ] Dokumentacja operacyjna: jak uruchomić system na koncercie (krok po kroku)
- [ ] Runbook: co robić gdy system padnie mid-show

### Kryteria akceptacji pilota
- System działa stabilnie przez 90+ minut ciągłej pracy
- Engagement score koreluje z obserwowaną energią publiczności (subiektywna ocena TINAP)
- Kontrola czasu poprawnie prognozuje curfew z dokładnością ±2 min
- Rekomendacje „mają sens" wg oceny showcallera
- Panel jest czytelny w warunkach backstage (ciemno, stres, tablet)
- Reconnect po zerwaniu połączenia < 10 sekund

---

## Podsumowanie milestone'ów i płatności

| Milestone | Faza | Płatność |
|-----------|------|----------|
| Start projektu | Faza 0 | **40%** |
| Setlista + Kontrola czasu gotowe | Po Fazie 3 | **40%** |
| Pilot zakończony | Po Fazie 6 | **20%** |

---

## Zależności i ryzyka harmonogramowe

| Ryzyko | Wpływ na harmonogram | Mitygacja |
|--------|---------------------|-----------|
| Opóźnienie warsztatu z TINAP | Blokuje Fazę 1 (UX) | Zaczynamy tech setup (Faza 0) niezależnie |
| Format setlisty nieustalony | Blokuje import w Fazie 3 | Robimy prosty CSV parser, rozszerzamy potem |
| Jakość audio na testach niska | Wymaga dodatkowej iteracji Fazy 2 | Bufor: Faza 2 ma tydzień zapasu (feature extraction nie zależy od jakości audio — działa na czymkolwiek) |
| TINAP niedostępny na testy | Blokuje Fazę 6 | Testy laboratoryjne niezależne od TINAP |
| Unexpected complexity w ML | Opóźnia Fazę 4 | Fallback: ranking regułowy zamiast ML (zawsze gotowy) |
