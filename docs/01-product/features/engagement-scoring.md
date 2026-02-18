# Engagement Scoring

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Deweloper / AI

---

## Cel i Wartość

Zagregowana, znormalizowana metryka zaangażowania publiczności — jeden liczba (0-1), którą showcaller może przeczytać w ułamku sekundy i podjąć decyzję. Bez engagement score system nie może rekomendować kolejnych segmentów ani wykrywać spadków energii.

## Zakres (Scope)

### In
- Agregacja metryk z [audio pipeline](./audio-analysis.md) do jednego wskaźnika (0-1).
- Normalizacja z uwzględnieniem [kalibracji per venue](./venue-calibration.md).
- Wykrywanie trendu (rosnący / malejący / stabilny) na podstawie ostatnich 3 okien.
- Wykrywanie anomalii (nagły spadek/skok energii).
- Zapis metryk co ~5 sekund do TimescaleDB (hypertable).
- Real-time broadcast do panelu operatora.

### Out
- Analiza wideo (post-MVP).
- Analiza emocji jednostek.
- Automatyczne działania na podstawie score (system tylko rekomenduje).

## Formuła Engagement Score (v1)

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

Na start: **prosta ważona suma**. Wagi iterowane na danych z testów i feedback od TINAP.

> **Zasada**: Formuła będzie ewoluować. Dokumentujemy tu **intencję** (co mierzymy i po co), nie dokładne wagi — te żyją w kodzie.

## Mapowanie Klasyfikacji YAMNet na Energię

| Klasa YAMNet | Poziom energii | Waga w score |
|:---|:---|:---|
| Applause, Cheering | Wysoki | Wysoka |
| Chanting, Singing | Średni-Wysoki | Średnia |
| Crowd (ogólny szum) | Średni | Bazowa |
| Music (dominuje muzyka) | Nieokreślony | Niska (sygnał zaszumiony) |
| Silence | Niski | Niska / ujemna korekta |

## Scenariusze

### Happy Path
1. Audio pipeline produkuje metryki co ~5s.
2. Engagement score jest obliczany i normalizowany z kalibracją venue.
3. Score + trend + klasyfikacja publikowane przez Redis pub/sub.
4. Panel operatora wyświetla gauge z aktualnym score, trend arrow i etykietę klasyfikacji.

### Spadek Energii
1. Score spada poniżej threshold przez 3+ kolejne okna.
2. System oznacza trend jako "malejący" i generuje alert na panelu.
3. System uruchamia ranking rekomendacji (patrz [ml-recommendations.md](./ml-recommendations.md)).
4. Showcaller widzi: "Energia spada — rekomendowane: [segment X] (wysoka skuteczność przy podobnych reakcjach)".

### Brak Danych Audio
1. WebSocket audio disconnected lub brak chunków > 30s.
2. Panel pokazuje ostatni znany score z badge "STALE DATA".
3. Rekomendacje przechodzą na [fallback regułowy](../../00-start-here/glossary.md#fallback-regułowy).

## Reguły

- Score jest **zawsze** w zakresie 0.0–1.0.
- Trend jest obliczany na ostatnich 3 oknach (15-30s historii).
- Anomalia = zmiana score > 0.3 w jednym oknie (próg konfigurowalny).
- Metryki zapisywane do TimescaleDB z timestampem, `show_id`, `segment_id` (jeśli aktywny).
- Continuous aggregates TimescaleDB pre-obliczają średnie per segment i per minuta — dla post-show analytics.

## Linki

- Powiązane: [audio-analysis.md](./audio-analysis.md), [venue-calibration.md](./venue-calibration.md), [ml-recommendations.md](./ml-recommendations.md)
