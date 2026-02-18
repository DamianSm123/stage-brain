# Segment Lifecycle — Przepływ

**Status**: Active
**Ostatni przegląd**: 2026-02-18

---

## Opis

Zarządzanie segmentami podczas koncertu: start, end, skip, zmiana wariantu. Operator kontroluje przebieg show przez panel lub WebSocket.

## Diagram — Start / End Segment

```mermaid
sequenceDiagram
    participant O as Operator (Panel)
    participant API as FastAPI Backend
    participant DB as PostgreSQL
    participant R as Redis
    participant P as Panel (broadcast)

    Note over O,P: Operator startuje segment

    O->>API: POST /shows/{id}/segments/{seg_id}/start
    API->>API: Validate: show=live, brak active segmentu, segment=planned
    API->>DB: INSERT show_timeline (segment, status: active, started_at: NOW())
    API->>DB: UPDATE segment SET status='active'
    API->>R: PUBLISH show:{id} {type: "segment_update", segment: "Tatuaż", status: "active"}
    API-->>O: OK {segment: "Tatuaż", started_at: "..."}
    R->>P: Broadcast segment_update do wszystkich paneli

    Note over O,P: Segment trwa... (engagement scoring działa w tle)

    Note over O,P: Operator kończy segment

    O->>API: POST /shows/{id}/segments/{seg_id}/end
    API->>API: Validate: segment=active
    API->>DB: UPDATE show_timeline SET status='completed', ended_at=NOW()
    API->>DB: UPDATE segment SET status='completed'
    API->>API: Calculate: actual_duration, delta vs planned
    API->>DB: UPDATE show_timeline SET actual_duration, delta_seconds
    API->>R: PUBLISH {type: "segment_update", segment: "Tatuaż", status: "completed", delta: "+0:15"}
    API-->>O: OK
    R->>P: Broadcast
```

## Diagram — Skip Segment

```mermaid
sequenceDiagram
    participant O as Operator
    participant API as FastAPI Backend
    participant DB as PostgreSQL
    participant R as Redis

    O->>API: POST /shows/{id}/segments/{seg_id}/skip
    API->>API: Validate: segment=planned (nie active!)
    API->>DB: INSERT show_timeline (segment, status: skipped)
    API->>DB: UPDATE segment SET status='skipped'
    API->>API: Recalculate: time projections (usunięty czas segmentu)
    API->>R: PUBLISH {type: "segment_update", segment: "Utwór X", status: "skipped"}
    API->>R: PUBLISH {type: "time_status", updated projections}
    API-->>O: OK
```

## Diagram — Zmiana Wariantu

```mermaid
sequenceDiagram
    participant O as Operator
    participant API as FastAPI Backend
    participant DB as PostgreSQL

    O->>API: POST /shows/{id}/segments/{seg_id}/variant {variant_type: "short"}
    API->>API: Validate: segment=planned lub active
    API->>DB: UPDATE show_timeline SET variant_id (nowy wariant)
    API->>API: Recalculate: planned_duration z nowego wariantu
    API->>API: Recalculate: time projections
    API-->>O: OK {new_planned_duration: 150, time_saved: 90}
```

## Reguły biznesowe

| Reguła | Szczegóły |
|:---|:---|
| Max 1 active segment | Nie można startować segmentu gdy inny jest active |
| Skip tylko planned | Nie można pominąć active segmentu (trzeba go najpierw zakończyć) |
| Zmiana wariantu: planned lub active | Zmiana z full→short możliwa nawet w trakcie grania (wpływa na oczekiwany czas) |
| Po end/skip: auto-recalculate time | Każda zmiana statusu segmentu triggeruje przeliczenie prognoz czasowych |
