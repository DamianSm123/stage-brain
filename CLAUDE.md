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

## Git

Przed operacjami git (commit, branch, merge) przeczytaj konwencje: `.claude/git-conventions.md`
