# Przegląd Systemu (System Overview)

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Zespół architektury

---

## 1. Opis Architektury

StageBrain (MVP Plus) jest realizowany jako **modularny monolit** w Pythonie (FastAPI), obsługujący panel operatora (React SPA) oraz pipeline analizy audio w czasie rzeczywistym.

System został zaprojektowany z myślą o:

- **Real-time audio analysis**: Dwuwarstwowy pipeline (librosa + YAMNet) przetwarzający audio w oknach 5-10s.
- **Wsparcie decyzyjne**: Engagement score, rekomendacje ML (LightGBM), kontrola czasu i scenariusze odzysku.
- **Prostota operacyjna**: Jeden backend (Python), jeden frontend (React), Docker Compose na VPS.
- **Fail-safe**: Awaria systemu nie blokuje koncertu — panel pokazuje "OFFLINE", koncert idzie dalej klasycznie.
- **Human-in-the-loop**: System rekomenduje, showcaller decyduje.

### Granice Systemu (System Boundaries)

**System StageBrain obejmuje:**

- FastAPI backend (REST API + WebSocket + audio processing + ML inference).
- React SPA (panel operatora: setup, live, post-show).
- Stronę audio source (przeglądarkowy klient przechwytujący audio z mikrofonu).
- Infrastrukturę danych (PostgreSQL + TimescaleDB, Redis).
- Background worker (raporty PDF, eksport — opcjonalny).

**System NIE obejmuje (integracje zewnętrzne / out of scope):**

- Sterowanie oświetleniem, pirotechniką, timecode — StageBrain nie ingeruje w systemy produkcyjne.
- Moduł wideo — poza zakresem MVP Plus.
- Rozpoznawanie twarzy / identyfikacja osób — poza zakresem.
- Tryb offline/edge — poza zakresem MVP Plus (Wariant C).
- Role użytkowników i system uprawnień — poza zakresem MVP Plus (Wariant C).

---

## 2. Kluczowe Komponenty i Odpowiedzialności

| Komponent | Technologia | Odpowiedzialność |
|:---|:---|:---|
| **Operator Panel** | React 19 + TypeScript + Vite + Tailwind | Panel operatora: setup pre-show, live monitoring, post-show analytics. Ciemny motyw, duże elementy dotykowe, stabilny layout. |
| **Audio Source** | React (Web Audio API) | Strona przeglądarkowa przechwytująca audio z mikrofonu na venue i wysyłająca chunki binary przez WebSocket do backendu. |
| **API Server** | FastAPI + uvicorn | REST API, WebSocket endpoints, logika biznesowa, audio processing, ML inference, autentykacja. |
| **Background Worker** | Celery/arq | Generowanie raportów PDF, eksport CSV/JSON — operacje które mogą trwać dłużej. Opcjonalny komponent. |
| **Database** | PostgreSQL 16 + TimescaleDB | Źródło prawdy: dane relacyjne (shows, setlists, venues) + time-series (engagement metrics w hypertable). |
| **Cache / Pub-Sub** | Redis 7 | Cache stanu live, pub/sub broadcast metryk engagement do panelu, opcjonalnie task queue. |
| **Reverse Proxy** | Caddy | HTTPS z automatycznym SSL (Let's Encrypt), routing do API i SPA. |

---

## 3. Mapowanie do Modułów Produktowych

Struktura backendu (modułów Python) odpowiada głównym obszarom funkcjonalnym zdefiniowanym w [dokumentacji produktowej](../01-product/README.md).

| Obszar Produktowy | Moduł Techniczny (Backend) | Ścieżka | Główne Funkcje |
|:---|:---|:---|:---|
| **Audio & Engagement** | `audio` | `apps/api/src/audio/` | WebSocket ingest, librosa feature extraction, YAMNet klasyfikacja, ring buffer. |
| **Engagement Score** | `engagement` | `apps/api/src/engagement/` | Agregacja metryk, kalibracja venue, trend analysis, scoring 0-1. |
| **Rekomendacje** | `recommendations` | `apps/api/src/recommendations/` | LightGBM ranking, fallback regułowy, feature engineering, log rekomendacji. |
| **Setlista** | `setlist` | `apps/api/src/setlist/` | CRUD setlisty, import CSV, zarządzanie segmentami i wariantami (full/short). |
| **Koncerty & Czas** | `shows` | `apps/api/src/shows/` | Show lifecycle (setup→live→ended), timeline, kontrola czasu, scenariusze odzysku, curfew, tagi operatora. |
| **Analityka** | `analytics` | `apps/api/src/analytics/` | Post-show analytics, eksport CSV/JSON, generowanie raportów PDF. |
| **WebSocket** | `websocket` | `apps/api/src/websocket/` | WebSocket handlers: audio ingest stream, live panel broadcast. |
| **Core** | `core` | `apps/api/src/core/` | Konfiguracja, DB session, auth middleware, health check, shared models. |

---

## 4. Przepływy Danych

### 4.1 Przepływ Live Show (główny)

```
Audio Source (przeglądarka na venue)
    │
    │  WebSocket binary (PCM/Opus chunki co 5-10s)
    ▼
FastAPI Backend
    │
    ├──► librosa: RMS Energy, Spectral Centroid, ZCR, Spectral Rolloff
    │
    ├──► YAMNet (TFLite/ONNX): klasyfikacja → Applause / Cheering / Silence / ...
    │
    ├──► Engagement Score: agregacja + kalibracja venue → score 0-1
    │
    ├──► TimescaleDB: zapis metryk (hypertable, co 5-10s)
    │
    ├──► Redis pub/sub: publish engagement update
    │
    ├──► LightGBM: ranking następnych segmentów (top 3-5)
    │
    └──► WebSocket JSON broadcast → Operator Panel
                                        │
                                        ▼
                                   React SPA:
                                   - Engagement gauge + trend
                                   - Rekomendacje ML
                                   - Status czasu + scenariusze
                                   - Quick tagi
```

### 4.2 Przepływ Interakcji Operatora

```
PRE-SHOW                          LIVE                              POST-SHOW
─────────                         ────                              ─────────

Importuj setlistę (CSV)    ──►  Panel Live:                    Panel Post-show:
Konfiguruj venue/kalibrację      │                               │
Ustaw curfew                     ├─ Engagement gauge (0-100)     ├─ Engagement timeline
Test audio (baseline)            ├─ Segment timeline             ├─ Tabela segmentów
                                 ├─ Rekomendacje ML (top 3-5)   ├─ Wykresy energii
    ──► START SHOW ──►           ├─ Zegar + prognoza curfew     ├─ Decyzje operatora
                                 ├─ Scenariusze odzysku          ├─ Eksport CSV/JSON
                                 ├─ Quick tagi                   ├─ Raport PDF
                                 └─ Start/End/Skip segment       │

                                     ──► END SHOW ──►            Automatyczny raport
```

---

## 5. Kluczowe Założenia Techniczne MVP

### 5.1 Profil dewelopera

> **Kontekst krytyczny dla architektury:**
> Główny deweloper to **frontend developer** (React / TypeScript). Nie ma doświadczenia z backendem — ani w Pythonie, ani w TypeScript. Backend w całości jest pisany przez AI (Claude). Deweloper reviewuje kod backendu, rozumie logikę, ale nie pisze go samodzielnie.

**Konsekwencje architektoniczne:**
- Backend celowo najprostszy z możliwych (FastAPI — endpoint to funkcja, nie klasa z DI).
- Jeden serwis Python — zero integracji między językami.
- AI pisze czytelny, dobrze udokumentowany kod.
- Debugowanie: AI analizuje logi i proponuje fixy.

### 5.2 Autentykacja

- MVP: prosty mechanizm (API key lub JWT z jednym kontem operatora).
- Middleware auth zaprojektowany tak, aby łatwo rozszerzyć na role (Wariant C).
- Brak SSO / OAuth na MVP.

### 5.3 Dane

- PostgreSQL jako główne źródło prawdy (dane relacyjne + time-series z TimescaleDB).
- Migracje bazy danych wersjonowane przez Alembic, uruchamiane automatycznie przy deploy.
- Engagement metrics w hypertable — automatyczne partycjonowanie po czasie.

### 5.4 Asynchroniczność

- Audio processing: synchroniczne w obrębie WebSocket handliera (5-10s okno → process → respond). CPU-intensive operacje (librosa, YAMNet) w `ProcessPoolExecutor`.
- Background jobs: Celery/arq dla raportów PDF, eksportów CSV — operacje > 10s.
- Real-time broadcast: Redis pub/sub → WebSocket handler broadcastuje do panelu.

### 5.5 Fail-safe

- Docker `restart: always` — serwis podnosi się automatycznie w 2-5s.
- Frontend (React SPA) działa niezależnie — trzyma ostatni znany stan w pamięci.
- Gdy backend niedostępny → panel pokazuje "OFFLINE" badge → showcaller wie o sytuacji.
- Koncert idzie dalej klasycznie bez systemu (fallback wg dokumentacji produktowej).

---

## 6. Powiązane dokumenty

- [Model C4](./c4/) — Diagramy architektury.
- [ADR](./adr/README.md) — Decyzje architektoniczne z uzasadnieniami.
- [Model Domenowy](./data/domain-model.md) — Encje i relacje.
- [Schemat Bazy Danych](./data/database-schema.md) — Tabele i migracje.
- [API Contracts](./integrations/api-contracts.md) — REST i WebSocket endpoints.
- [Diagramy Sekwencji](./sequences/README.md) — Przepływy procesów.
