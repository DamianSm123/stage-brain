# Show Setup — Przepływ

**Status**: Active
**Ostatni przegląd**: 2026-02-18

---

## Opis

Proces konfiguracji koncertu przed show: tworzenie/import setlisty, wybór venue i kalibracji, ustawienie curfew, test audio. Show przechodzi ze stanu `setup` do `live`.

## Diagram

```mermaid
sequenceDiagram
    participant O as Operator (Panel)
    participant API as FastAPI Backend
    participant DB as PostgreSQL
    participant AS as Audio Source (venue)

    Note over O,AS: Faza 1: Konfiguracja koncertu

    O->>API: POST /shows {name, venue_id, curfew, scheduled_date}
    API->>DB: INSERT show (status: setup)
    DB-->>API: show created
    API-->>O: {id: "show_uuid", status: "setup"}

    O->>API: POST /setlists/import (upload CSV)
    API->>API: Parse CSV → segmenty + warianty
    API->>DB: INSERT setlist + segments + variants
    API-->>O: {setlist preview, segments_count: 18, total_duration: 5400s}

    O->>API: PUT /shows/{id} {setlist_id}
    API->>DB: UPDATE show SET setlist_id
    API-->>O: OK

    Note over O,AS: Faza 2: Kalibracja

    O->>API: GET /calibration/presets
    API-->>O: [{name: "Hala 5000+ / Pop", params: {...}}, ...]

    O->>API: POST /shows/{id}/calibration {preset_id, overrides: {energy_sensitivity: 1.2}}
    API->>DB: UPDATE show SET calibration
    API-->>O: OK

    Note over O,AS: Faza 3: Test audio

    AS->>API: WebSocket connect (audio stream)
    API-->>AS: Connected
    AS->>API: Audio chunk (test — 10s)
    API->>API: librosa + YAMNet processing
    API-->>O: WebSocket: {type: "audio_test", data: {rms: 0.15, baseline: "OK"}}

    Note over O,AS: Faza 4: Start show

    O->>API: POST /shows/{id}/start
    API->>API: Validate: setlista istnieje, kalibracja ustawiona, curfew > now
    API->>DB: UPDATE show SET status='live', actual_start=NOW()
    API-->>O: {status: "live", actual_start: "2026-05-15T20:05:00Z"}
    API->>API: Rozpocznij engagement scoring pipeline
    API->>API: Rozpocznij time tracking
```

## Walidacje przy starcie show

| Warunek | Błąd jeśli nie spełniony |
|:---|:---|
| Show ma setlistę | 400: "Setlist required before starting show" |
| Setlista ma ≥1 segment | 400: "Setlist must have at least one segment" |
| Curfew jest w przyszłości | 400: "Curfew must be in the future" |
| Show jest w stanie `setup` | 409: "Show already started" |
| Audio source podłączony | Warning (nie blokuje startu) |
