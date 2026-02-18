# Kontrakty API i Integracje

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Zespół architektury

---

Dokument opisuje endpointy REST API i WebSocket systemu StageBrain. Pełna specyfikacja OpenAPI generowana jest automatycznie z kodu FastAPI i dostępna pod `/api/docs` (Swagger UI) i `/api/redoc` (ReDoc).

## 1. REST API

### Konwencje

- **Protokół**: HTTPS / JSON
- **Base URL**: `https://stagebrain.example.com/api/v1`
- **Wersjonowanie**: W URL (`/v1/`).
- **Autoryzacja**: `Authorization: Bearer <token>` (JWT lub API key na MVP).
- **Kody odpowiedzi**: Standardowe HTTP (200, 201, 400, 401, 404, 422, 500).
- **Paginacja**: `?page=1&per_page=20` dla list.
- **Walidacja**: Pydantic v2 — szczegółowe błędy walidacji w response 422.

### Endpointy — Health & Auth

| Metoda | Ścieżka | Opis | Auth |
|:---|:---|:---|:---|
| `GET` | `/health` | Health check (DB, Redis, status) | Nie |
| `POST` | `/auth/login` | Logowanie (na MVP: API key → JWT token) | Nie |

### Endpointy — Venues

| Metoda | Ścieżka | Opis |
|:---|:---|:---|
| `GET` | `/venues` | Lista venues |
| `POST` | `/venues` | Utwórz venue |
| `GET` | `/venues/{id}` | Szczegóły venue |
| `PUT` | `/venues/{id}` | Aktualizuj venue |

### Endpointy — Calibration

| Metoda | Ścieżka | Opis |
|:---|:---|:---|
| `GET` | `/calibration/presets` | Lista presetów kalibracji (systemowe + user) |
| `POST` | `/calibration/presets` | Utwórz custom preset |
| `GET` | `/calibration/presets/{id}` | Szczegóły presetu |

### Endpointy — Shows

| Metoda | Ścieżka | Opis |
|:---|:---|:---|
| `GET` | `/shows` | Lista koncertów (z paginacją) |
| `POST` | `/shows` | Utwórz koncert (venue + setlista + curfew) |
| `GET` | `/shows/{id}` | Szczegóły koncertu |
| `PUT` | `/shows/{id}` | Aktualizuj (tylko w stanie `setup`) |
| `POST` | `/shows/{id}/start` | Start show → status `live` |
| `POST` | `/shows/{id}/pause` | Pauza → status `paused` |
| `POST` | `/shows/{id}/resume` | Wznów → status `live` |
| `POST` | `/shows/{id}/end` | Zakończ → status `ended` |
| `POST` | `/shows/{id}/calibration` | Przypisz/zmień kalibrację do show |

### Endpointy — Setlists & Segments

| Metoda | Ścieżka | Opis |
|:---|:---|:---|
| `POST` | `/setlists` | Utwórz setlistę |
| `GET` | `/setlists/{id}` | Setlista z segmentami |
| `POST` | `/setlists/import` | Import z CSV (upload plik → parse → preview → confirm) |
| `PUT` | `/setlists/{id}/segments` | Reorder segmentów (tablica nowych pozycji) |
| `POST` | `/setlists/{id}/segments` | Dodaj segment |
| `PUT` | `/setlists/{id}/segments/{seg_id}` | Aktualizuj segment |
| `DELETE` | `/setlists/{id}/segments/{seg_id}` | Usuń segment |

### Endpointy — Show Timeline (Live)

| Metoda | Ścieżka | Opis |
|:---|:---|:---|
| `POST` | `/shows/{id}/segments/{seg_id}/start` | Start segmentu → `active` |
| `POST` | `/shows/{id}/segments/{seg_id}/end` | End segmentu → `completed` |
| `POST` | `/shows/{id}/segments/{seg_id}/skip` | Pomiń segment → `skipped` |
| `POST` | `/shows/{id}/segments/{seg_id}/variant` | Zmień wariant (full→short, body: `{variant_type}`) |

### Endpointy — Tags

| Metoda | Ścieżka | Opis |
|:---|:---|:---|
| `POST` | `/shows/{id}/tags` | Dodaj tag (body: `{tag, custom_text?}`) |
| `GET` | `/shows/{id}/tags` | Lista tagów z timestamps |

### Endpointy — Time Control

| Metoda | Ścieżka | Opis |
|:---|:---|:---|
| `GET` | `/shows/{id}/time-status` | Aktualny status czasu (elapsed, remaining, delay, projected_end) |
| `GET` | `/shows/{id}/recovery-scenarios` | Scenariusze odzysku czasu (skróć X, pomiń Y, hybryd) |
| `POST` | `/shows/{id}/apply-scenario` | Zastosuj scenariusz (body: `{scenario_id}`) |

### Endpointy — Analytics & Export

| Metoda | Ścieżka | Opis |
|:---|:---|:---|
| `GET` | `/shows/{id}/analytics` | Zagregowane dane post-show (engagement timeline, per-segment stats, reco, tagi) |
| `GET` | `/shows/{id}/export?format=csv` | Eksport surowych metryk engagement (CSV) |
| `GET` | `/shows/{id}/export?format=json` | Eksport pełnych danych show (JSON) |
| `GET` | `/shows/{id}/report` | Pobranie raportu PDF |
| `POST` | `/shows/{id}/report/generate` | Wygeneruj raport (async task) |

---

## 2. WebSocket Endpoints

### Audio Ingest

**Endpoint**: `wss://stagebrain.example.com/api/v1/audio/stream`

| Parametr | Opis |
|:---|:---|
| **Kierunek** | Venue → Serwer (głównie jednokierunkowy) |
| **Format** | Binary frames (PCM 16-bit 16kHz mono lub Opus/WebM) |
| **Interwał** | Jeden frame co 5-10 sekund |
| **Auth** | Query param `?token=<jwt>` |

**Protokół:**
1. Klient łączy się i wysyła header z formatem audio.
2. Klient wysyła binary frames co 5-10s.
3. Serwer potwierdza odbiór każdego chunka (ACK).
4. Serwer wysyła status (opcjonalnie): `{type: "audio_status", data: {received: true, processing: true}}`.

### Live Panel

**Endpoint**: `wss://stagebrain.example.com/api/v1/live/{show_id}`

| Parametr | Opis |
|:---|:---|
| **Kierunek** | Dwukierunkowy (serwer ↔ panel) |
| **Format** | JSON text frames |
| **Auth** | Query param `?token=<jwt>` |

**Serwer → Panel (message types):**

| Type | Opis | Interwał |
|:---|:---|:---|
| `engagement_update` | Score, trend, event_type, event_confidence | Co 5-10s |
| `time_status` | Elapsed, remaining, delay, projected_end, curfew | Co 10s lub przy zmianie |
| `recommendation_update` | Top 3-5 segmentów z score i reason | Przy zmianie engagement |
| `segment_update` | Aktualny segment, status, elapsed | Przy zmianie segmentu |
| `recovery_scenarios` | Scenariusze odzysku czasu | Przy delay > threshold |
| `alert` | Alerty (energia spadła, curfew zagrożone) | Event-driven |
| `snapshot` | Pełny stan live (po reconnect) | Na żądanie / po reconnect |

**Panel → Serwer (message types):**

| Type | Opis |
|:---|:---|
| `operator_tag` | Tag od operatora (preset lub custom) |
| `recommendation_decision` | Accept/reject rekomendacji |
| `segment_control` | Start/end/skip segmentu (alternatywa do REST) |
| `request_snapshot` | Żądanie pełnego stanu (po reconnect) |

---

## 3. Formaty Danych

### Show (response)

```json
{
  "id": "uuid",
  "name": "Quebonafide — Warszawa",
  "venue": {"id": "uuid", "name": "COS Torwar", "type": "hall"},
  "status": "live",
  "scheduled_date": "2026-05-15",
  "curfew": "2026-05-15T22:30:00+02:00",
  "actual_start": "2026-05-15T20:05:00+02:00",
  "setlist": {
    "id": "uuid",
    "name": "Północ/Południe Tour",
    "segments_count": 18,
    "total_planned_duration": 5400
  }
}
```

### Segment (response)

```json
{
  "id": "uuid",
  "name": "Tatuaż",
  "position": 5,
  "bpm": 128,
  "genre": "hip-hop",
  "expected_energy": 0.8,
  "status": "planned",
  "variants": [
    {"id": "uuid", "type": "full", "duration_seconds": 240},
    {"id": "uuid", "type": "short", "duration_seconds": 150}
  ]
}
```

### Engagement Update (WebSocket)

```json
{
  "type": "engagement_update",
  "data": {
    "score": 0.73,
    "trend": "rising",
    "event_type": "cheering",
    "event_confidence": 0.85,
    "rms_energy": 0.62,
    "spectral_centroid": 0.71,
    "timestamp": "2026-05-15T21:32:15+02:00"
  }
}
```

### Recovery Scenario (response)

```json
{
  "scenarios": [
    {
      "id": "scenario_1",
      "description": "Skróć 3 segmenty do wariantu short",
      "time_saved_seconds": 480,
      "projected_end": "2026-05-15T22:39:00+02:00",
      "curfew_delta_seconds": 540,
      "affected_segments": [
        {"segment_id": "uuid", "name": "Utwór X", "change": "full → short", "saved": 150},
        {"segment_id": "uuid", "name": "Utwór Y", "change": "full → short", "saved": 180},
        {"segment_id": "uuid", "name": "Utwór Z", "change": "full → short", "saved": 150}
      ]
    }
  ]
}
```

---

## 4. Type Safety (Backend ↔ Frontend)

FastAPI generuje specyfikację OpenAPI automatycznie z modeli Pydantic. Frontend korzysta z generowanych typów TypeScript:

```
FastAPI (Pydantic models)
    │
    ▼
OpenAPI spec (auto-generated, /api/openapi.json)
    │
    ▼
openapi-typescript (CLI tool)
    │
    ▼
TypeScript types (packages/shared-types/)
    │
    ▼
openapi-fetch (type-safe HTTP client w React)
```

Zmiana modelu w Pydantic → re-generacja typów → frontend ma aktualne typy bez ręcznego utrzymywania DTO.
