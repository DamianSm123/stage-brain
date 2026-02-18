# Architecture Decision Records (ADR)

**Status**: Active
**Ostatni przegląd**: 2026-02-18

---

Ten katalog zawiera rejestr kluczowych decyzji architektonicznych podjętych w projekcie StageBrain.

## Spis treści

- [Szablon ADR](../../06-templates/adr.md)
- [ADR-0001 — Modularny Monolit All-Python (FastAPI)](./0001-modular-monolith-python-fastapi.md)
- [ADR-0002 — Dwuwarstwowy Audio Pipeline (librosa + YAMNet)](./0002-audio-pipeline-librosa-yamnet.md)
- [ADR-0003 — Real-time Communication: WebSocket + Redis Pub/Sub](./0003-websocket-redis-realtime.md)
- [ADR-0004 — TimescaleDB dla Engagement Metrics](./0004-timescaledb-engagement-metrics.md)
- [ADR-0005 — ML Ranking: LightGBM z Fallbackiem Regułowym](./0005-ml-ranking-lightgbm.md)
- [ADR-0006 — Deployment: Docker Compose na VPS](./0006-docker-compose-vps-deployment.md)
- [ADR-0010 — StageBrain Stack Technologiczny (przegląd)](./0010-stagebrain-tech-stack.md)

## Kiedy tworzyć ADR?

ADR należy utworzyć, gdy podejmowana decyzja:

1. Ma znaczący wpływ na architekturę systemu.
2. Jest trudna do zmiany w przyszłości.
3. Wymaga wyjaśnienia kontekstu i alternatyw dla przyszłych sesji AI lub członków zespołu.

## Kontekst

ADR-0001 do ADR-0006 to fokusowe decyzje podjęte podczas sesji architektonicznej 2026-02-18. ADR-0010 to przegląd całego stacku technologicznego — pełny kontekst wszystkich decyzji w jednym miejscu.

Pełne notatki z sesji architektonicznej: [`ai/StageBrain_Sesja_Architektoniczna_2026-02-18.md`](../../../ai/StageBrain_Sesja_Architektoniczna_2026-02-18.md)
