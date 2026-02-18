# Audio Ingest — Przepływ

**Status**: Active
**Ostatni przegląd**: 2026-02-18

---

## Opis

Proces przechwytywania audio z mikrofonu na venue i przesyłania do backendu przez WebSocket. Audio Source to strona przeglądarkowa (Chrome) na laptopie technika audio.

## Diagram

```mermaid
sequenceDiagram
    participant M as Mikrofon (venue)
    participant B as Browser (Audio Source)
    participant WS as FastAPI WebSocket Handler
    participant BUF as Ring Buffer

    Note over M,BUF: Faza: Inicjalizacja połączenia

    B->>B: navigator.mediaDevices.getUserMedia()
    B->>B: AudioWorklet: PCM capture
    B->>WS: WebSocket connect (wss://api/v1/audio/stream?token=jwt)
    WS-->>B: Connection accepted

    Note over M,BUF: Faza: Streaming audio (co 5-10s)

    loop Co 5-10 sekund
        M->>B: Sygnał audio (analogowy → digital)
        B->>B: MediaRecorder: encode Opus/WebM (lub raw PCM)
        B->>WS: Binary frame (audio chunk ~32-64 kbps)
        WS->>WS: Decode Opus → PCM (jeśli potrzebne)
        WS->>BUF: Dodaj chunk do ring buffer
        WS-->>B: ACK {received: true, chunk_id: N}
    end

    Note over M,BUF: Faza: Utrata połączenia

    B--xWS: Połączenie zerwane
    B->>B: Exponential backoff (1s, 2s, 4s, 8s...)
    B->>WS: WebSocket reconnect
    WS-->>B: Connection accepted (nowa sesja)
    B->>WS: Resume streaming
```

## Szczegóły techniczne

### Format audio

| Parametr | Wartość |
|:---|:---|
| Sampling rate | 16 kHz |
| Bit depth | 16-bit |
| Channels | Mono |
| Codec (z przeglądarki) | Opus/WebM (MediaRecorder) |
| Codec (po decode na serwerze) | PCM 16-bit |
| Bitrate | ~32 kbps (PCM) / ~64 kbps (Opus) |
| Chunk size | 5-10 sekund |

### Ring Buffer

- In-memory circular buffer na serwerze.
- Przechowuje ostatnie N okien (np. 6 okien × 10s = 60s).
- Starsze dane nadpisywane (nie potrzebujemy surowego audio z przed 60s).
- Audio processing czyta z buffora — nie blokuje ingestu.

### Reconnect

- Klient: exponential backoff (1s → max 30s).
- Po reconnect: streaming wznawia od aktualnego momentu (nie odtwarza buffora).
- Panel wyświetla status: `LIVE` / `RECONNECTING` / `OFFLINE`.
