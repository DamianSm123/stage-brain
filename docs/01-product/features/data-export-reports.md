# Data Export & Reports (Eksport Danych i Raporty)

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Deweloper / AI

---

## Cel i Wartość

Możliwość wyciągnięcia danych z systemu (do dalszej analizy, archiwizacji, prezentacji klientowi) oraz automatyczne generowanie podsumowań po wydarzeniu. Raporty pozwalają TINAP prezentować wartość systemu artystom i producentom.

## Zakres (Scope)

### In
- Eksport surowych danych (metryki engagement, timeline, tagi, rekomendacje) do CSV i JSON.
- Automatyczny raport podsumowujący (PDF) po każdym show.
- Raport zawiera: podsumowanie metryk, engagement timeline (wykres), tabelę segmentów, log decyzji.
- Generowanie raportów jako background job (Celery/arq worker).

### Out
- Customizacja layoutu raportu (na MVP jeden szablon).
- Eksport do zewnętrznych narzędzi (Google Sheets, Notion, etc.) — post-MVP.
- Automatyczne wysyłanie raportu emailem — post-MVP.

## Eksport Danych

### Formaty

| Format | Zawartość | Zastosowanie |
|:---|:---|:---|
| **CSV** | Metryki engagement (timestamp, score, trend, event_type) | Analiza w Excel/Google Sheets |
| **CSV** | Tabela segmentów (pozycja, nazwa, czasy, wariant, engagement avg) | Porównanie segmentów |
| **JSON** | Pełne dane show (metryki, timeline, tagi, rekomendacje, kalibracja) | Archiwizacja, integracje |

### Endpointy

- `GET /api/v1/shows/{id}/export/metrics?format=csv` — metryki engagement
- `GET /api/v1/shows/{id}/export/segments?format=csv` — tabela segmentów
- `GET /api/v1/shows/{id}/export/full?format=json` — pełne dane show

## Automatyczny Raport PDF

### Zawartość raportu

1. **Nagłówek**: Nazwa show, venue, data, czas start/end.
2. **Podsumowanie metryczne**: Engagement średni/max/min, czas planowany vs faktyczny, curfew delta, liczba segmentów/skipów.
3. **Engagement Timeline**: Wykres liniowy (renderowany server-side).
4. **Tabela segmentów**: Wszystkie segmenty z kluczowymi metrykami.
5. **Log tagów**: Tagi operatora z timestampami.
6. **Log rekomendacji**: Kluczowe rekomendacje i decyzje operatora.

### Generowanie

- Automatycznie po zakończeniu show (background job).
- Dostępny do pobrania z panelu post-show.
- Możliwość ręcznego ponownego wygenerowania (button "Regenerate Report").
- Technologia: `weasyprint` (HTML → PDF) lub `reportlab`.

## Scenariusze

### Automatyczny Raport
1. Operator tapuje "End Show".
2. System kolejkuje job generowania raportu (Celery/arq).
3. Worker generuje PDF (10-30 sekund).
4. Raport dostępny w panelu post-show (button "Download Report").

### Eksport CSV
1. Operator w panelu post-show tapuje "Export Metrics CSV".
2. System generuje CSV i zwraca plik do pobrania.
3. Operator otwiera w Excel/Google Sheets do dalszej analizy.

### Eksport JSON (Archiwizacja)
1. Operator tapuje "Export Full Data (JSON)".
2. System zwraca pełny dump danych show.
3. Dane mogą być zaimportowane do zewnętrznych narzędzi lub zarchiwizowane.

## Reguły

- Raporty i eksporty są generowane z danych post-show (read-only, nie modyfikują danych).
- Raport PDF jest generowany asynchronicznie (nie blokuje UI).
- Każdy wygenerowany raport jest zapisywany w bazie (tabela `reports`) z linkiem do pliku.
- Eksport CSV/JSON jest synchroniczny (generowany on-the-fly).
- Dane eksportu zawierają pełne metadane (show_id, venue, data, kalibracja) — self-contained.

## Linki

- Powiązane: [post-show-analytics.md](./post-show-analytics.md)
