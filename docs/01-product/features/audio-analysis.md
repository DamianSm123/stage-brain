# Audio Analysis (Pipeline Audio)

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Deweloper / AI

---

## Cel i Wartość

Przechwytywanie i analiza audio publiczności w czasie rzeczywistym — fundament danych wejściowych dla całego systemu StageBrain. Bez analizy audio nie ma [engagement score](../../00-start-here/glossary.md#engagement-score), nie ma rekomendacji, nie ma danych do post-show.

## Zakres (Scope)

### In
- Przechwytywanie audio z mikrofonu na venue (Web Audio API w przeglądarce Chrome).
- Przesyłanie chunków audio przez [WebSocket](../../00-start-here/glossary.md#websocket) do serwera.
- Dwuwarstwowe przetwarzanie audio:
  - **Warstwa 1 — Metryki sygnałowe (librosa)**: RMS Energy, Spectral Centroid, Zero-Crossing Rate, Spectral Rolloff.
  - **Warstwa 2 — Klasyfikacja zdarzeń ([YAMNet](../../00-start-here/glossary.md#yamnet))**: oklaski, krzyk, skandowanie, cisza, śpiew, muzyka.
- Zapis metryk do bazy (TimescaleDB hypertable).
- Publikacja metryk przez Redis pub/sub do panelu operatora.

### Out
- Przechowywanie surowego audio (tylko metryki).
- Separacja źródeł (muzyka vs publiczność) — na MVP nie rozdzielamy.
- Moduł wideo (opcja po MVP Plus).

## Źródła Audio

| Źródło | Opis | Jakość sygnału crowd |
|:---|:---|:---|
| **Mikrofon ambient** | Statyw blisko publiczności | Najczystsza |
| **Audience mic** | Dedykowany mic na publiczność (częsty w produkcji) | Wysoka |
| **FOH feed** | Mix z miksera frontowego | Niska (zawiera muzykę) |
| **Mikrofon wbudowany w laptop** | Najłatwiejszy setup | Najgorsza |

> **Decyzja do ustalenia z TINAP (Faza 0)**: Jaki sprzęt jest standardowo dostępny na venue? Czy TINAP ma audience mici na swoich produkcjach?

## Przechwytywanie Audio (Venue → Serwer)

- **Urządzenie**: Laptop/tablet z przeglądarką Chrome przy FOH.
- **Technologia**: Web Audio API + MediaRecorder API.
- **Format**: MediaRecorder daje Opus/WebM → serwer dekoduje do PCM 16-bit, 16kHz, mono.
- **Buforowanie**: Okna 5-10 sekund → wysyłka jako jeden WebSocket binary frame.
- **Bandwidth**: ~32-64 kbps (minimalny).
- **Fallback**: Prosty Python script (`pyaudio` + `websocket-client`) jeśli przeglądarka zawodzi.

## Przetwarzanie Audio (Serwer)

### Warstwa 1 — Metryki sygnałowe (librosa)

| Metryka | Co mierzy | Zastosowanie |
|:---|:---|:---|
| **[RMS Energy](../../00-start-here/glossary.md#rms-energy)** | Głośność w oknie czasowym | Bazowy wskaźnik energii |
| **[Spectral Centroid](../../00-start-here/glossary.md#spectral-centroid)** | "Jasność" dźwięku | Wysoka = krzyk/oklaski, niska = mruczenie/cisza |
| **Zero-Crossing Rate** | Szum vs ton | Odróżnia oklaski od skandowania |
| **Spectral Rolloff** | Rozkład energii w widmie | Uzupełnia obraz sygnału |

Obliczenia na [oknach 5-10s](../../00-start-here/glossary.md#okno-czasowe-audio-window), wynik co ~5 sekund.

### Warstwa 2 — Klasyfikacja zdarzeń (YAMNet)

- Pre-trenowany model Google (AudioSet, 521 klas).
- Relevantne klasy: `Applause`, `Cheering`, `Crowd`, `Chanting`, `Singing`, `Silence`, `Music`.
- Inferencja: TensorFlow Lite lub ONNX Runtime.
- Wynik: rozkład prawdopodobieństw klas → "typ reakcji publiczności".

## Scenariusze

### Happy Path
1. Operator otwiera stronę Audio Source w przeglądarce na laptopie przy FOH.
2. Przeglądarka prosi o dostęp do mikrofonu → operator akceptuje.
3. Audio jest buforowane w oknach 5-10s i wysyłane przez WebSocket.
4. Serwer przetwarza każdy chunk (librosa + YAMNet).
5. Metryki zapisywane do TimescaleDB i publikowane przez Redis pub/sub.

### Edge Cases
- **Utrata połączenia WebSocket**: Auto-reconnect z exponential backoff. Chunki buforowane lokalnie w przeglądarce.
- **Zbyt głośna muzyka (niska jakość sygnału crowd)**: Fallback na same metryki sygnałowe (RMS energy) bez klasyfikacji YAMNet.
- **Brak dostępu do mikrofonu**: UI pokazuje instrukcje. Fallback na Python script.

## Reguły

- Każdy chunk audio jest przetwarzany natychmiast po odebraniu — bez kolejkowania.
- Metryki są zapisywane z timestampem server-side (nie client-side) dla spójności.
- Serwer potwierdza odbiór każdego chunka (ACK) przez WebSocket.
- Przy błędzie przetwarzania — log błędu, chunk pominięty, system kontynuuje z następnym.

## Linki

- Powiązane: [engagement-scoring.md](./engagement-scoring.md), [venue-calibration.md](./venue-calibration.md)
- Architektura: `02-architecture/adr/0010-stagebrain-tech-stack.md` (sekcja 2.5)
