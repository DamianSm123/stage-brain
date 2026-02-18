# Słownik Pojęć (Glossary)

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Deweloper / AI

---

Centralny słownik pojęć domenowych używanych w projekcie StageBrain. Zawsze dodawaj tutaj nowe terminy, aby uniknąć niejasności.

## Aktorzy i Role

### Showcaller / Reżyser / Producent

Główny użytkownik systemu. Osoba podejmująca decyzje w czasie rzeczywistym podczas koncertu — zarządza przebiegiem show, kolejnością segmentów, reaguje na opóźnienia i energię publiczności.

- **Kluczowe obowiązki**: Decyzje o kolejności utworów, zarządzanie czasem, reagowanie na sytuacje live.
- **Relacja z systemem**: StageBrain **rekomenduje** — showcaller **decyduje** (human-in-the-loop).

### Operator

Osoba obsługująca panel StageBrain podczas koncertu. W MVP to ta sama osoba co showcaller. W przyszłości może być dedykowany technik.

- **Kluczowe obowiązki**: Konfiguracja pre-show (venue, setlista, kalibracja), obsługa panelu live (start/stop segmentów, tagi, akceptacja rekomendacji), przegląd post-show.

### TINAP

Design partner i inicjator projektu. Ekipa showcallingu i stage managementu (Quebonafide, Mata, Sobel). Źródło know-how produkcyjnego, pierwszy użytkownik i miejsce testów MVP.

## Koncert i Setlista

### Show (Koncert)

Konkretne wydarzenie muzyczne — powiązane z venue, datą, setlistą i curfew. Stany show: `setup` → `live` → `paused` → `ended`.

### Setlista

Uporządkowana lista segmentów/utworów do zagrania podczas koncertu. Importowana przed show (CSV na start), edytowalna przez operatora.

### Segment

Pojedynczy utwór lub blok w setliście. Posiada warianty (full/short), planowany czas, BPM, gatunek. Stany segmentu: `planned` → `active` → `completed` | `skipped`.

### Wariant (Variant)

Wersja segmentu — **full** (pełna) lub **short** (skrócona). Każdy wariant ma zdefiniowany czas trwania. System może rekomendować wariant short do odzyskania czasu.

### Curfew

Twardy limit czasowy zakończenia koncertu (wynikający z umowy z obiektem, regulacji hałasowych, logistyki). Przekroczenie curfew = kary finansowe i ryzyko wizerunkowe.

## Audio i Analiza

### Engagement Score

Zagregowana metryka zaangażowania publiczności w skali 0-1. Obliczana co 5-10 sekund na podstawie analizy audio (głośność, jasność dźwięku, klasyfikacja zdarzeń). Służy showcallerowi do oceny energii tłumu.

### Audio Pipeline

Dwuwarstwowy system przetwarzania audio:
1. **librosa** — metryki sygnałowe (RMS Energy, Spectral Centroid, ZCR, Spectral Rolloff).
2. **YAMNet** — klasyfikacja zdarzeń (oklaski, krzyk, skandowanie, cisza, śpiew).

### RMS Energy

Root Mean Square Energy — miara głośności dźwięku w oknie czasowym. Bazowy wskaźnik energii publiczności.

### Spectral Centroid

"Jasność" dźwięku — wysoka wartość = krzyk/oklaski, niska = mruczenie/cisza.

### YAMNet

Pre-trenowany model Google (AudioSet, 521 klas dźwięków). Używany do klasyfikacji zdarzeń crowd: Applause, Cheering, Crowd, Chanting, Singing, Silence.

### Kalibracja (Venue Calibration)

Dostosowanie parametrów analizy audio do specyfiki miejsca i gatunku. Ręczna przed show — operator wybiera preset (hala, stadion, klub, open air) i opcjonalnie koryguje parametry.

### Okno czasowe (Audio Window)

Fragment audio analizowany jednorazowo — 5-10 sekund. System przetwarza audio w takich oknach i produkuje engagement score co ~5 sekund.

## ML i Rekomendacje

### LightGBM

Algorytm ML (gradient boosting) używany do rankingu rekomendowanych następnych segmentów. Trenowany na features: energia, trend, pozycja w setliście, historyczna skuteczność, kontrast vs poprzedni segment.

### Rekomendacja

Sugestia systemu dotycząca następnego segmentu do zagrania. Ranking top 3-5 segmentów z uzasadnieniem. **Decyzja zawsze należy do showcallera.**

### Fallback regułowy

Prosty scoring (if/else) używany gdy model ML nie ma wystarczającej pewności (confidence < threshold). Scoring: energia utworu × dopasowanie do aktualnego poziomu zaangażowania.

## Architektura i Infrastruktura

### Modularny Monolit

Styl architektoniczny StageBrain. Jeden serwis Python/FastAPI (nie microservices), ale logicznie podzielony na moduły domenowe: audio, engagement, recommendations, setlist, shows, analytics, websocket, core.

### Human-in-the-loop

Zasada projektowa: system rekomenduje i pokazuje scenariusze, ale **decyzję zawsze podejmuje człowiek** (showcaller/operator).

### Fail-safe

Zasada projektowa: awaria systemu nie może blokować realizacji koncertu. Gdy backend niedostępny → panel pokazuje "OFFLINE" badge → koncert idzie dalej klasycznie.

### WebSocket

Protokół komunikacji real-time między serwerem a panelem operatora. Dwa endpointy:
- Audio ingest: venue → serwer (binary, chunki PCM/Opus co 5-10s).
- Live panel: serwer ↔ panel (JSON, engagement, rekomendacje, czas, alerty).

### TimescaleDB

Extension PostgreSQL do danych time-series. Hypertable na metryki engagement (automatyczne partycjonowanie po czasie, kompresja, continuous aggregates dla post-show analytics).

## Tagi i Logi

### Tag operatora (Operator Tag)

Manualne oznaczenie kontekstowe dodane przez showcallera w trakcie koncertu — np. "problem techniczny", "energia spada", "publiczność szaleje". Zapisywane z timestampem, widoczne w post-show analytics.

### Scenariusz odzysku czasu (Time Recovery Scenario)

Propozycja systemu jak nadrobić opóźnienie — np. "skróć segment X do wersji short (-2:30)", "pomiń segment Y (-4:00)". Showcaller wybiera i zatwierdza scenariusz.
