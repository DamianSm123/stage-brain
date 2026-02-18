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

### Sesja 1: Stack technologiczny — Backend

**Cel:** Wybrać język, framework i runtime dla backendu.

**Kontekst:**
- System real-time z wymaganiem low-latency
- Pipeline audio processing (feature extraction, detekcja zdarzeń)
- Komponent ML (engagement score, ranking utworów) — Wariant B
- Deadline: 10 tygodni do pilota
- ADR w `docs/02-architecture/adr/` sugeruje NestJS — zweryfikować, czy to świadomy wybór czy template z innego projektu

**Pytania do rozstrzygnięcia:**

1. Jaki język/framework? Kandydaci:
   - **TypeScript + NestJS** — modularność, ekosystem Node.js, duży rynek developerów
   - **Python + FastAPI** — natywne wsparcie ML/audio (librosa, numpy, scikit-learn, TensorFlow), ale GIL i concurrency
   - **Go** — wydajność, prostota, ale mniejszy ekosystem ML
   - **Hybrid** — np. Python dla audio/ML pipeline + TypeScript dla API/biznes logic — czy warto komplikować?
2. Kto będzie w zespole developerskim? Jakie kompetencje mają dostępni ludzie?
3. Mono-repo czy poly-repo?
4. Runtime: Node.js vs Bun vs Deno (jeśli TypeScript)?
5. Czy ML model będzie trenowany i serwowany w tym samym procesie, czy osobno (np. jako mikroserwis, MLflow, osobny kontener Python)?

**Deliverable:** ADR z wyborem stacku backend + uzasadnienie.

---

### Sesja 2: Stack technologiczny — Frontend

**Cel:** Wybrać framework, podejście renderowania i bibliotekę UI dla panelu operatora.

**Kontekst:**
- Panel musi być **stress-resistant**: duże elementy, czytelny pod presją, ciemny backstage
- Urządzenie: tablet lub laptop backstage, potencjalnie słaby/niestabilny internet
- Real-time updates: engagement score, timer, rekomendacje aktualizują się co kilka sekund
- Dwa tryby panelu: live (podczas show) i post-show (analiza po koncercie)

**Pytania do rozstrzygnięcia:**

1. Framework UI:
   - **React + Next.js** — dojrzały ekosystem, SSR, łatwy deployment
   - **React (SPA)** — prostsze, wystarczające dla narzędzia produkcyjnego
   - **SvelteKit** — lżejszy, szybszy, mniejszy bundle (ważne przy słabym internecie)
   - **SolidJS** — reaktywność bez virtual DOM, najlepsze performance, ale mały ekosystem
2. Podejście renderowania: SPA vs SSR vs static + client hydration?
3. Biblioteka komponentów i styling:
   - Tailwind CSS + shadcn/ui (headless, customizable)
   - Radix UI + custom styles
   - MUI / Chakra (gotowe, ale cięższe)
4. Biblioteka wykresów/wizualizacji (engagement curve, timeline):
   - Recharts, visx, Chart.js, D3, lightweight custom canvas?
5. Responsywność: tablet-first? Desktop-first? Oba z breakpointami?
6. Dark mode jako default (backstage jest ciemny)?
7. PWA / offline cache (jako minimum, bez pełnego trybu offline z Wariantu C)?

**Deliverable:** ADR z wyborem stacku frontend + design system decisions.

---

### Sesja 3: Architektura systemu — wzorzec i struktura

**Cel:** Zdefiniować wzorzec architektoniczny, podział na moduły/domeny i sposób komunikacji.

**Zależności:** Sesja 1 i 2 (znamy stack)

**Kontekst:**
- 10-tygodniowy MVP — nie czas na overengineering
- Ale system musi być rozszerzalny o Wariant C (edge/offline, role, hardening) bez przepisywania
- Dokumentacja w `docs/02-architecture/c4/` ma diagramy C4 — zweryfikować aktualność

**Pytania do rozstrzygnięcia:**

1. Wzorzec architektoniczny:
   - **Modular monolith** — jeden deployment, wyraźne granice modułów (bezpieczne dla MVP)
   - **Modular monolith z event bus** — jak wyżej + asynchroniczna komunikacja (przygotowanie pod rozbicie)
   - **Microservices** — osobne serwisy od startu (zbyt ryzykowne przy 10-tygodniowym deadline?)
2. Podział na moduły/domeny (bounded contexts). Propozycja:
   - `show` — setlista, segmenty, warianty, metadane
   - `audio` — ingest, buforowanie, feature extraction
   - `engagement` — scoring, kalibracja, trend detection
   - `time` — timeline, curfew, prognoza, scenariusze odzysku
   - `recommendations` — ranking utworów, ML model, rule engine
   - `operator` — UI backend, WebSocket, manual tags
   - `analytics` — logi, post-show, eksport, raporty
   - `auth` — uwierzytelnianie (podstawowe)
3. Komunikacja wewnętrzna między modułami:
   - Direct imports / function calls
   - In-process event bus (EventEmitter / mediator pattern)
   - Message queue (Redis, NATS, RabbitMQ) — od razu czy dopiero jak się rozrośnie?
4. Jak oddzielić audio/ML pipeline od reszty systemu (osobny proces? worker thread? osobny kontener)?
5. Warstwa API: jeden gateway czy każdy moduł eksponuje swoje endpointy?

**Deliverable:** Diagram C4 (context + container), mapa modułów, ADR z wzorcem.

---

### Sesja 4: Baza danych i model danych

**Cel:** Wybrać bazę (lub bazy), zaprojektować model domenowy i strategię migracji.

**Zależności:** Sesja 3 (znamy moduły)

**Pytania do rozstrzygnięcia:**

1. Główna baza danych:
   - **PostgreSQL** — relacyjna, solidna, JSONB dla elastycznych danych, rozszerzenia (TimescaleDB)
   - **MongoDB** — dokumentowa, elastyczny schemat, ale słabsze relacje
   - **SQLite** — zero-ops, lokalna (przyszłe offline w Wariancie C), ale ograniczenia concurrency
2. Dane time-series (engagement score co 5-10s, audio features):
   - W tej samej bazie co reszta (PostgreSQL z TimescaleDB)?
   - Osobna baza (InfluxDB, QuestDB)?
   - Osobna tabela z partycjonowaniem po show_id + timestamp?
3. Model domenowy — kluczowe encje:
   - `Show` (wydarzenie) → `Setlist` → `Song` → `SongVariant` (full/short/acoustic)
   - `Segment` (blok setlisty) → `SegmentItem` (pozycja w segmencie)
   - `Venue` (obiekt) + `VenueCalibration`
   - `EngagementSnapshot` (time-series: timestamp, score, features)
   - `TimelineEvent` (start/stop utworu, opóźnienie, manual tag, decyzja)
   - `Recommendation` (co system zasugerował, co operator wybrał)
   - `ShowReport` (post-show analytics)
4. Relacje i ograniczenia:
   - Song ↔ warianty (1:N)
   - Song ↔ zależności między utworami (M:N z typem: "musi po", "nie może obok")
   - Show ↔ timeline events (1:N, append-only)
5. ORM vs query builder vs raw SQL:
   - Prisma, Drizzle, TypeORM, Sequelize (jeśli TS)
   - SQLAlchemy, Tortoise (jeśli Python)
6. Strategia migracji schematu (schema migrations)?
7. Seedowanie danych testowych — jak symulować koncert?

**Deliverable:** ER diagram, schema SQL/Prisma, ADR z wyborem bazy.

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

### Sesja 6: Audio pipeline — ingest i przetwarzanie

**Cel:** Zaprojektować cały pipeline od mikrofonu do metryki w bazie.

**Zależności:** Sesja 1 (stack backend), Sesja 4 (baza)

**Kontekst:**
- To **największe ryzyko techniczne** projektu — jakość sygnału, latency, różnice venue
- Dokumentacja mówi: okna 5-10s, audio z ambient / audience mic / FOH feed
- Feature extraction: cechy akustyczne + detekcja zdarzeń (oklaski, śpiew, krzyk, skandowanie, cisza)

**Pytania do rozstrzygnięcia:**

1. Jak audio trafia do systemu?
   - Streaming z mikrofonu (WebRTC, RTMP, WebSocket binary)?
   - Upload chunków (HTTP POST co 5-10s)?
   - Dedykowane urządzenie / Raspberry Pi z lokalnym pre-processingiem?
   - Bezpośrednio z miksera (dante, audio-over-IP)?
2. Format i jakość audio:
   - Sample rate (16kHz wystarczy? 44.1kHz? 48kHz?)
   - Mono vs stereo?
   - Kodek: WAV/PCM (bezstratny), Opus (kompresja), MP3?
   - Rozmiar okna: 5s, 10s, inny?
3. Buforowanie:
   - Ring buffer w pamięci?
   - Kolejka (Redis, RabbitMQ)?
   - Zapis na dysk jako fallback?
4. Feature extraction — jakie cechy wyciągać?
   - Energetyczne: RMS energy, zero-crossing rate, spectral flux
   - Spektralne: spectral centroid, bandwidth, MFCCs
   - Event detection: onset detection, voice activity detection (VAD)
   - Detekcja typów dźwięku: oklaski, śpiew zbiorowy, krzyk, cisza
5. Narzędzia / biblioteki:
   - **librosa** (Python) — standard, ale wolny bez GPU
   - **essentia** (C++/Python) — szybki, music-oriented
   - **TensorFlow/PyTorch audio** — jeśli potrzebne głębokie modele
   - **Web Audio API** — preprocessing na kliencie przed wysyłką?
   - **FFmpeg** — transkodowanie i pre-processing
6. Latency budget:
   - Ile ms od dźwięku w hali do metryki na ekranie operatora?
   - Gdzie jest największy bottleneck (sieć? processing? UI rendering)?
   - Target: < 15s end-to-end? < 30s?
7. Jak testować pipeline bez koncertu?
   - Nagrania z przeszłych eventów?
   - Syntetyczne dane audio?
   - Nagrania z YouTube/Spotify audience recordings?

**Deliverable:** Diagram pipeline (od mic do bazy), ADR z wyborem narzędzi, latency budget, plan testowania.

---

### Sesja 7: Engagement score — metryka energii

**Cel:** Zdefiniować, jak liczbowo wyrazić "energię publiczności".

**Zależności:** Sesja 6 (mamy features z audio pipeline)

**Kontekst:**
- Engagement score to kluczowy wskaźnik, na którym opiera się reszta systemu
- Wariant B wymaga **kalibracji per venue/gatunek**
- Score musi być zrozumiały dla showcallera (nie abstrakcyjna liczba)

**Pytania do rozstrzygnięcia:**

1. Definicja metryki:
   - Jedno-wymiarowy score (0-100)? Skala jakościowa (low/medium/high)?
   - Multi-wymiarowy (energia + nastrój)? Zbyt skomplikowane dla MVP?
   - Bazowy score + delta/trend (rośnie/maleje/stabilny)?
2. Jakie cechy audio wchodzą w skład score?
   - Głośność publiczności (RMS po odseparowaniu muzyki)
   - Częstotliwość zdarzeń (oklaski/krzyk na minutę)
   - Śpiew zbiorowy (korelacja z melodią utworu)
   - Cisza / brak reakcji
   - Proporcja typów zdarzeń (krzyk vs rozmowy)
3. Agregacja:
   - Rolling window (ostatnie 30s? 60s? 120s?)
   - Exponential moving average (świeższe dane ważniejsze)?
   - Per-utwór vs ciągły?
4. Kalibracja per venue:
   - Co dokładnie kalibrujemy? (baseline noise, peak capacity, acoustic gain)
   - Kiedy kalibracja się odbywa? (soundcheck? pierwsze minuty show? manualnie?)
   - Workflow kalibracji — jak wygląda dla operatora?
5. Kalibracja per gatunek:
   - Hip-hop vs pop vs rock vs elektronika — inne baseline'y energii
   - Profile gatunkowe: predefiniowane czy tworzone per artysta?
6. Normalizacja:
   - Jak porównać koncert 500 osób z koncertem 50 000?
   - Relative scoring (vs. baseline tego show) czy absolute?
7. Walidacja:
   - Jak sprawdzić, czy score jest "poprawny"?
   - Porównanie z subiektywną oceną showcallera po fakcie?
   - Annotated dataset: nagranie + ludzka etykieta "tu była wysoka energia"?

**Deliverable:** Wzór/algorytm engagement score, strategia kalibracji, plan walidacji, ADR.

---

### Sesja 8: Silnik rekomendacji i ML

**Cel:** Zaprojektować mechanizm rankingu utworów i rekomendacji.

**Zależności:** Sesja 7 (mamy engagement score)

**Kontekst:**
- Wariant A: reguły (if-then). Wariant B: ML — ale "ML" to szerokie pojęcie
- System rekomenduje, nie decyduje (human-in-the-loop)
- Musi uwzględniać: engagement, czas, dramaturgię, ograniczenia techniczne

**Pytania do rozstrzygnięcia:**

1. Rule engine (baza):
   - Jakie reguły twarde (constraints)? Np.: "po pirotechnice nie może być akustyczny", "hit X nie może być pominięty"
   - Jakie reguły miękkie (preferencje)? Np.: "po spadku energii sugeruj banger"
   - Format reguł — hardcoded, konfiguracja JSON, DSL?
2. ML model (Wariant B):
   - Co model predykuje? (engagement delta po zagraniu utworu X w kontekście Y?)
   - Jakie features wchodzą do modelu?
     - Aktualny engagement score + trend
     - Pozycja w setliście (ile zostało)
     - Czas do curfew
     - Historia zagranych utworów w tym show
     - Metadane utworu (BPM, gatunek, energy label)
     - Dane historyczne z poprzednich koncertów
   - Jaki typ modelu?
     - Gradient boosting (XGBoost, LightGBM) — szybki, interpretowalny
     - Neural network — więcej danych potrzeba
     - Bandit / reinforcement learning — uczy się na bieżąco
   - Gdzie model działa? (w procesie backendowym? osobny serwis? pre-computed scores?)
3. Cold start:
   - Nowy artysta, zero danych historycznych — jak wtedy?
   - Fallback na reguły + ogólne profile gatunkowe?
4. Prezentacja rekomendacji:
   - Top N utworów z scoring/ranking?
   - Score + uzasadnienie (dlaczego ten utwór?)
   - Scenariusze ("jeśli X to..., jeśli Y to...")
5. Feedback loop:
   - Operator zaakceptował / odrzucił rekomendację → dane treningowe
   - Jak logować i przetwarzać feedback?
6. Ewaluacja modelu:
   - Offline: backtesting na danych historycznych
   - Online: A/B testing (realistyczne przy 1 koncercie na raz?)
   - Metryka sukcesu: recommendation acceptance rate? engagement improvement?

**Deliverable:** Architektura silnika rekomendacji, ADR (reguły vs ML vs hybrid), schema feature store.

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

### Sesja 10: Real-time communication i event architecture

**Cel:** Zaprojektować, jak dane płyną w systemie w czasie rzeczywistym.

**Zależności:** Sesja 3 (architektura)

**Kontekst:**
- Engagement score, timer, rekomendacje muszą aktualizować się na panelu operatora co kilka sekund
- Manual tagi od operatora muszą trafiać do systemu natychmiast
- System musi przetrwać chwilową utratę połączenia

**Pytania do rozstrzygnięcia:**

1. Protokół frontend ↔ backend:
   - **WebSocket** — full-duplex, bidirectional (operator wysyła tagi, otrzymuje updates)
   - **SSE (Server-Sent Events)** — prostsze, unidirectional (server → client) + REST dla client → server
   - **Kombinacja**: SSE dla push + REST/WebSocket dla input?
2. Event bus wewnętrzny (backend):
   - In-process: EventEmitter / mediator (wystarczające dla monolitha?)
   - Redis Pub/Sub (lekki, powszechny)
   - NATS (szybki, cloud-native)
   - RabbitMQ (feature-rich, ale cięższy)
3. Kluczowe eventy w systemie:
   - `audio.chunk.received` → `audio.features.extracted` → `engagement.updated`
   - `show.song.started` → `show.song.ended` → `time.forecast.updated`
   - `operator.tag.added` → `show.event.logged`
   - `recommendation.generated` → `recommendation.accepted` / `recommendation.dismissed`
   - `time.alert.triggered` (threshold crossed)
4. Gwarancje dostarczenia:
   - At-least-once vs at-most-once vs exactly-once?
   - Ordering: czy kolejność eventów ma znaczenie?
   - Idempotency: jak obsłużyć duplikaty?
5. Resilience:
   - Co gdy WebSocket się rozłączy? Reconnect + missed events?
   - Backpressure: co gdy frontend nie nadąża z renderowaniem?
   - Heartbeat / health check?
6. Skala:
   - Ile połączeń WebSocket jednocześnie? (1 show = 1-5 operatorów?)
   - Ile eventów/s? (audio chunk co 5-10s + derived events)
   - Czy to wymaga dedykowanego rozwiązania, czy plain WebSocket wystarczy?

**Deliverable:** Diagram event flow, lista eventów z payloadami, ADR z wyborem protokołu.

---

### Sesja 11: Stan live show i fail-safe

**Cel:** Zaprojektować zarządzanie stanem aktywnego show i zachowanie systemu przy awariach.

**Zależności:** Sesja 4 (baza), Sesja 10 (eventy)

**Kontekst:**
- Dokumentacja wielokrotnie podkreśla **fail-safe**: awaria systemu NIE MOŻE blokować koncertu
- Stan show (aktualny utwór, pozycja w setliście, running timers, skumulowane opóźnienia) jest krytyczny
- Pytanie: co jeśli serwer się zrestartuje w trakcie koncertu?

**Pytania do rozstrzygnięcia:**

1. Gdzie żyje stan live show?
   - W pamięci (szybki, ale tracimy przy restarcie)?
   - W bazie (trwały, ale latency na każdy zapis)?
   - Hybrid: w pamięci + periodic snapshot do bazy?
   - Event sourcing: stan odtwarzany z logu eventów?
2. Recovery po restarcie:
   - Automatyczne wznowienie z ostatniego snapshotu?
   - Operator musi ręcznie potwierdzić "tu jesteśmy"?
   - Ile sekund danych można stracić?
3. Fail-safe per komponent:
   - **Audio pipeline padł** → UI pokazuje "brak danych audio", engagement score zamrożony, reszta działa
   - **ML model padł** → fallback na rule engine
   - **Baza danych padła** → tymczasowy zapis do pliku/pamięci
   - **Frontend stracił połączenie** → reconnect + catch-up, UI jasno komunikuje "offline"
   - **Cały backend padł** → koncert idzie dalej klasycznie, operator przechodzi na backup (papierowa setlista)
4. Health monitoring (minimum dla MVP):
   - Health endpoint (`/health`)
   - Heartbeat na WebSocket
   - Status komponentów widoczny na panelu operatora
   - Structured logging (co, kiedy, dlaczego)
5. Graceful degradation UI:
   - Jak panel operatora prezentuje częściowe dane?
   - Które sekcje panelu mogą być "wyszarzone" vs ukryte?
   - Jasna komunikacja: "Dane audio niedostępne — system działa w trybie ograniczonym"
6. Pre-show checklist:
   - Automatyczny test łączności audio → backend → UI przed startem show?
   - Go/no-go dashboard?

**Deliverable:** Failure mode matrix, strategia state management, diagram graceful degradation, ADR.

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

### Sesja 14: Infrastruktura i deployment

**Cel:** Wybrać hosting, zdefiniować pipeline CI/CD i strategię deploymentu.

**Zależności:** Sesja 3 (architektura)

**Kontekst:**
- Budżet: 200-800 PLN/miesiąc (pilot/testy)
- Koszt per event: kilka-kilkanaście PLN
- Full observability to Wariant C, ale minimum monitoringu potrzebne

**Pytania do rozstrzygnięcia:**

1. Cloud provider:
   - **AWS** — największy ekosystem, dużo managed services, ale pricing
   - **GCP** — dobry do ML (Vertex AI), Cloud Run
   - **Hetzner** — tani, europejski, ale mniej managed services
   - **Fly.io / Railway / Render** — szybki start, prostota, developer-friendly
   - **VPS (DigitalOcean, Linode)** — pełna kontrola, niski koszt
2. Containerization:
   - Docker (obowiązkowe?)
   - Orchestration: docker-compose (dev/staging) vs Kubernetes (overkill dla MVP?)
   - Managed containers: ECS, Cloud Run, Fly.io?
3. CI/CD pipeline:
   - GitHub Actions / GitLab CI / inne?
   - Etapy: lint → test → build → deploy
   - Auto-deploy na staging z `main`? Manual deploy na production?
4. Environments:
   - Development (local)
   - Staging (cloud, mirror prod)
   - Production
   - Czy potrzebne review environments (per PR)?
5. Monitoring minimum (bez full observability z Wariantu C):
   - Health checks
   - Error tracking (Sentry?)
   - Basic metrics (uptime, response time, error rate)
   - Structured logging (gdzie? CloudWatch, Loki, Betterstack?)
   - Alerty: kiedy i jak (email, Slack)?
6. Baza danych hosting:
   - Managed (RDS, Supabase, Neon, PlanetScale)?
   - Self-hosted na tym samym serwerze?
7. DNS, SSL, domena?
8. Backup strategy?

**Deliverable:** Diagram infrastruktury, koszt estimate, CI/CD pipeline definition, ADR.

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

### Sesja 16: Developer experience i projekt setup

**Cel:** Zdefiniować strukturę repozytorium, tooling i standardy.

**Zależności:** Sesja 1 (backend), Sesja 2 (frontend), Sesja 3 (architektura)

**Pytania do rozstrzygnięcia:**

1. Mono-repo vs multi-repo:
   - Mono-repo: jeden repo, paczki/workspaces (Nx, Turborepo, pnpm workspaces)
   - Multi-repo: osobne repo na backend, frontend, ML
   - Przy 10-tygodniowym MVP: mono-repo jest prostsze
2. Struktura katalogów (propozycja do zweryfikowania):
   ```
   /apps
     /api          — backend (NestJS / FastAPI / ...)
     /web          — frontend (React / Svelte / ...)
     /ml           — ML pipeline (jeśli osobny)
   /packages
     /shared        — wspólne typy, utils
     /audio-sdk     — audio processing lib
   /docs            — dokumentacja
   /infra           — IaC, docker, CI/CD
   ```
3. Coding standards:
   - Linter: ESLint / Biome / Ruff (Python)?
   - Formatter: Prettier / Biome?
   - Pre-commit hooks (Husky + lint-staged)?
   - Commit convention (Conventional Commits)?
4. Git workflow:
   - Trunk-based development (short-lived branches + feature flags)?
   - GitHub Flow (feature branches + PR)?
   - Gitflow (overkill dla MVP)?
5. Dokumentacja techniczna:
   - Co zostaje z obecnych `docs/` (88 plików, wiele z template OpsDesk)?
   - Co wyrzucić / przepisać?
   - ADR format i lokalizacja?
6. Onboarding:
   - `README.md` z instrukcją uruchomienia
   - `docker-compose up` i działa?
   - Dane seedowe / demo mode?
7. Dev tooling:
   - Hot reload (backend + frontend)
   - Debug config (VSCode launch.json?)
   - API client (Bruno, Insomnia, HTTPie)?

**Deliverable:** Zainicjalizowane repo z base config, README, docs cleanup plan.

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

| # | Sesja | Status | ADR / Notatki | Data |
|---|-------|--------|---------------|------|
| 1 | Stack backend | ✅ Rozstrzygnięta | `ai/StageBrain_Architektura_i_Plan.md` §3.1 | 2026-02-18 |
| 2 | Stack frontend | ✅ Rozstrzygnięta | `ai/StageBrain_Architektura_i_Plan.md` §3.2 | 2026-02-18 |
| 3 | Architektura systemu | ✅ Rozstrzygnięta (high-level) | `ai/StageBrain_Architektura_i_Plan.md` §5, §6 | 2026-02-18 |
| 4 | Baza danych i model danych | 🟡 Częściowo (wybór bazy, schemat high-level) | `ai/StageBrain_Architektura_i_Plan.md` §3.3, §4 | 2026-02-18 |
| 5 | Security, auth i prywatność | ⬜ Otwarta (zasygnalizowana, brak decyzji) | — | — |
| 6 | Audio pipeline | 🟡 Częściowo (narzędzia wybrane, detale do dopracowania) | `ai/StageBrain_Architektura_i_Plan.md` §3.5 | 2026-02-18 |
| 7 | Engagement score | 🟡 Częściowo (formuła v1, kalibracja manualna) | `ai/StageBrain_Architektura_i_Plan.md` §3.5 | 2026-02-18 |
| 8 | Silnik rekomendacji i ML | 🟡 Częściowo (LightGBM wybrany, features zarysowane) | `ai/StageBrain_Architektura_i_Plan.md` §3.6 | 2026-02-18 |
| 9 | Kontrola czasu | ⬜ Otwarta (plan implementacji jest, ale detale algorytmu nie) | — | — |
| 10 | Real-time communication | ✅ Rozstrzygnięta | `ai/StageBrain_Architektura_i_Plan.md` §3.7 | 2026-02-18 |
| 11 | Stan live show i fail-safe | 🟡 Częściowo (strategia fail-safe omówiona, detale state mgmt nie) | `ai/StageBrain_Sesja_Architektoniczna_2026-02-18.md` §3.3 | 2026-02-18 |
| 12 | API design i kontrakty | ⬜ Otwarta (endpointy zarysowane w planie, ale brak OpenAPI spec) | — | — |
| 13 | Post-show, eksport, raporty | ⬜ Otwarta (zakres opisany, architektura nie) | — | — |
| 14 | Infrastruktura i deployment | ✅ Rozstrzygnięta | `ai/StageBrain_Architektura_i_Plan.md` §3.8 | 2026-02-18 |
| 15 | Testing strategy | ⬜ Otwarta | — | — |
| 16 | Developer experience | ⬜ Otwarta (struktura repo zarysowana) | — | — |

> **Uwaga**: Sesje oznaczone ✅ zostały rozstrzygnięte podczas sesji architektonicznej 2026-02-18.
> Pełne notatki z sesji: `ai/StageBrain_Sesja_Architektoniczna_2026-02-18.md`
> Decyzje architektoniczne: `ai/StageBrain_Architektura_i_Plan.md`

---

## Co dodałem względem pierwszej wersji

1. **Sesja 5: Security, auth i prywatność** — nawet MVP potrzebuje loginu i świadomości RODO przy nagrywaniu audio publiczności
2. **Sesja 9: Kontrola czasu** — wydzielona z sesji rekomendacji, bo to osobny, złożony podsystem
3. **Sesja 11: Stan live show i fail-safe** — kluczowy temat podkreślany w dokumentacji; jak system przetrwa restart, utratę komponentów, rozłączenie
4. **Sesja 12: API design** — jawny kontrakt frontend-backend zamiast "jakoś się dogadamy"
5. **Rozszerzono diagram zależności** — teraz pokazuje dokładnie, co blokuje co
6. **Tabela równoległości** — widać, które sesje prowadzić jednocześnie
7. **Checklist postępu** — do śledzenia, co już rozstrzygnięte
