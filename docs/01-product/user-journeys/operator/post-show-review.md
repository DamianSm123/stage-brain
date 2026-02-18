# Post-show Review (Operator)

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Deweloper / AI

---

## Cel

Operator/showcaller przegląda dane po koncercie: analizuje engagement timeline, porównuje planowany vs faktyczny przebieg, przegląda log decyzji, eksportuje dane i generuje raporty. Dane służą do nauki (co zadziałało, co nie), prezentacji klientowi i iteracji modelu ML.

## Aktorzy

- [Operator](../../personas.md#2-operator)
- [Showcaller / Reżyser / Producent](../../personas.md#1-showcaller--reżyser--producent)
- [TINAP](../../personas.md#3-tinap-design-partner) — przegląd i walidacja

## Warunki Wstępne

- Show zakończony (operator tapnął "End Show").
- Dane metryczne, timeline i logi zapisane w bazie.

## Kroki

### 1. Automatyczne Przejście
1. Operator tapuje "End Show" (lub ostatni segment → `completed`).
2. Panel przechodzi do trybu post-show.
3. System kolejkuje generowanie raportu PDF (background job, 10-30 sek).

### 2. Przegląd Dashboard
1. Operator widzi podsumowanie kluczowych metryk:
   - Czas show: planowany vs faktyczny.
   - Curfew: zmieściliśmy się? Delta.
   - Engagement: średni / max / min.
   - Segmenty: zagrane / pominięte / short.
   - Rekomendacje: zaakceptowane / odrzucone.

### 3. Analiza Engagement Timeline
1. Interaktywny wykres liniowy: czas vs engagement score.
2. Markery segmentów (pionowe linie) i tagów (ikony).
3. Operator identyfikuje:
   - Momenty szczytu → "co zagraliśmy w tym momencie?"
   - Momenty spadku → "co się stało? tag: tech_issue"
   - Korelacje: "Song X zawsze podnosi energię, Song Y ją obniża".

### 4. Przegląd Tabeli Segmentów
1. Tabela z metrykami per segment.
2. Sortowanie po engagement avg → "które segmenty działały najlepiej?"
3. Porównanie czasu planowanego vs faktycznego per segment.

### 5. Przegląd Logu Decyzji
1. Chronologiczna lista zdarzeń: start/end/skip segmentów, rekomendacje, tagi, scenariusze odzysku.
2. Analiza: "Czy rekomendacje systemu się sprawdziły?"
3. Dane do feedback loop dla modelu ML.

### 6. Eksport i Raport
1. Operator pobiera raport PDF (automatycznie wygenerowany).
2. Opcjonalnie: eksport CSV (metryki, tabela segmentów) do dalszej analizy.
3. Opcjonalnie: eksport JSON (pełne dane) do archiwizacji.

## Scenariusze

### Showcaller Analizuje Show
1. Bezpośrednio po koncercie (backstage, nadal na tablecie).
2. Szybki przegląd dashboard → "zmieściliśmy się w curfew? ✅"
3. Engagement timeline → "ok, spadek był w segmencie 5, to ten problem z gitarą".
4. Zamyka panel, wraca do niego następnego dnia z laptopa.

### TINAP Waliduje System
1. TINAP otwiera post-show kilku koncertów.
2. Porównuje engagement score z własną subiektywną oceną.
3. Feedback: "engagement dobrze koreluje z oklaskami, ale nie wykrywa skandowania".
4. Dane do iteracji formuły engagement score i kalibracji YAMNet.

### Raport dla Producenta/Artysty
1. Operator pobiera PDF raport.
2. Wysyła do producenta/artysty jako podsumowanie show.
3. Raport zawiera: timeline, metryki, kluczowe momenty.

## Kryteria Akceptacji

- Post-show jest dostępny natychmiast po zakończeniu show (dane z TimescaleDB continuous aggregates).
- Raport PDF jest gotowy w < 60 sekund od zakończenia show.
- Engagement timeline jest interaktywny (hover/tap na markerach → tooltip).
- Eksport CSV/JSON jest natychmiastowy (generowany on-the-fly).
- Post-show jest read-only — żadne dane nie mogą być edytowane.
- Dostęp do post-show z dowolnego show z historii (lista show z filtrowaniem).

## Linki

- Poprzedni krok: [Live Show](./live-show.md)
- Features: [post-show-analytics.md](../../features/post-show-analytics.md), [data-export-reports.md](../../features/data-export-reports.md)
