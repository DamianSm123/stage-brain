# Dynamic Setlist (Zarządzanie Setlistą)

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Deweloper / AI

---

## Cel i Wartość

Zarządzanie setlistą koncertu — import, edycja, warianty segmentów, śledzenie przebiegu live. Setlista jest szkieletem całego show — bez niej system nie może prognozować czasu, rekomendować segmentów ani logować przebiegu.

## Zakres (Scope)

### In
- Import setlisty (CSV na start, rozszerzalny o inne formaty po warsztacie z TINAP).
- CRUD: tworzenie, edycja, usuwanie setlisty i [segmentów](../../00-start-here/glossary.md#segment).
- [Warianty](../../00-start-here/glossary.md#wariant-variant) segmentu: **full** i **short** z oddzielnym czasem trwania.
- Metadane segmentu: nazwa, czas full, czas short, BPM, gatunek, notatki.
- Kolejność segmentów (drag & drop w UI).
- Śledzenie przebiegu live: start/end/skip segmentu z timestampami.
- Powiązanie setlisty z show.

### Out
- Automatyczna zmiana kolejności segmentów (system rekomenduje, nie zmienia).
- Import z zewnętrznych narzędzi produkcyjnych (post-MVP).
- Elementy techniczne segmentu (timecode, światło, pirotechnika) — system ich nie zarządza.

## Model Danych

### Setlista
- `id`, `name`, `created_at`, `updated_at`
- Ma wiele segmentów (uporządkowanych).

### Segment
- `id`, `setlist_id`, `position` (kolejność)
- `name` — nazwa utworu/bloku
- `duration_full` — czas wariantu full (sekundy)
- `duration_short` — czas wariantu short (sekundy)
- `bpm` — tempo (opcjonalne)
- `genre` — gatunek (opcjonalny)
- `notes` — notatki dla operatora
- `status`: `planned` → `active` → `completed` | `skipped`

### Show Timeline
- `show_id`, `segment_id`
- `started_at`, `ended_at` — faktyczny czas
- `variant_used` — `full` / `short`
- `was_skipped` — boolean

## Import CSV

Format minimalny (do doprecyzowania z TINAP w Fazie 0):

```csv
name,duration_full,duration_short,bpm,genre
Intro,180,120,128,electronic
Song A,240,180,140,hip-hop
Song B,300,210,95,ballad
Encore,360,240,130,rock
```

- Kolumny `bpm` i `genre` opcjonalne.
- Czasy w sekundach.
- Encoding: UTF-8.

## Scenariusze

### Happy Path (Pre-show)
1. Operator tworzy nowy show i importuje setlistę z CSV.
2. System parsuje CSV i tworzy segmenty z wariantami.
3. Operator weryfikuje kolejność, czasy, warianty.
4. Operator może przesunąć segmenty (drag & drop), edytować czasy, dodać notatki.
5. Setlista gotowa do show.

### Zmiana Kolejności w Trakcie Show
1. Showcaller decyduje o zmianie kolejności (np. "dajmy energetyczny utwór teraz").
2. Operator przeskakuje do wybranego segmentu (skip current → start next).
3. System aktualizuje timeline i przelicza prognozę czasu.

### Skip Segmentu
1. Showcaller decyduje o pominięciu segmentu.
2. Operator oznacza segment jako `skipped`.
3. System odejmuje czas segmentu z prognozy i przelicza scenariusze.

## Reguły

- Setlista jest przypisana do jednego show (1:1 w MVP, możliwe reuse w przyszłości).
- Kolejność segmentów jest ważna — determinuje kolejność w panelu live.
- Zmiana statusu segmentu: `planned` → `active` → `completed` | `skipped`. Nie można cofnąć statusu.
- W danym momencie maksymalnie jeden segment może mieć status `active`.
- Czas planowany = suma `duration_full` (lub `duration_short` jeśli wybrany wariant short).
- Po rozpoczęciu show setlista jest "zamrożona" — strukturalnie nie można dodawać/usuwać segmentów. Można jedynie skip/reorder.

## Linki

- Powiązane: [time-control.md](./time-control.md), [ml-recommendations.md](./ml-recommendations.md)
