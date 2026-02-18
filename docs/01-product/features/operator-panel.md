# Operator Panel (Panel Operatora)

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Deweloper / AI

---

## Cel i Wartość

Centralny interfejs systemu StageBrain — jedyny punkt interakcji operatora/showcallera z systemem. Panel musi być **bardzo czytelny**, **odporny na stres** i **zorientowany na szybkie decyzje**. Projektowany pod warunki backstage: ciemno, głośno, rękawiczki, tablet.

## Zakres (Scope)

### In
- Trzy tryby: **Pre-show Setup**, **Live Panel**, **Post-show Review**.
- Real-time updates przez [WebSocket](../../00-start-here/glossary.md#websocket).
- Ciemny motyw (domyślny i jedyny w MVP).
- Responsywność: tablet (primary) + laptop.

### Out
- Aplikacja mobilna (tylko web SPA).
- Jasny motyw.
- Wielojęzyczność (UI w angielskim na MVP).

## Tryby Panelu

### 1. Pre-show Setup

Ekran konfiguracji przed koncertem.

**Elementy:**
- Wybór/tworzenie show (venue, data, curfew).
- Import/edycja setlisty (patrz [dynamic-setlist.md](./dynamic-setlist.md)).
- Konfiguracja kalibracji venue (patrz [venue-calibration.md](./venue-calibration.md)).
- Test audio — button "Start Audio Test", wizualizacja baseline energy z mikrofonu.
- Przycisk "Start Show" (widoczny gdy konfiguracja kompletna).

### 2. Live Panel

Główny ekran w trakcie koncertu. Podzielony na strefy informacyjne.

**Layout (koncepcyjny):**

```
┌─────────────────────────────────────────────────────────────────┐
│  STATUS BAR: Show elapsed | Curfew countdown | Delta | Alert   │
├──────────────────────┬──────────────────────────────────────────┤
│                      │                                          │
│  ENGAGEMENT          │  SETLISTA + TIMELINE                     │
│  ─────────           │  ────────────────────                    │
│  Gauge (0-1)         │  ▶ [Active] Song C        04:12 / 05:00 │
│  Trend arrow ↑↓→     │    [Planned] Song D       —             │
│  Klasyfikacja        │    [Planned] Encore        —             │
│  (oklaski/krzyk/...) │    [Skipped] Interlude     —             │
│                      │                                          │
│  QUICK TAGS          │  [Start Next] [Skip] [End Segment]      │
│  ──────────          │                                          │
│  [Tech Issue]        ├──────────────────────────────────────────┤
│  [Energy ↓]          │                                          │
│  [Energy ↑]          │  REKOMENDACJE ML                         │
│  [Custom]            │  ─────────────────                       │
│                      │  1. Song X (92%) — kontrast +            │
│                      │  2. Song Y (78%) — oszczędność czasu     │
│                      │  3. Song Z (65%) — buduje napięcie       │
│                      │                                          │
│                      │  [Accept #1] [Reject All]                │
│                      │                                          │
├──────────────────────┴──────────────────────────────────────────┤
│  TIME RECOVERY (jeśli opóźnienie):                              │
│  Scenariusz A: Skróć Song D (-2:00) → OK                       │
│  Scenariusz B: Pomiń Interlude (-3:30) → OK     [Zastosuj A]   │
└─────────────────────────────────────────────────────────────────┘
```

**Strefy:**

| Strefa | Zawartość | Aktualizacja |
|:---|:---|:---|
| **Status Bar** | Show elapsed, curfew countdown, delta, alert (zielony/żółty/czerwony) | Real-time (co 1s zegar, co 5s delta) |
| **Engagement** | Gauge 0-1, trend arrow, etykieta klasyfikacji YAMNet | Real-time (co 5-10s) |
| **Setlista** | Lista segmentów z aktualnym statusem, czas elapsed aktywnego | Real-time |
| **Akcje segmentu** | Start Next, Skip, End Segment — duże przyciski | On demand |
| **Quick Tags** | Predefiniowane tagi + custom | On demand |
| **Rekomendacje** | Top 3-5 segmentów z ML, %, uzasadnienie | Po każdym segmencie / przy spadku energii |
| **Time Recovery** | Scenariusze odzysku (jeśli opóźnienie) | Przy przekroczeniu progu |

### 3. Post-show Review

Ekran analityki po koncercie (patrz [post-show-analytics.md](./post-show-analytics.md)).

## Wymagania UX

| Wymaganie | Specyfikacja |
|:---|:---|
| **Motyw** | Ciemny (dark). Tło: ~#1a1a2e lub podobne. Tekst: biały/jasny szary. |
| **Touch targets** | Min. 48px × 48px (wszystkie interaktywne elementy). |
| **Kontrast** | WCAG AA minimum. Kolory statusowe: zielony (#22c55e), żółty (#eab308), czerwony (#ef4444). |
| **Kliknięcia do decyzji** | Max 1-2 tapy od zobaczenia rekomendacji do zatwierdzenia. |
| **Stabilność layoutu** | Żadnych przesunięć, skoków, przeładowań przy aktualizacji danych. |
| **Font** | Monospace lub sans-serif o dobrej czytelności. Min. 16px body, 24px+ dla kluczowych metryk. |
| **Offline badge** | Gdy WebSocket disconnected → "OFFLINE" badge, ostatnie dane widoczne. |

## Scenariusze

### Start Show
1. Konfiguracja kompletna (setlista, venue, kalibracja, audio OK).
2. Operator tapuje "Start Show".
3. Panel przechodzi z Setup do Live.
4. Zegar startuje. Pierwszy segment automatycznie w statusie `active` (lub operator tapuje "Start First").

### End Show
1. Ostatni segment → `completed`.
2. Operator tapuje "End Show".
3. Panel przechodzi do Post-show Review.
4. System generuje automatyczny raport.

## Reguły

- Panel live nie ma opcji "cofnij" (undo) na segmentach — decyzje są finalne.
- Dane na panelu zawsze pochodzą z WebSocket (nie polling).
- Przy utracie WebSocket — panel trzyma ostatnie dane + badge "OFFLINE".
- Reconnect jest automatyczny (exponential backoff).
- Po reconnect — panel pobiera snapshot aktualnego stanu z serwera.

## Linki

- Powiązane: [engagement-scoring.md](./engagement-scoring.md), [time-control.md](./time-control.md), [ml-recommendations.md](./ml-recommendations.md), [operator-tags.md](./operator-tags.md)
