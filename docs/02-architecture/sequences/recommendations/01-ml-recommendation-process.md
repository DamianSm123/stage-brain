# ML Recommendation — Przepływ

**Status**: Active
**Ostatni przegląd**: 2026-02-18

---

## Opis

Generowanie rekomendacji następnego segmentu do zagrania. System oblicza ranking top 3-5 segmentów przy każdej zmianie engagement score, z użyciem modelu LightGBM lub fallbacku regułowego. Operator akceptuje, odrzuca lub ignoruje rekomendację.

## Diagram

```mermaid
sequenceDiagram
    participant ENG as Engagement Module
    participant FE as Feature Engineering
    participant ML as LightGBM Model
    participant FB as Fallback (Rule-based)
    participant DB as PostgreSQL
    participant R as Redis
    participant WS as WebSocket Handler
    participant O as Operator (Panel)

    Note over ENG,O: Trigger: nowy engagement score (co 5-10s)

    ENG->>FE: Engagement update: {score: 0.45, trend: "falling"}

    FE->>DB: Query: remaining segments (planned, z metadanymi)
    DB-->>FE: Segments: [{name, bpm, genre, energy, variants, history}, ...]

    FE->>FE: Build feature vector per candidate segment:
    Note right of FE: current_engagement: 0.45<br/>trend: "falling"<br/>show_progress: 0.6<br/>segment_energy: 0.8<br/>contrast: 0.35<br/>bpm: 140<br/>historical_effectiveness: 0.12

    FE->>ML: Predict engagement_delta per segment

    alt Model confidence >= threshold (0.3)
        ML-->>FE: Predictions: [{seg_id, predicted_delta, confidence}, ...]
        FE->>FE: Sort by predicted_delta DESC → top 5
        FE->>FE: Generate reasons (SHAP / heuristic)
    else Model confidence < threshold OR model unavailable
        ML-->>FE: Low confidence / error
        FE->>FB: Fallback: rule-based scoring
        FB->>FB: score = energy_match + contrast_bonus + fatigue_penalty
        FB-->>FE: Scores: [{seg_id, score}, ...]
        FE->>FE: Sort by score DESC → top 5
        FE->>FE: Generate reasons (rule-based explanations)
    end

    FE->>DB: INSERT recommendations_log (segments, reasons, model/fallback, confidence)
    FE->>R: PUBLISH {type: "recommendation_update", recommendations: [...]}
    R->>WS: Subscriber receives
    WS->>O: WebSocket JSON: recommendation_update

    Note over O: Operator widzi top 3-5 rekomendacji z reasons

    alt Operator akceptuje rekomendację
        O->>WS: {type: "recommendation_decision", id: "rec123", decision: "accept"}
        WS->>DB: UPDATE recommendations_log SET decision='accept', accepted_segment_id
        WS->>O: Confirmation
    else Operator odrzuca
        O->>WS: {type: "recommendation_decision", id: "rec123", decision: "reject"}
        WS->>DB: UPDATE recommendations_log SET decision='reject'
    else Operator ignoruje (nie reaguje)
        Note over O: Po następnym cyklu: nowe rekomendacje<br/>Stare: decision='ignore' (auto po N cyklach)
    end
```

## Szczegóły techniczne

### Feature Engineering — pełna lista

| Feature | Typ | Źródło | Opis |
|:---|:---|:---|:---|
| `current_engagement` | float | Engagement Module | Aktualny score (0-1) |
| `engagement_trend` | cat | Engagement Module | rising / falling / stable |
| `show_progress` | float | Time Tracking | % show za nami (0-1) |
| `segment_energy` | float | Segment metadata | Oczekiwana energia (0-1) |
| `segment_bpm` | int | Segment metadata | Tempo |
| `segment_genre` | cat | Segment metadata | Gatunek (encoded) |
| `segment_duration` | int | Segment variant | Czas trwania (sekundy) |
| `segment_variant` | cat | Current variant | full / short |
| `contrast_vs_previous` | float | Calculated | abs(segment.energy - previous.energy) |
| `historical_effectiveness` | float | DB (past shows) | Średnia engagement_delta po zagraniu |
| `times_played` | int | DB (past shows) | Ile razy segment był grany |
| `time_remaining_ratio` | float | Time Tracking | Remaining time / total planned |

### Reasons (wyjaśnienia)

Każda rekomendacja zawiera `reason` — krótki tekst wyjaśniający:

| Sytuacja | Example reason |
|:---|:---|
| Engagement spada, rekomendowany energetyczny | "Energia spada — wysoka energia segmentu (+0.35 kontrast)" |
| Wysoki kontrast | "Duży kontrast vs poprzedni segment (wolny → szybki)" |
| Historycznie skuteczny | "Historycznie podnosi engagement o +12% w podobnych warunkach" |
| Fallback regułowy | "Rekomendacja regułowa — dobra kompatybilność z aktualnym poziomem energii" |

### Cykl rekomendacji

- Nowe rekomendacje generowane **przy każdym engagement update** (co 5-10s).
- Ranking się zmienia dynamicznie — jeśli engagement rośnie, rekomendacje mogą się zmienić.
- Po akceptacji/odrzuceniu: zaakceptowany segment usunięty z listy kandydatów w następnym cyklu.
