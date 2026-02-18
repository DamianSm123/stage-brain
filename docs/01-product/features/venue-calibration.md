# Venue Calibration (Kalibracja per Venue)

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Deweloper / AI

---

## Cel i Wartość

Dostosowanie parametrów analizy audio do specyfiki miejsca i gatunku muzycznego. Hala na 15 000 osób brzmi inaczej niż klub na 500 — bez kalibracji [engagement score](./engagement-scoring.md) byłby nieporównywalny między venue i dałby błędne rekomendacje.

## Zakres (Scope)

### In
- Presety kalibracji per typ venue (hala, stadion, klub, open air).
- Parametry: pojemność, gatunek muzyczny, baseline energy, czułość klasyfikatora, normalizacja głośności.
- Ręczne nadpisanie parametrów przez operatora (sliders/inputs).
- Zapis konfiguracji kalibracji w bazie (powiązanie venue ↔ preset).
- Możliwość ponownego użycia presetu przy kolejnym koncercie w tym samym venue.

### Out
- Auto-kalibracja (automatyczne dostosowanie w trakcie show) — nie na MVP.
- Uczenie się kalibracji z danych historycznych — możliwe post-MVP.

## Presety

| Preset | Pojemność (typowa) | Charakterystyka akustyczna |
|:---|:---|:---|
| **Hala** | 5 000 – 20 000 | Wysoki ambient, echo, głośna PA |
| **Stadion** | 20 000 – 80 000 | Bardzo głośno, wiatr, rozproszenie dźwięku |
| **Klub** | 200 – 2 000 | Niski ambient, blisko publiczności, czytelny sygnał |
| **Open Air** | 1 000 – 50 000 | Brak ścian, szybka utrata energii dźwięku |

## Parametry Kalibracji

| Parametr | Opis | Zakres |
|:---|:---|:---|
| `energy_baseline` | Próg bazowy energii (poniżej = cisza/niska energia) | 0.0 – 1.0 |
| `sensitivity` | Czułość detekcji zmian energii | 0.1 – 2.0 |
| `noise_floor` | Poziom szumu tła (ignorowany w analizie) | 0.0 – 0.5 |
| `spectral_threshold` | Próg jasności dźwięku dla klasyfikacji zdarzeń | 0.0 – 1.0 |
| `normalization_factor` | Mnożnik normalizacji głośności | 0.5 – 3.0 |

## Scenariusze

### Happy Path (Pre-show)
1. Operator wchodzi w ekran setup i wybiera venue (istniejące lub nowe).
2. System podpowiada preset na podstawie typu venue.
3. Operator koryguje parametry (opcjonalnie).
4. Operator uruchamia test audio — system pokazuje baseline energy z mikrofonu.
5. Operator zatwierdza kalibrację → zapis do bazy.

### Nowe Venue
1. Operator tworzy nowe venue (nazwa, typ, pojemność).
2. System ładuje domyślny preset dla typu.
3. Operator dostosowuje parametry na podstawie soundchecku.

### Powrót do Znanego Venue
1. Operator wybiera venue z listy.
2. System ładuje ostatnią kalibrację dla tego venue.
3. Operator weryfikuje i ewentualnie koryguje.

## Reguły

- Każdy show musi mieć przypisaną kalibrację (nie można wystartować bez niej).
- Presety domyślne są read-only — operator tworzy kopię przy modyfikacji.
- Kalibracja jest snapshottowana przy starcie show — zmiany w presetach nie wpływają na trwający koncert.
- Dane kalibracji są częścią post-show analytics (dla porównań między venue).

## Linki

- Powiązane: [audio-analysis.md](./audio-analysis.md), [engagement-scoring.md](./engagement-scoring.md)
