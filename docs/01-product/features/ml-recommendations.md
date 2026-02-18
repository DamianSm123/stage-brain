# ML Recommendations (Rekomendacje ML)

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Deweloper / AI

---

## Cel i Wartość

System rekomenduje następny segment do zagrania na podstawie aktualnej energii publiczności, trendu, pozycji w show i danych historycznych. Showcaller dostaje ranking top 3-5 segmentów z uzasadnieniem — zamiast podejmować decyzję wyłącznie na intuicji.

> **Decyzja zawsze należy do showcallera.** System nie zmienia setlisty samodzielnie.

## Zakres (Scope)

### In
- Ranking top 3-5 rekomendowanych następnych segmentów.
- [LightGBM](../../00-start-here/glossary.md#lightgbm) model (ML) jako główny mechanizm rankingu.
- [Fallback regułowy](../../00-start-here/glossary.md#fallback-regułowy) gdy ML confidence < threshold.
- Log rekomendacji (co system zaproponował) i decyzji operatora (co wybrał).
- Visual cue na panelu przy spadku energii (alert + rekomendacje).

### Out
- Automatyczne wykonanie rekomendacji (system NIE zmienia kolejności sam).
- Generowanie nowych segmentów (system operuje na istniejącej setliście).
- Rekomendacje uwzględniające elementy techniczne (światło, pirotechnika).

## Model ML — LightGBM

### Features per segment (kandydat)

| Feature | Opis |
|:---|:---|
| `current_engagement` | Aktualny engagement score (0-1) |
| `engagement_trend` | Trend z ostatnich 3 okien (rosnący/malejący/stabilny) |
| `show_progress` | Pozycja w setliście (% show za nami) |
| `historical_effectiveness` | Średnia zmiana engagement po zagraniu tego segmentu (dane historyczne) |
| `variant` | Wariant: full vs short |
| `duration` | Czas trwania segmentu (sekundy) |
| `bpm` | Tempo |
| `genre` | Gatunek |
| `contrast_vs_previous` | Kontrast energetyczny vs poprzedni segment (szybki po wolnym = potencjał) |

### Target

**Skuteczność** = zmiana engagement score po zagraniu segmentu.
- Pozytywna = engagement wzrósł → segment "zadziałał".
- Negatywna = engagement spadł → segment "nie trafił".

### Strategia Treningu

1. **Start (Faza 4)**: Trening na danych syntetycznych + reguły eksperckie od TINAP.
   - Dane syntetyczne: symulowane przebiegi koncertów z różnymi kolejnościami segmentów.
   - Reguły TINAP: "po dwóch wolnych zawsze coś energetycznego", "finale musi być najgłośniejsze".
2. **Po pilocie**: Fine-tune na realnych danych z koncertów (engagement score + decyzje operatora).
3. **Długoterminowo**: Własny zbiór danych klienta jako przewaga konkurencyjna.

## Fallback Regułowy

Uruchamiany gdy:
- Model ML ma confidence < threshold (konfigurowalny).
- Brak wytrenowanego modelu (np. pierwszych kilka koncertów).
- Błąd inferencji ML.

Scoring regułowy:

```
score = energy_match × 0.4 + contrast_bonus × 0.3 + position_fit × 0.3

energy_match:     jak dobrze segment pasuje do aktualnego poziomu energii
contrast_bonus:   bonus za kontrast (szybki po wolnym, wolny po szybkim)
position_fit:     czy segment pasuje do pozycji w show (finale = wysoka energia)
```

## Prezentacja Rekomendacji (UI)

```
📊 Rekomendacje (energia: spadek ↓)

1. 🎵 "Song X" (full)  — 92% dopasowanie
   Uzasadnienie: Wysoka skuteczność przy podobnych reakcjach. Kontrast +.

2. 🎵 "Song Y" (short) — 78% dopasowanie
   Uzasadnienie: Energetyczny, krótki. Oszczędza 1:30 czasu.

3. 🎵 "Song Z" (full)  — 65% dopasowanie
   Uzasadnienie: Ballada — ryzyko dalszego spadku, ale historycznie buduje napięcie.

[Accept] [Reject] [Ignore]
```

## Scenariusze

### Happy Path
1. Segment się kończy. System oblicza engagement i trend.
2. LightGBM generuje ranking top 5 segmentów z `planned`.
3. Panel pokazuje top 3-5 z uzasadnieniem i % dopasowania.
4. Showcaller wybiera segment → operator tapuje "Accept" → segment startuje.
5. Log: rekomendacja + decyzja.

### Spadek Energii
1. Engagement trend = "malejący" przez 3+ okna.
2. System proaktywnie wyświetla rekomendacje z flagą "Energia spada".
3. Rekomendacje faworyzują segmenty o wysokiej historycznej skuteczności.

### Showcaller Ignoruje Rekomendację
1. Showcaller wybiera inny segment niż rekomendowany.
2. Operator startuje wybrany segment.
3. System loguje: "rekomendacja odrzucona" + co wybrano zamiast tego.
4. Dane służą do poprawy modelu (feedback loop).

## Reguły

- Rekomendacje dotyczą tylko segmentów w statusie `planned`.
- System rankuje **wszystkie** dostępne segmenty, pokazuje top 3-5.
- Każda rekomendacja jest logowana (timestamp, show_id, segment_id, rank, confidence, czy zaakceptowana).
- Fallback regułowy jest zawsze dostępny jako safety net.
- Model ML jest retrainowany offline po zebraniu danych z kolejnych koncertów (nie w trakcie show).

## Linki

- Powiązane: [engagement-scoring.md](./engagement-scoring.md), [dynamic-setlist.md](./dynamic-setlist.md)
- Architektura: `02-architecture/adr/0010-stagebrain-tech-stack.md` (sekcja 2.6)
