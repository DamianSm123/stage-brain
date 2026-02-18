# Development

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Zespół deweloperski

Kompletny przewodnik po procesach wytwarzania oprogramowania StageBrain. Single Source of Truth dla dewelopera i sesji AI.

## Spis treści

- **[Getting Started & Local Setup](./local-setup.md)**
  Jak przygotować środowisko lokalne i uruchomić cały stack (Docker Compose + frontend + backend).

- **[Repository Structure](./repo-structure.md)**
  Struktura monorepo: `apps/api/` (Python), `apps/web/` (React), `packages/`, `infra/`.

- **[Coding Standards](./coding-standards.md)**
  Standardy kodu Python i TypeScript, Conventional Commits, Code Review, workflow AI-assisted backend.

- **[Branching & Versioning](./branching-and-versioning.md)**
  Strategia branching (trunk-based z feature branches), wersjonowanie, release flow.

- **[CI/CD](./ci-cd.md)**
  GitHub Actions: lint, test, build, deploy na Hetzner VPS via Docker Compose.

- **[Infrastructure](./infrastructure.md)**
  Docker Compose, Hetzner VPS, Caddy SSL, backup, monitoring (Sentry + Uptime Robot).

- **[Testing Strategy](./testing-strategy.md)**
  Piramida testów: pytest + httpx (backend), Vitest (frontend), Playwright (E2E).

- **[Troubleshooting](./troubleshooting.md)**
  Rozwiązania typowych problemów: Docker, Python venv, WebSocket, TimescaleDB, audio pipeline.

> **Dla nowych osób:** Zacznij od [Local Setup](./local-setup.md), następnie [Repository Structure](./repo-structure.md) i [Coding Standards](./coding-standards.md).
>
> **Dla sesji AI (Claude):** Przeczytaj [Coding Standards](./coding-standards.md) — sekcja "Workflow AI-assisted backend" — oraz [Repository Structure](./repo-structure.md), aby zrozumieć konwencje projektu.
