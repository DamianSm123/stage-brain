# ADR-0002: Dwuwarstwowy Audio Pipeline (librosa + YAMNet)

**Status**: Accepted
**Data**: 2026-02-18
**Autorzy**: Zespół architektury (sesja architektoniczna)

---

## Kontekst

StageBrain musi analizować audio publiczności w czasie rzeczywistym i produkować metrykę zaangażowania (engagement score). System musi rozróżniać:

- Oklaski, krzyki, skandowanie (wysoki engagement).
- Ciszę, mruczenie, rozmowy (niski engagement).
- Śpiew publiczności wraz z artystą (engagement kontekstowy).

Analiza musi działać w oknach 5-10 sekund z wynikiem co ~5s. Źródło audio: mikrofon na venue (ambient/audience mic/FOH feed) — jakość nieprzewidywalna.

## Rozważane Alternatywy

### 1. Tylko librosa (metryki sygnałowe)

- RMS Energy, Spectral Centroid, ZCR — proste, szybkie, deterministyczne.
- **Problem**: Nie rozróżnia typów reakcji. Hałas maszynowy i oklaski mogą mieć podobną RMS energy.

### 2. Tylko YAMNet (klasyfikacja)

- Pre-trenowany na AudioSet (521 klas). Rozróżnia typy dźwięków.
- **Problem**: Brak granularnych metryk ciągłych (YAMNet daje klasy, nie wartości 0-1 na płynnej skali). Cięższy obliczeniowo.

### 3. Custom model trenowany od zera

- Dedykowany model do klasyfikacji crowd engagement.
- **Problem**: Brak danych treningowych. Potrzeba setek godzin oznaczonych nagrań z koncertów. Czas: miesiące, nie tygodnie.

### 4. Hybrid: librosa + YAMNet (wybrana)

- Warstwa 1 (librosa): szybkie metryki ciągłe (głośność, jasność, szum).
- Warstwa 2 (YAMNet): klasyfikacja typu zdarzenia (oklaski, krzyk, cisza).
- Agregacja obu warstw w jedną metrykę engagement score.

## Decyzja

Wybieramy **dwuwarstwowy pipeline: librosa (metryki sygnałowe) + YAMNet (klasyfikacja zdarzeń)**.

### Warstwa 1 — librosa (metryki sygnałowe)

| Metryka | Co mierzy | Rola w engagement score |
|:---|:---|:---|
| **RMS Energy** | Głośność w oknie czasowym | Bazowy wskaźnik energii tłumu |
| **Spectral Centroid** | "Jasność" dźwięku | Wysoka = krzyk/oklaski, niska = mruczenie |
| **Zero-Crossing Rate** | Szum vs ton | Rozróżnia oklaski (szum) od skandowania (ton) |
| **Spectral Rolloff** | Rozkład energii w widmie | Dodatkowy deskryptor charakteru dźwięku |

### Warstwa 2 — YAMNet (klasyfikacja zdarzeń)

- Model: YAMNet (Google, pre-trenowany na AudioSet, 521 klas).
- Runtime: TensorFlow Lite lub ONNX Runtime (szybsza inferencja, mniejszy footprint).
- Relevantne klasy: `Applause`, `Cheering`, `Crowd`, `Chanting`, `Singing`, `Silence`, `Music`.
- Wynik: rozkład prawdopodobieństw → typ reakcji publiczności + confidence.

### Agregacja — Engagement Score

```
engagement_score = f(
    rms_energy_normalized,       # 0-1, znormalizowany do kalibracji venue
    spectral_brightness,         # 0-1
    crowd_event_type,            # z YAMNet (oklaski=wysoko, cisza=nisko)
    crowd_event_confidence,      # pewność klasyfikacji
    trend_last_3_windows,        # rosnący/malejący/stabilny
    venue_calibration_offset     # korekta per venue
)
```

Na start: prosta ważona suma. Iteracja formuły po danych z testów w Fazie 2.

## Uzasadnienie

1. **Komplementarność**: librosa daje ciągłe wartości liczbowe (trend, intensywność), YAMNet daje semantykę (co to za dźwięk).
2. **Fallback**: Jeśli YAMNet zawodzi (niska pewność) → system opiera się na samych metrykach librosa. Engagement score dalej działa, tylko bez klasyfikacji typu.
3. **Szybkość**: librosa na oknie 10s: <100ms. YAMNet (TFLite): <200ms. Łącznie <500ms na okno — komfortowo w budżecie 5-10s.
4. **Kalibracja**: Metryki librosa łatwo normalizować per venue (baseline energy). YAMNet klasy są niezależne od głośności.
5. **Iteracyjność**: Ważona suma jest trywialna do zmiany. Wagi, prógi, mapowanie klas — wszystko konfigurowalne bez zmiany kodu.

## Konsekwencje

- (+) Engagement score dostępny od Fazy 2 (tydzień 3-4).
- (+) Fallback na samą warstwę librosa gdy YAMNet zawodzi.
- (+) Obie warstwy działają niezależnie — można wyłączyć jedną bez wpływu na drugą.
- (-) YAMNet nie był trenowany specyficznie na dane koncertowe — może wymagać fine-tuningu.
- (-) Formuła agregacji wymaga kalibracji na realnych danych z koncertów (na start: heurystyka).
- (-) Dodatkowa zależność: TFLite/ONNX Runtime w obrazie Dockerowym (~100-200 MB).

## Metryka sukcesu

Engagement score powinien **korelować z subiektywną oceną showcallera** — jeśli TINAP mówi "publiczność szaleje", score powinien być wysoki. Walidacja w Fazie 6 (pilot).

## Rewizja

Ta decyzja powinna zostać zrewidowana, jeśli:
- Jakość audio na venue jest tak niska, że YAMNet nie daje sensownych wyników → rozważyć tylko librosa.
- Pojawią się dane treningowe z 10+ koncertów → rozważyć fine-tuning YAMNet lub custom model.
- Formuła ważonej sumy okaże się niewystarczająca → rozważyć model ML do agregacji (meta-learner).
