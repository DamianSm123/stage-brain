# StageBrain

StageBrain — system wsparcia decyzyjnego w czasie rzeczywistym dla reżysera / showcallera / producenta koncertu. Narzędzie produkcyjne, nie aplikacja konsumencka.

## Realizowany zakres: Wariant B — MVP Plus (10 tygodni)

Wariant B zawiera w sobie cały zakres Wariantu A (baza) plus rozszerzenia. Wariantu C nie realizujemy.

**OUT OF SCOPE (czego NIE realizujemy):**

- Wariant C: tryb hybrydowy (edge/offline), observability, role użytkowników, hardening bezpieczeństwa, pilotaż onsite + runbook
- Moduł wideo, integracje z narzędziami produkcyjnymi, tryb multi-venue/multi-tour
- Pełna automatyzacja koncertu, sterowanie światłem/pirotechniką
- Rozpoznawanie twarzy, identyfikacja osób, analiza emocji jednostek
- Generowanie contentu

## Dokumentacja

- Pełna dokumentacja projektu: `ai/StageBrain_Dokumentacja_Kompletna.md`

## Code Quality

- **Frontend linter/formatter**: Biome — config w `apps/web/biome.json`
- **Backend linter/formatter**: Ruff — config w `apps/api/pyproject.toml` (sekcje `[tool.ruff]`)
- Pełna wersja konwencji z przykładami: `.claude/coding-conventions.md`

Uruchamiaj linter przed commitem:
- Frontend: `cd apps/web && npm run check`
- Backend: `cd apps/api && ruff check . && ruff format --check .`

### Frontend (React + TypeScript) — konwencje

- **Naming**: komponenty `PascalCase.tsx`, hooki `useCamelCase.ts`, store `camelCaseStore.ts`, stałe `UPPER_SNAKE_CASE`
- **Named exports only** — nigdy `export default` (wyjątek: pliki config jak `vite.config.ts`)
- **Props**: zawsze `interface XxxProps` (nie `type`), wyciągnięty nad komponent
- **TypeScript**: `strict: true`, prefer `unknown` over `any`, `import type {}` dla typów, unikaj `enum` (preferuj `as const`)
- **State**: props → useState → URL state (search params) → Zustand store (współdzielony / WebSocket)
- **API calls**: zawsze przez openapi-fetch client, nigdy raw `fetch()` ani `axios`
- **Custom hooks**: zwracaj obiekt przy 3+ wartościach
- **Error boundaries**: top-level + osobne per feature
- **Struktura katalogów**:
  ```
  src/
    features/<domain>/components/, hooks/, stores/, index.ts
    components/    # shared
    hooks/         # shared
    lib/           # utilities, API client
    types/         # shared types
  ```

### Backend (Python + FastAPI) — konwencje

- **Struktura modułu**: `router.py` (thin) → `service.py` (logika) → `models.py` (ORM) → `schemas.py` (Pydantic)
- **Pydantic naming**: `XxxCreate`, `XxxResponse`, `XxxUpdate`, `XxxFilters`, `XxxBase`
- **Service layer**: plain `async` functions (nie klasy), nie rzucaj `HTTPException` — rzucaj domain exceptions, router konwertuje
- **Async**: wszystko async, CPU-bound przez `ProcessPoolExecutor`
- **Dependencies**: `Annotated` types, reusable w `dependencies.py` per moduł
- **Testy**: pytest + pytest-asyncio, struktura mirrors `src/`, nazewnictwo `test_<what>_<scenario>`

## Git

Przed operacjami git (commit, branch, merge) przeczytaj konwencje: `.claude/git-conventions.md`
