# ADR-0003: Real-time Communication — WebSocket + Redis Pub/Sub

**Status**: Accepted
**Data**: 2026-02-18
**Autorzy**: Zespół architektury (sesja architektoniczna)

---

## Kontekst

StageBrain wymaga dwukierunkowej komunikacji w czasie rzeczywistym:

1. **Audio ingest**: Źródło audio na venue → serwer (binary chunks co 5-10s).
2. **Panel operatora**: Serwer → panel (engagement updates, rekomendacje, status czasu) + panel → serwer (tagi, akceptacje, kontrola segmentów).

Wymagania:
- Latencja akceptowalna: ~10-15s end-to-end (system analityczny, nie muzyczny).
- Odporność na zerwanie połączenia (venue = niestabilna sieć).
- Fail-safe: utrata połączenia nie blokuje koncertu.

## Rozważane Alternatywy

### 1. HTTP Polling

- Klient odpytuje serwer co N sekund.
- **Problem**: Opóźnienie = interwał pollingu. Przy 5s interwale: do 5s dodatkowej latencji. Niepotrzebne obciążenie serwera pustymi request'ami.

### 2. Server-Sent Events (SSE)

- Jednokierunkowe: serwer → klient (push).
- **Problem**: Brak kanału zwrotnego (klient → serwer). Wymagałby REST API do przesyłania tagów, akceptacji, kontroli segmentów. Dwie ścieżki komunikacji = złożoność.
- **Problem**: SSE nie wspiera binary frames — audio musiałoby iść inną ścieżką.

### 3. WebSocket (natywny FastAPI) — wybrana

- Dwukierunkowe, persistent connection.
- FastAPI ma natywne wsparcie dla WebSocket (Starlette).
- Wspiera binary frames (audio) i text frames (JSON).

### 4. gRPC Streaming

- Doskonała wydajność, typowane kontrakty.
- **Problem**: Wymaga generowania klientów, cięższy setup. Przeglądarka wymaga gRPC-Web proxy. Overengineering dla 1 operatora.

## Decyzja

Wybieramy **natywny WebSocket (FastAPI/Starlette)** z **Redis Pub/Sub** jako warstwą broadcast.

### Architektura

```
Audio Source (venue)
    │
    │  ws://api/v1/audio/stream (binary: PCM/Opus chunks)
    ▼
FastAPI WebSocket Handler ──► Audio Processing ──► Engagement Score
                                                        │
                                                        ▼
                                                  Redis Pub/Sub
                                                  (channel: show:{id})
                                                        │
                                                        ▼
FastAPI WebSocket Handler ◄── subscribes to channel
    │
    │  ws://api/v1/live/{show_id} (JSON: engagement, reco, time)
    ▼
Operator Panel (React SPA)
```

### Endpointy WebSocket

| Endpoint | Kierunek | Format | Opis |
|:---|:---|:---|:---|
| `ws://api/v1/audio/stream` | Venue → Serwer | Binary (PCM/Opus) | Chunki audio co 5-10s |
| `ws://api/v1/live/{show_id}` | Serwer ↔ Panel | JSON | Engagement, rekomendacje, czas. Panel wysyła: tagi, akceptacje, kontrola segmentów. |

### Format wiadomości JSON (live panel)

**Serwer → Panel:**
```json
{
  "type": "engagement_update",
  "data": {
    "score": 0.73,
    "trend": "rising",
    "event_type": "cheering",
    "event_confidence": 0.85,
    "timestamp": "2026-05-15T21:32:15Z"
  }
}
```

```json
{
  "type": "time_status",
  "data": {
    "elapsed": "01:23:45",
    "remaining_to_curfew": "00:36:15",
    "delay": "+03:20",
    "projected_end": "22:47",
    "curfew": "22:30"
  }
}
```

```json
{
  "type": "recommendation_update",
  "data": {
    "recommendations": [
      {"segment_id": "abc123", "name": "Utwór X", "score": 0.92, "reason": "Energia spada — energetyczny utwór"},
      {"segment_id": "def456", "name": "Utwór Y", "score": 0.84, "reason": "Wysoki kontrast vs poprzedni"}
    ]
  }
}
```

**Panel → Serwer:**
```json
{
  "type": "operator_tag",
  "data": {"tag": "energia_spada", "custom_text": null}
}
```

```json
{
  "type": "recommendation_decision",
  "data": {"recommendation_id": "rec123", "decision": "accept"}
}
```

### Reconnect Strategy

1. **Klient**: Exponential backoff reconnect (1s, 2s, 4s, 8s, max 30s).
2. **Serwer**: Stan live w Redis → po reconnect klient dostaje aktualny snapshot (ostatni engagement, pozycja w setliście, status czasu).
3. **Fail-safe**: Panel pokazuje ostatni znany stan + "OFFLINE" badge. Showcaller widzi, że system jest niedostępny, i działa klasycznie.

## Uzasadnienie

1. **Natywne w FastAPI**: Zero dodatkowych zależności. `@app.websocket("/ws/...")` i działa.
2. **Binary + Text**: Audio (binary) i dane panelu (JSON) przez ten sam protokół.
3. **Redis Pub/Sub**: Decoupluje audio processing od broadcast do panelu. Backend publikuje metrykę → Redis → WebSocket handler broadcastuje. Gotowe na wiele instancji API w przyszłości.
4. **Prostota**: Jeden protokół komunikacji (WebSocket), jeden format danych (JSON dla panelu, binary dla audio).

## Konsekwencje

- (+) Niska latencja broadcast (Redis pub/sub: ~0.1ms narzutu).
- (+) Dwukierunkowa komunikacja bez dodatkowych endpointów.
- (+) Gotowość na skalowanie (Redis pub/sub działa między instancjami).
- (-) WebSocket wymaga persistent connection — zużywa zasoby serwera per połączenie (akceptowalne przy 1-2 klientach na MVP).
- (-) Wymaga logiki reconnect po stronie klienta.
- (-) Debugging trudniejszy niż REST (brak narzędzi typu Postman dla WS — użyć websocat lub Insomnia).

## Rewizja

Ta decyzja powinna zostać zrewidowana, jeśli:
- Pojawiają się dziesiątki równoczesnych klientów → rozważyć dedykowany broker (np. NATS, MQTT).
- Wymagane jest gwarancja dostarczenia (at-least-once) → rozważyć Redis Streams zamiast pub/sub.
