# Post-Show Analytics — Przepływ

**Status**: Active
**Ostatni przegląd**: 2026-02-18

---

## Opis

Analiza po zakończeniu koncertu: agregacja danych, generowanie raportu, eksport. Trigger: operator kończy show (status → `ended`).

## Diagram

```mermaid
sequenceDiagram
    participant O as Operator
    participant API as FastAPI Backend
    participant DB as PostgreSQL/TimescaleDB
    participant W as Background Worker
    participant S as Object Storage
    participant P as Panel (Post-show)

    Note over O,P: Trigger: Operator kończy koncert

    O->>API: POST /shows/{id}/end
    API->>DB: UPDATE show SET status='ended', actual_end=NOW()
    API->>API: Finalize: zamknij aktywny segment (jeśli jest), stop audio pipeline
    API-->>O: OK {status: "ended", duration: "01:32:15"}

    Note over O,P: Auto-generowanie raportu (async)

    API->>DB: INSERT reports (show_id, status: 'pending')
    API->>W: Enqueue task: generate_report(show_id)

    W->>DB: Query: engagement_metrics (full timeline)
    W->>DB: Query: engagement_per_minute (continuous aggregate)
    W->>DB: Query: show_timeline (all segments)
    W->>DB: Query: recommendations_log (decisions)
    W->>DB: Query: operator_tags
    DB-->>W: All data

    W->>W: Aggregate: per-segment stats (avg/peak/min engagement, duration, delta)
    W->>W: Aggregate: overall stats (total duration, avg engagement, peak moments)
    W->>W: Aggregate: recommendations (accepted/rejected/ignored counts)
    W->>W: Generate: engagement curve (data points for chart)
    W->>W: Render: HTML → PDF (weasyprint)

    W->>S: Upload report PDF
    W->>DB: UPDATE reports SET status='generated', file_path, generated_at

    Note over O,P: Operator otwiera panel post-show

    P->>API: GET /shows/{id}/analytics
    API->>DB: Query aggregated data
    API-->>P: {engagement_timeline, per_segment_stats, recommendations_summary, tags, overall_stats}

    P->>P: Render: interaktywny wykres, tabela segmentów, heatmap

    alt Operator chce eksport
        P->>API: GET /shows/{id}/export?format=csv
        API->>DB: Query: raw engagement_metrics
        API-->>P: CSV file download

        P->>API: GET /shows/{id}/export?format=json
        API->>DB: Query: full show data
        API-->>P: JSON file download
    end

    alt Operator chce raport PDF
        P->>API: GET /shows/{id}/report
        API->>S: Fetch PDF
        S-->>API: PDF binary
        API-->>P: PDF file download
    end
```

## Analytics Response — Struktura

```json
{
  "show": {
    "id": "uuid",
    "name": "Quebonafide — Warszawa",
    "venue": "COS Torwar",
    "date": "2026-05-15",
    "duration_seconds": 5535,
    "curfew_delta_seconds": -165
  },
  "overall": {
    "avg_engagement": 0.64,
    "peak_engagement": 0.95,
    "peak_moment": "2026-05-15T21:15:30Z",
    "lowest_engagement": 0.22,
    "lowest_moment": "2026-05-15T21:45:10Z",
    "total_segments": 18,
    "segments_completed": 16,
    "segments_skipped": 2,
    "total_delay_seconds": 195,
    "tags_count": 7
  },
  "engagement_timeline": [
    {"timestamp": "2026-05-15T20:05:00Z", "score": 0.55, "event": "cheering"},
    {"timestamp": "2026-05-15T20:05:10Z", "score": 0.58, "event": "cheering"}
  ],
  "per_segment": [
    {
      "name": "Tatuaż",
      "position": 1,
      "variant_used": "full",
      "planned_duration": 240,
      "actual_duration": 255,
      "delta": 15,
      "avg_engagement": 0.72,
      "peak_engagement": 0.89,
      "dominant_event": "cheering"
    }
  ],
  "recommendations_summary": {
    "total": 42,
    "accepted": 8,
    "rejected": 5,
    "ignored": 29,
    "fallback_used": 12
  },
  "tags": [
    {"timestamp": "2026-05-15T21:12:00Z", "tag": "energy_drop", "custom_text": null},
    {"timestamp": "2026-05-15T21:30:00Z", "tag": "tech_problem", "custom_text": "Mikrofon artysty"}
  ]
}
```

## Eksport — Formaty

### CSV (surowe metryki)

Kolumny: `timestamp, score, rms_energy, spectral_centroid, zcr, event_type, event_confidence, trend`

Jeden wiersz per pomiar (co 5-10s). Dla 90-min show: ~540-1080 wierszy.

### JSON (pełne dane)

Pełna struktura `analytics response` + surowe metryki. Przydatne do dalszej analizy w Python/Jupyter.

### PDF (raport automatyczny)

Sekcje raportu:
1. **Podsumowanie** — nazwa, venue, data, czas trwania, kluczowe metryki.
2. **Engagement Timeline** — wykres engagement w czasie (z zaznaczonymi segmentami i tagami).
3. **Tabela Segmentów** — per-segment stats (czas planowany vs faktyczny, engagement, delta).
4. **Rekomendacje** — ile zaakceptowanych/odrzuconych, najlepsze i najgorsze rekomendacje.
5. **Tagi operatora** — lista z timestamps.
6. **Wnioski** — peak moments, low moments, anomalie.
