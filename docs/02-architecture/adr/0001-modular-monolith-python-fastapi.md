# ADR-0001: Modularny Monolit All-Python (FastAPI)

**Status**: Accepted
**Data**: 2026-02-18
**Autorzy**: Zespół architektury (sesja architektoniczna)

---

## Kontekst

Rozpoczynamy budowę systemu StageBrain (MVP Plus). Musimy wybrać architekturę backendu i język programowania. System wymaga:

- Przetwarzania audio w czasie rzeczywistym (librosa, YAMNet).
- Inferencji modelu ML do rankingu utworów (LightGBM).
- REST API i WebSocket dla panelu operatora.
- Budżetu infrastrukturalnego 200-800 PLN/mies.
- Timeline 10 tygodni do pilota.

**Profil zespołu**: Główny deweloper to frontend developer (React/TypeScript). Nie ma doświadczenia z backendem — ani w Pythonie, ani w TypeScript (NestJS/Express). Backend w całości pisze AI (Claude).

## Rozważane Alternatywy

### 1. Hybrid: NestJS (TypeScript) + Python microservice

- Backend API w TypeScript (70% kodu) + osobny serwis Python dla audio/ML (30%).
- **Argument ZA**: "70% kodu w języku, który deweloper zna (TypeScript)."
- **Argument PRZECIW**: Deweloper nie zna NestJS patterns (controllers, services, DI, guards, pipes) — to nie jest React. Znajomość TypeScript w React ≠ znajomość NestJS backend. Korzyść hybridu nie istnieje.
- **Argument PRZECIW**: Dwa serwisy = integracja, API kontrakt, serializacja między językami, więcej miejsc na błędy.
- **Argument PRZECIW**: AI musi utrzymywać spójność między dwoma codebase'ami.

### 2. NestJS (all-TypeScript)

- Silny w modularnych monolitach, ale ekosystem audio/ML jest znacząco słabszy.
- Wymusza polyglot (NestJS + Python microservice) dla audio/ML — co sprowadza do Alternatywy 1.
- NestJS ma złożone patterns (DI, moduły, guardy, pipe'y) — zbędna złożoność gdy AI pisze backend.

### 3. Go

- Doskonała wydajność, ale brak ekosystemu ML/audio.
- Nowy język dla całego zespołu i AI generuje w nim więcej boilerplate.

### 4. Django

- Synchroniczny, brak natywnych WebSocketów (wymaga Django Channels), cięższy framework.
- Więcej konfiguracji na start.

## Decyzja

Wybieramy **modularny monolit w Pythonie z frameworkiem FastAPI**.

Cały backend w jednym języku (Python), jeden serwis, logicznie podzielony na moduły domenowe: `audio`, `engagement`, `recommendations`, `setlist`, `shows`, `analytics`, `websocket`, `core`.

## Uzasadnienie

1. **Ekosystem audio/ML natywny w Pythonie**: librosa, YAMNet, LightGBM, NumPy, SciPy — import i działa, zero bridgowania.
2. **Prostota FastAPI**: Endpoint to 1 dekorowana funkcja. W NestJS to controller + service + module + DTO. Mniej plików na feature (1-2 vs 4-6).
3. **AI error rate**: Niższy w FastAPI — mniej warstw abstrakcji do pomylenia. AI pisze lepszy kod gdy framework jest prostszy.
4. **Zero integracji**: Jeden serwis = jeden zestaw logów, jedno miejsce do debugowania, zero API kontraktów między serwisami.
5. **Python jest czytelny**: `if show.status == "live":` jest zrozumiałe nawet bez znajomości języka — łatwy code review dla frontend developera.
6. **Wydajność wystarczająca**: Przy skali MVP (1 koncert, 1 operator) Python z uvicorn + asyncio jest więcej niż wystarczający.

## Konsekwencje

- (+) Najszybszy development dla pipeline audio + ML + API.
- (+) Jeden język = jedna konfiguracja lintingu, testów, CI.
- (+) Prostszy debugging — jeden serwis, jeden zestaw logów, AI analizuje jedno miejsce.
- (+) Python naturalnie się przyswaja przez code review.
- (-) Python wolniejszy niż Go/Rust — akceptowalne przy obecnej skali.
- (-) GIL (Global Interpreter Lock) — mitygacja: `asyncio` dla I/O, `ProcessPoolExecutor` dla CPU-intensive audio.
- (-) Deweloper nie zna Pythona — mitygacja: AI pisze cały backend; Python jest czytelny.

## Rewizja

Ta decyzja powinna zostać zrewidowana, jeśli:
- Skala wzrośnie do wielu równoległych koncertów (multi-venue) — rozważyć Go/Rust dla hot path.
- Czas przetwarzania audio w Pythonie przekroczy akceptowalny próg (>5s per okno).
