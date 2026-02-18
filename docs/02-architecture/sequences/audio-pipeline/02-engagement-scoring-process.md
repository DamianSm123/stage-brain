# Engagement Scoring — Przepływ

**Status**: Active
**Ostatni przegląd**: 2026-02-18

---

## Opis

Proces przetwarzania audio z ring buffer, obliczania engagement score, zapisu do bazy i broadcast do panelu operatora. Wykonywany co 5-10 sekund (przy każdym nowym oknie audio).

## Diagram

```mermaid
sequenceDiagram
    participant BUF as Ring Buffer
    participant LIB as librosa (Feature Extraction)
    participant YAM as YAMNet (Event Classification)
    participant ENG as Engagement Module
    participant CAL as Calibration
    participant DB as TimescaleDB
    participant R as Redis (Pub/Sub)
    participant WS as WebSocket Handler
    participant P as Operator Panel

    Note over BUF,P: Trigger: nowe okno audio (co 5-10s)

    BUF->>LIB: Audio PCM (okno 5-10s)
    BUF->>YAM: Audio PCM (to samo okno)

    par Przetwarzanie równoległe
        LIB->>LIB: RMS Energy
        LIB->>LIB: Spectral Centroid
        LIB->>LIB: Zero-Crossing Rate
        LIB->>LIB: Spectral Rolloff
    and
        YAM->>YAM: Inferencja TFLite/ONNX
        YAM->>YAM: Top-K klas: Applause(0.7), Cheering(0.2), Silence(0.05)...
    end

    LIB->>ENG: Features: {rms: 0.62, centroid: 0.71, zcr: 0.35, rolloff: 0.68}
    YAM->>ENG: Classification: {event: "applause", confidence: 0.70}

    ENG->>CAL: Pobierz parametry kalibracji venue
    CAL-->>ENG: {energy_baseline: 0.3, sensitivity: 1.0, noise_floor: 0.1}

    ENG->>ENG: Normalizacja (rms - noise_floor) / (1 - noise_floor) × sensitivity
    ENG->>ENG: Agregacja: score = weighted_sum(rms_norm, centroid, event_weight)
    ENG->>ENG: Trend: porównanie z ostatnimi 3 oknami → rising/falling/stable

    par Zapis i broadcast
        ENG->>DB: INSERT INTO engagement_metrics (score, features, event, trend...)
    and
        ENG->>R: PUBLISH show:{show_id} {score: 0.73, trend: "rising", event: "applause"}
    end

    R->>WS: Subscriber receives engagement update
    WS->>P: WebSocket JSON: {type: "engagement_update", data: {...}}
    P->>P: Aktualizuj engagement gauge, trend, label
```

## Szczegóły techniczne

### Czas przetwarzania (budżet latencji)

| Etap | Czas |
|:---|:---|
| librosa features | ~50-100 ms |
| YAMNet inference (TFLite) | ~100-200 ms |
| Agregacja + normalizacja | ~1 ms |
| Zapis do DB | ~5-10 ms |
| Redis publish | ~0.1 ms |
| WebSocket broadcast | ~1 ms |
| **Łącznie** | **~160-320 ms** |

Budżet: 5000-10000 ms (interwał okna). Zużywamy ~3-6% budżetu. Komfortowy zapas.

### Przetwarzanie równoległe

librosa i YAMNet procesowane w `ProcessPoolExecutor` (osobne procesy — omijają GIL). Ring buffer obsługuje concurrent read.

### Trend calculation

```python
def calculate_trend(current_score, last_3_scores):
    if len(last_3_scores) < 2:
        return "stable"
    avg_recent = mean(last_3_scores)
    if current_score > avg_recent + 0.05:
        return "rising"
    elif current_score < avg_recent - 0.05:
        return "falling"
    return "stable"
```

### Fallback (brak YAMNet)

Jeśli YAMNet inference zawodzi (timeout, error):
- Engagement score obliczany tylko z librosa features.
- `event_type` = `null`, `event_confidence` = 0.
- Log warning do Sentry.
- System działa dalej — score jest mniej precyzyjny, ale dostępny.
