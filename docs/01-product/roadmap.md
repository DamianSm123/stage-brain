# Roadmapa Produktu

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Deweloper / AI

---

## Strategia

Startujemy z **MVP Plus (Wariant B)** — funkcjonalnym produktem do pierwszych wdrożeń komercyjnych. Cel: **stabilny pilot do testu na wydarzeniu w maju 2026**.

Podejście: szybkie iteracje, równoległe prowadzenie UX + backend, intensywne wykorzystanie AI w procesie wytwarzania.

## Warianty Realizacji (Kontekst)

| Wariant | Dla kogo | Zakres w skrócie | Czas |
|:---|:---|:---|:---|
| **A. Pilot MVP** | Szybki test na trasie / proof-of-value | Audio + engagement, kontrola czasu, rekomendacje (reguły), panel operatora, logi | 8 tyg. |
| **B. MVP Plus** *(WYBRANY)* | MVP do pierwszych wdrożeń komercyjnych | A + kalibracja per venue, ML ranking (LightGBM), panel post-show, eksport, raporty | **10 tyg.** |
| **C. Production Track** | Produkt gotowy do skali (tour / festiwal) | B + tryb hybrydowy (edge/offline), observability, role użytkowników, hardening, pilotaż onsite | 12 tyg. |

## Plan Realizacji — Wariant B (10 tygodni)

### Faza 0: Kick-off + Setup (3-5 dni, T1)

**Produktowe (warsztat z TINAP):**
- Mapa decyzji showcallera
- Format setlisty (Excel/CSV/JSON → schema importu)
- Źródło audio na venue
- Metryki sukcesu pilota
- 3-5 typowych scenariuszy decyzyjnych

**Techniczne:**
- Monorepo zainicjalizowane (`apps/api`, `apps/web`, `packages/`, `infra/`)
- FastAPI boilerplate + React/Vite boilerplate
- Docker Compose — `docker compose up` uruchamia stack
- GitHub Actions: lint + test na PR

### Faza 1: Prototyp UX + Specyfikacja (1 tydzień, T2)

- Kluczowe ekrany panelu (live, setup, post-show)
- User stories w backlogu
- Flow: setup → live → post-show
- API contract draft (OpenAPI)

### Faza 2: Fundamenty Real-time (2 tygodnie, T3-T4)

- WebSocket audio ingest (binary chunks)
- Audio buffer, librosa feature extraction (RMS, spectral)
- YAMNet integration (klasyfikacja zdarzeń)
- [Engagement score](../00-start-here/glossary.md#engagement-score) v1 (ważona suma)
- Redis pub/sub + WebSocket broadcast do panelu
- Panel Live v1: gauge, trend, mini-timeline
- **Deliverable**: Demo end-to-end (mikrofon → serwer → panel, latencja < 15s)

### Faza 3: Setlista + Kontrola Czasu (2 tygodnie, T5-T6)

- Model danych: setlisty, [segmenty](../00-start-here/glossary.md#segment), [warianty](../00-start-here/glossary.md#wariant-variant) (full/short)
- REST API: CRUD setlista, import CSV
- Show timeline: start/end/skip segment
- Manualne [tagi operatora](../00-start-here/glossary.md#tag-operatora-operator-tag)
- Time tracking engine (planowane vs faktyczne, delta)
- Prognoza do [curfew](../00-start-here/glossary.md#curfew) + scenariusze odzysku
- Frontend: setup setlisty, widok live, zegar, prognoza

> **Milestone**: Płatność 40%

### Faza 4: Rekomendacje ML + Kalibracja (2 tygodnie, T7-T8)

- Feature engineering (energia, trend, pozycja, historia, tempo, kontrast)
- [LightGBM](../00-start-here/glossary.md#lightgbm) model (start: dane syntetyczne + reguły TINAP)
- [Fallback regułowy](../00-start-here/glossary.md#fallback-regułowy)
- Log rekomendacji + decyzji operatora
- [Kalibracja per venue](../00-start-here/glossary.md#kalibracja-venue-calibration): presety (hala, stadion, klub, open air), parametry, korekty ręczne
- Frontend: rekomendacje top 3-5, accept/reject, wizard kalibracji

### Faza 5: Post-show + Eksport + Raporty (1 tydzień, T9)

- Endpoint analytics (engagement timeline, per-segment stats)
- Eksport CSV/JSON
- Automatyczny raport PDF
- Frontend post-show: interaktywny wykres, tabela, heatmap, eksport

### Faza 6: Pilot + Poprawki (1-2 tygodnie, T10+)

**Testy:**
1. Laboratoryjny — nagrania przez głośnik → mikrofon → system (90 min stability)
2. Próba na żywo — soundcheck z TINAP (jeśli dostępny)
3. Dress rehearsal — pełny flow setup → live → post-show

**Kryteria sukcesu** — patrz [nfr.md](./nfr.md).

> **Milestone**: Płatność 20% (po pilocie)

## Opcje Dodatkowe (Po MVP Plus)

Poniższe elementy NIE wchodzą w zakres Wariantu B:

- **Elementy Wariantu C**: tryb hybrydowy (edge/offline), observability, role użytkowników, hardening, pilotaż onsite + runbook
- **Moduł wideo** (bez rozpoznawania twarzy) + konsultacja prawna / privacy-by-design
- **Integracje z narzędziami produkcyjnymi** (import setlisty z formatu klienta, eksport do narzędzi planowania)
- **Tryb multi-venue / multi-tour** (panel administracyjny, zarządzanie konfiguracjami)
- **On-site support** na wybranych datach (próba + koncert)
- **Strategia go-to-market** (płatności, pakiety dla klientów zagranicznych)
