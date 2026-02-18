# ADR-0005: ML Ranking — LightGBM z Fallbackiem Regułowym

**Status**: Accepted
**Data**: 2026-02-18
**Autorzy**: Zespół architektury (sesja architektoniczna)

---

## Kontekst

StageBrain rekomenduje showcallerowi następny segment/utwór do zagrania. Rekomendacja musi uwzględniać:

- Aktualny poziom engagement publiczności (i trend).
- Pozycję w setliście (ile show za nami).
- Charakterystykę segmentów (BPM, gatunek, czas trwania, wariant full/short).
- Historyczną skuteczność (jak segment wpływał na engagement w przeszłych koncertach).
- Kontrast z poprzednim segmentem (szybki po wolnym = potencjał energetyczny).

**Problem**: Na start nie mamy danych historycznych z koncertów. Model ML wymaga danych treningowych.

## Rozważane Alternatywy

### 1. Tylko reguły (if/else scoring)

- Prosty scoring: `score = energia_segmentu × dopasowanie_do_poziomu + bonus_kontrast`.
- **Zaleta**: Działa od dnia 1, zero danych treningowych.
- **Problem**: Nie uczy się z doświadczenia. Nie wychwytuje złożonych zależności (np. "po 3 energetycznych segmentach z rzędu publiczność potrzebuje pauzy").

### 2. Deep Learning (Transformer / RNN)

- Model sekwencyjny uwzględniający historię całego show.
- **Problem**: Overkill przy małym zbiorze danych (0 koncertów na start). Wolna inferencja. Trudny w debugowaniu i wyjaśnianiu rekomendacji.

### 3. Collaborative Filtering

- "Użytkownicy którzy grali X potem grali Y z sukcesem."
- **Problem**: Wymaga danych z wielu koncertów wielu artystów. Na start: zero.

### 4. LightGBM z fallbackiem regułowym (wybrana)

- Gradient boosted trees na danych tabelarycznych.
- Start na danych syntetycznych + reguły eksperckie od TINAP.
- Fallback na ranking regułowy gdy model ma niski confidence.

## Decyzja

Wybieramy **LightGBM** jako model ML do rankingu segmentów, z **fallbackiem na ranking regułowy**.

### Features per kandydujący segment

| Feature | Typ | Opis |
|:---|:---|:---|
| `current_engagement` | float | Aktualny engagement score (0-1) |
| `engagement_trend` | categorical | Trend ostatnich 3 okien: rising/falling/stable |
| `show_progress` | float | % show za nami (0-1) |
| `segment_energy` | float | Oczekiwana energia segmentu (metadata) |
| `segment_bpm` | int | Tempo segmentu |
| `segment_duration` | int | Czas trwania (sekundy) |
| `segment_variant` | categorical | full / short |
| `contrast_vs_previous` | float | Różnica energii vs poprzedni segment |
| `historical_effectiveness` | float | Średnia zmiana engagement po zagraniu (z danych, 0 na start) |
| `times_played` | int | Ile razy segment był grany w przeszłych koncertach |

### Target

`engagement_delta` = zmiana engagement score po zagraniu segmentu (mierzona jako średni engagement w trakcie vs średni engagement przed).

### Strategia treningowa

1. **Faza 0 (start)**: Dane syntetyczne + reguły eksperckie od TINAP. Model uczy się heurystyk: "gdy energia spada, graj energetyczny utwór", "po 3 szybkich daj wolny".
2. **Faza 6+ (po pilotach)**: Fine-tune na realnych danych z koncertów. Każdy koncert = nowe dane treningowe.
3. **Ciągłe uczenie**: Model re-trenowany po każdym koncercie (offline, nie online learning).

### Fallback regułowy

Gdy LightGBM confidence < threshold (np. 0.3) LUB model nie jest jeszcze wytrenowany:

```python
def rule_based_score(segment, current_engagement, show_progress):
    energy_match = 1 - abs(segment.energy - current_engagement)
    contrast_bonus = abs(segment.energy - previous_segment.energy) * 0.3
    fatigue_penalty = -0.2 if show_progress > 0.7 and segment.energy > 0.8 else 0
    return energy_match + contrast_bonus + fatigue_penalty
```

### Wyjaśnialność (explainability)

Każda rekomendacja zawiera `reason` — krótkie wyjaśnienie dlaczego ten segment:
- "Energia spada — rekomenduję energetyczny utwór"
- "Wysoki kontrast vs poprzedni segment"
- "Historycznie skuteczny przy podobnym engagement"

Generowane na podstawie feature importance z LightGBM (SHAP values lub prostsza heurystyka).

## Uzasadnienie

1. **LightGBM na danych tabelarycznych**: State-of-the-art dla structured data. Szybki trening (~sekundy), szybka inferencja (~1ms).
2. **Fallback gwarantuje działanie**: System rekomenduje od dnia 1 (reguły), ML poprawia jakość z czasem.
3. **Explainability**: Showcaller musi rozumieć DLACZEGO system coś rekomenduje. Drzewa decyzyjne są interpretowalne.
4. **Małe wymagania danych**: LightGBM daje sensowne wyniki na małych zbiorach (w porównaniu z deep learning).
5. **Szybka iteracja**: Re-trening modelu trwa sekundy. Można testować nowe features bez znaczącego kosztu.

## Konsekwencje

- (+) Rekomendacje dostępne od dnia 1 (fallback regułowy).
- (+) Model poprawia się z każdym koncertem.
- (+) Inferencja <1ms — nie wpływa na latencję systemu.
- (+) Showcaller rozumie rekomendacje (reason).
- (-) Na start rekomendacje są heurystyczne (reguły) — mogą nie być "inteligentne".
- (-) Wymaga pipeline'u generowania danych syntetycznych w Fazie 4.
- (-) Feature `historical_effectiveness` = 0 na start → model nie wykorzystuje historii.

## Rewizja

Ta decyzja powinna zostać zrewidowana, jeśli:
- Po 20+ koncertach model LightGBM nie poprawia się vs reguły → rozważyć inny approach.
- Showcaller ignoruje rekomendacje (>80% ignore rate) → problem może być w features, nie w modelu.
- Pojawia się potrzeba modelowania sekwencji (nie pojedynczych segmentów) → rozważyć RNN/Transformer.
