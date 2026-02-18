# Post-show Analytics (Analityka Post-show)

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Deweloper / AI

---

## Cel i Wartość

Dedykowany widok do przeglądu danych po koncercie. Pozwala showcallerowi, producentowi i TINAP przeanalizować przebieg show: gdzie publiczność reagowała najlepiej, gdzie spadła energia, jakie decyzje podjął operator, jak system się sprawdził. Dane z post-show służą do iteracji produktu i trenowania modeli ML.

## Zakres (Scope)

### In
- Interaktywna timeline engagement (wykres liniowy z markerami segmentów i tagów).
- Tabela segmentów z metrykami (czas planowany vs faktyczny, engagement średni/max/min, wariant użyty).
- Log decyzji operatora (rekomendacje zaakceptowane/odrzucone, scenariusze odzysku zastosowane).
- Log tagów operatora na osi czasu.
- Porównanie planowanego vs faktycznego przebiegu.
- Podsumowanie kluczowych metryk show.

### Out
- Porównanie między koncertami (multi-show analytics) — post-MVP.
- Heatmapa venue (wymagałaby danych przestrzennych) — post-MVP.
- Automatyczne wnioski AI ("system sugeruje, że segment X zawsze obniża energię") — post-MVP.

## Widoki Post-show

### 1. Podsumowanie Show (Dashboard)

| Metryka | Opis |
|:---|:---|
| **Czas show** | Planowany vs faktyczny |
| **Curfew** | Czy zmieściliśmy się? Delta. |
| **Engagement średni** | Średni engagement score z całego show |
| **Engagement max / min** | Momenty szczytu i dołka |
| **Segmenty zagrane** | X / Y (ile z planowanych) |
| **Segmenty pominięte** | Lista skipów |
| **Warianty short** | Ile segmentów zagranych w wersji short |
| **Tagi operatora** | Liczba tagów z rozbiciem per typ |
| **Rekomendacje** | Ile zaakceptowanych / odrzuconych / zignorowanych |

### 2. Engagement Timeline

- Wykres liniowy: czas (oś X) vs engagement score (oś Y, 0-1).
- Markery na wykresie:
  - **Segmenty**: pionowe linie z etykietami (start/end segmentu).
  - **Tagi**: ikony/markery na osi czasu.
  - **Rekomendacje**: momenty gdy system wygenerował rekomendacje.
- Interaktywność: hover/tap na markerze → tooltip z detalami.
- Zoom/pan po osi czasu.

### 3. Tabela Segmentów

| Kolumna | Opis |
|:---|:---|
| # | Pozycja w setliście |
| Segment | Nazwa |
| Wariant | Full / Short |
| Czas planowany | Z setlisty |
| Czas faktyczny | Z timeline |
| Delta | Różnica |
| Engagement avg | Średni score w trakcie segmentu |
| Engagement max | Szczyt |
| Engagement trend | Trend dominujący (↑ ↓ →) |
| Status | Completed / Skipped |

Sortowalne po każdej kolumnie. Klikalne → przejście do wykresu w odpowiednim momencie.

### 4. Log Decyzji

Chronologiczna lista zdarzeń:
- `21:05:23` — Segment "Song A" started (full)
- `21:09:45` — Rekomendacja: Song B (89%) → **Accepted**
- `21:09:50` — Segment "Song A" ended
- `21:10:02` — Segment "Song B" started (full)
- `21:12:30` — Tag: `energy_peak`
- `21:15:00` — Rekomendacja: Song C (76%) → **Rejected** (operator wybrał Song D)
- `21:15:05` — Segment "Song D" started (short)
- `21:18:00` — Scenariusz odzysku A zastosowany

## Scenariusze

### Przegląd Po Koncercie
1. Show się kończy → panel automatycznie przechodzi do post-show (lub operator tapuje "End Show").
2. Dashboard pokazuje podsumowanie kluczowych metryk.
3. Operator/showcaller przegląda engagement timeline — identyfikuje momenty szczytu i spadku.
4. TINAP przegląda tabelę segmentów — sprawdza, które segmenty miały najwyższy engagement.
5. Eksport danych lub generowanie raportu (patrz [data-export-reports.md](./data-export-reports.md)).

## Reguły

- Dane post-show są dostępne natychmiast po zakończeniu show (agregaty z TimescaleDB continuous aggregates).
- Post-show jest read-only — żadne dane nie mogą być edytowane po zakończeniu show.
- Każdy show ma swój unikalny post-show view (lista show z filtrowaniem po dacie/venue).
- Dane przechowywane bezterminowo (bez polityki retencji na MVP — do ustalenia w Wariancie C).

## Linki

- Powiązane: [data-export-reports.md](./data-export-reports.md), [engagement-scoring.md](./engagement-scoring.md), [operator-tags.md](./operator-tags.md)
