# Time Control (Kontrola Czasu i Curfew)

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Deweloper / AI

---

## Cel i Wartość

Drugi fundament systemu (obok [engagement scoring](./engagement-scoring.md)). Stała kontrola czasu, prognoza do [curfew](../../00-start-here/glossary.md#curfew) i prezentacja scenariuszy odzysku czasu. Bez tego modułu showcaller nie ma obiektywnego podglądu na sytuację czasową — a przekroczenie curfew to kary finansowe i ryzyko wizerunkowe.

## Zakres (Scope)

### In
- Zegar show: czas od startu, czas elapsed aktualnego segmentu.
- Porównanie planowanego vs faktycznego czasu per segment.
- Delta (opóźnienie / wyprzedzenie) — kumulatywna i per segment.
- Prognoza czasu zakończenia na podstawie aktualnego tempa.
- Prognoza przekroczenia curfew (z marginesem).
- [Scenariusze odzysku czasu](../../00-start-here/glossary.md#scenariusz-odzysku-czasu-time-recovery-scenario).
- Alerty czasowe (próg ostrzegawczy, próg krytyczny).

### Out
- Automatyczne skracanie segmentów (system proponuje, nie wykonuje).
- Automatyczne dopasowywanie kolejności segmentów (opcja po MVP — na podstawie danych historycznych + live).

## Dane Wejściowe

| Źródło | Dane | Kiedy |
|:---|:---|:---|
| Setlista | Planowane czasy segmentów (full/short) | Pre-show |
| Konfiguracja show | Curfew (twardy limit) | Pre-show |
| Show timeline | Faktyczne czasy start/end segmentów | Live |
| Operator | Skip / wariant short | Live |

## Metryki Czasowe (Live)

| Metryka | Opis |
|:---|:---|
| **Show elapsed** | Czas od startu show |
| **Segment elapsed** | Czas od startu aktualnego segmentu |
| **Delta** (kumulatywna) | Suma opóźnień/wyprzedzeń — `faktyczny - planowany` |
| **Time remaining** | Czas do curfew |
| **Projected end** | Prognoza zakończenia (aktualny czas + suma remaining segmentów) |
| **Curfew delta** | `projected_end - curfew` (ujemna = OK, dodatnia = przekroczenie) |

## Scenariusze Odzysku Czasu

Gdy `curfew_delta > 0` (prognozowane przekroczenie), system generuje warianty odzysku:

### Typy scenariuszy

1. **Skróć segment** — zamień wariant `full` na `short` dla wybranego segmentu.
   - Oszczędność: `duration_full - duration_short`.
   - System pokazuje top segmenty z największą oszczędnością.

2. **Pomiń segment** — skip całego segmentu.
   - Oszczędność: `duration_full` (lub `duration_short`).
   - System oznacza segmenty o najniższym priorytecie (np. najniższy historyczny engagement).

3. **Kombinacja** — mix skróceń i pominięć.
   - System generuje kilka wariantów z różnym trade-off: czas vs wpływ na show.

### Przykład prezentacji

```
⚠️ Opóźnienie: +3:20 — przekroczenie curfew o ~5 min

Scenariusz A: Skróć "Song C" do short (-2:00) + Skróć "Encore" do short (-2:00)
              → Oszczędność: 4:00 → Curfew OK

Scenariusz B: Pomiń "Interlude" (-3:30)
              → Oszczędność: 3:30 → Curfew ±0:10

Scenariusz C: Skróć "Song C" do short (-2:00)
              → Oszczędność: 2:00 → Nadal +1:20
```

## Alerty

| Alert | Warunek | Kolor |
|:---|:---|:---|
| **OK** | `curfew_delta ≤ 0` | Zielony |
| **Warning** | `0 < curfew_delta ≤ 5 min` | Żółty |
| **Critical** | `curfew_delta > 5 min` | Czerwony |

Progi konfigurowalne przez operatora w setup.

## Scenariusze Użycia

### Happy Path
1. Show startuje on time.
2. Panel pokazuje zielony status czasu, prognoza = curfew - X min.
3. Każdy segment kończy się ±30s od planu.
4. Prognoza aktualizuje się po każdym segmencie.

### Narastające Opóźnienie
1. Segment 3 trwa 2 min dłużej niż planowano.
2. Delta kumulatywna: +2:00.
3. Panel zmienia kolor na żółty. Pojawia się prognoza przekroczenia.
4. System generuje scenariusze odzysku.
5. Showcaller wybiera scenariusz (np. "skróć Song C do short").
6. Operator zatwierdza → system przelicza prognozę.

### Zdarzenie Losowe (Problem Techniczny)
1. Operator dodaje [tag](./operator-tags.md): "problem techniczny — pauza 5 min".
2. Delta kumulatywna skacze.
3. System generuje agresywniejsze scenariusze odzysku.

## Reguły

- Prognoza jest przeliczana po każdym zdarzeniu: start/end/skip segmentu, zmiana wariantu.
- Curfew jest twardym limitem — system nie pozwala go zmienić po starcie show (tylko w setup).
- Scenariusze odzysku dotyczą tylko segmentów w statusie `planned` (nie `active` ani `completed`).
- Operator może zaaplikować scenariusz jednym tapem ("Zastosuj") — co zmienia warianty wybranych segmentów.
- Historia zastosowanych scenariuszy jest logowana (post-show analytics).

## Linki

- Powiązane: [dynamic-setlist.md](./dynamic-setlist.md), [operator-panel.md](./operator-panel.md)
