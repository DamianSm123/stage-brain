# Architektura Systemu StageBrain

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Zespół architektury

---

Ten katalog zawiera dokumentację architektoniczną systemu StageBrain — systemu wsparcia decyzyjnego w czasie rzeczywistym dla showcallera / reżysera koncertu.

Dokumentacja jest przeznaczona dla deweloperów, AI (Claude) oraz przyszłych członków zespołu, aby zrozumieć budowę systemu, decyzje projektowe i zasady działania.

## Zawartość

### 1. [Przegląd Systemu](./system-overview.md)

- Wysokopoziomowy opis architektury (modularny monolit Python/FastAPI).
- Granice systemu i odpowiedzialności.
- Mapowanie modułów do funkcjonalności produktowych.
- Kluczowe przepływy danych (audio → engagement → rekomendacje → panel).

### 2. Model C4 (Context, Containers, Components, Deployment)

- [Context](./c4/context.c4) — System w otoczeniu (showcaller, audio source, systemy zewnętrzne).
- [Containers](./c4/container.c4) — Aplikacje i bazy danych (FastAPI, React SPA, PostgreSQL, Redis).
- [Components](./c4/component.c4) — Wnętrze backendu (moduły FastAPI).
- [Deployment](./c4/deployment.md) — Infrastruktura (Docker Compose na VPS).

### 3. Dane

- [Model Domenowy](./data/domain-model.md) — Główne encje i relacje (shows, setlists, segments, engagement metrics).
- [Schemat Bazy Danych](./data/database-schema.md) — Tabele PostgreSQL + TimescaleDB, strategia migracji.

### 4. Integracje

- [Kontrakty API](./integrations/api-contracts.md) — REST API, WebSocket endpoints, formaty wiadomości.

### 5. ADR (Architecture Decision Records)

- [Rejestr Decyzji](./adr/README.md) — Historia kluczowych decyzji technicznych.

### 6. Diagramy Sekwencji

- [Audio Pipeline](./sequences/audio-pipeline/) — Ingest audio, feature extraction, engagement scoring.
- [Live Show](./sequences/live-show/) — Setup, zarządzanie segmentami, kontrola czasu.
- [Rekomendacje](./sequences/recommendations/) — ML ranking, post-show analytics.

### 7. [Plan Implementacji](./stagebrain-implementation-plan.md)

- 10-tygodniowy plan implementacji MVP Plus (Wariant B).
- Fazy, deliverables, kryteria akceptacji.

## Powiązane dokumenty

- [Produkt](../01-product/README.md) — Wymagania produktowe, persony, features.
- [Słownik](../00-start-here/glossary.md) — Definicje pojęć domenowych.
- [Development](../03-development/README.md) — Setup lokalny, standardy kodu.
- [Dokumentacja źródłowa](../../ai/StageBrain_Architektura_i_Plan.md) — Pełny kontekst sesji architektonicznej.
