# Coding Standards

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Zespół deweloperski

---

Standardy kodu, formatowania, procesu Code Review i workflow AI-assisted backend.

## 1. Conventional Commits

Wszystkie commity i tytuły Pull Requestów muszą być zgodne ze standardem [Conventional Commits](https://www.conventionalcommits.org/).

**Format:** `<type>(<scope>): <description>`

### Dozwolone typy

| Typ | Opis |
|:---|:---|
| **feat** | Nowa funkcjonalność |
| **fix** | Naprawa błędu |
| **docs** | Zmiany w dokumentacji |
| **style** | Formatowanie (brak zmian w logice) |
| **refactor** | Zmiana kodu bez zmiany funkcjonalności |
| **test** | Dodanie lub poprawa testów |
| **chore** | Narzędzia, konfiguracja, zależności |
| **ci** | Zmiany w CI/CD |

### Zakresy (`scope`)

| Scope | Kiedy |
|:---|:---|
| `api` | Zmiany w `apps/api/` |
| `web` | Zmiany w `apps/web/` |
| `audio` | Moduł audio pipeline |
| `engagement` | Moduł engagement scoring |
| `recommendations` | Moduł rekomendacji ML |
| `shows` | Moduł koncertów i czasu |
| `setlist` | Moduł setlisty |
| `analytics` | Moduł analityki post-show |
| `infra` | Docker, CI/CD, deployment |
| `deps` | Aktualizacja zależności |

### Przykłady

```
feat(audio): add YAMNet event classification
fix(engagement): correct calibration offset for outdoor venues
refactor(api): extract WebSocket manager to separate module
test(recommendations): add unit tests for fallback scoring
chore(deps): update fastapi to 0.115
ci: add backend lint step to PR workflow
docs: update API contracts with new export endpoints
```

---

## 2. Code Style — Python (Backend)

### Narzędzia

| Narzędzie | Rola | Konfiguracja |
|:---|:---|:---|
| **Ruff** | Linter + formatter (zastępuje flake8, isort, black) | `pyproject.toml` |
| **mypy** (opcjonalny) | Static type checking | `pyproject.toml` |

### Konfiguracja Ruff

```toml
# pyproject.toml
[tool.ruff]
target-version = "py312"
line-length = 99

[tool.ruff.lint]
select = [
    "E",    # pycodestyle errors
    "W",    # pycodestyle warnings
    "F",    # pyflakes
    "I",    # isort
    "UP",   # pyupgrade
    "B",    # flake8-bugbear
    "SIM",  # flake8-simplify
]

[tool.ruff.format]
quote-style = "double"
```

### Zasady Python

- **Type hints**: Wszystkie funkcje publiczne muszą mieć type hints (parametry + return type).
- **Pydantic**: Wszystkie request/response modele jako Pydantic `BaseModel`.
- **Async**: Endpointy FastAPI jako `async def`. CPU-intensive operacje (librosa, YAMNet) w `ProcessPoolExecutor`.
- **Nazewnictwo**: `snake_case` dla zmiennych, funkcji, modułów. `PascalCase` dla klas i Pydantic models.
- **Docstrings**: Wymagane dla modułów i złożonych funkcji. Format: krótki opis + Args/Returns.

```python
# Przykład — endpoint
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.dependencies import get_db
from src.shows.service import get_show_by_id
from src.shows.schemas import ShowResponse

router = APIRouter(prefix="/shows", tags=["shows"])


@router.get("/{show_id}", response_model=ShowResponse)
async def get_show(show_id: int, db: AsyncSession = Depends(get_db)) -> ShowResponse:
    """Pobierz szczegóły koncertu."""
    return await get_show_by_id(db, show_id)
```

### Komendy

```bash
# Lint
ruff check apps/api/src/

# Format
ruff format apps/api/src/

# Fix auto-fixable issues
ruff check --fix apps/api/src/
```

---

## 3. Code Style — TypeScript (Frontend)

### Narzędzia

| Narzędzie | Rola | Konfiguracja |
|:---|:---|:---|
| **ESLint** | Linter | `eslint.config.js` |
| **Prettier** | Formatter | `.prettierrc` |
| **TypeScript** | Type checking | `tsconfig.json` |

### Zasady TypeScript

- **Strict mode**: `tsconfig.json` z `"strict": true`.
- **No `any`**: Unikaj `any`. Używaj `unknown` + type guards lub generics.
- **Komponenty**: Functional components z typowanymi props.
- **Nazewnictwo**: `camelCase` dla zmiennych/funkcji, `PascalCase` dla komponentów/typów/interfejsów.
- **Typy API**: Importowane z `packages/shared-types/` (auto-generowane z OpenAPI).

```tsx
// Przykład — komponent
import type { ShowResponse } from "@stagebrain/shared-types";

interface EngagementGaugeProps {
  score: number;
  trend: "rising" | "falling" | "stable";
}

export function EngagementGauge({ score, trend }: EngagementGaugeProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-4xl font-bold">{Math.round(score * 100)}</span>
      <TrendIndicator trend={trend} />
    </div>
  );
}
```

### Komendy

```bash
# Lint
npm run lint

# Format
npm run format

# Type check
npm run typecheck
```

---

## 4. Pull Requests (PR)

### Cykl życia PR

1. **Draft**: Utwórz PR jako Draft dla wczesnego feedbacku lub sprawdzenia CI.
2. **Ready for Review**: Oznacz reviewerów gdy kod jest gotowy i przeszedł Self-Review.
3. **Review**: Min. 1 approval. W przypadku PR generowanych przez AI — deweloper musi zrozumieć każdą zmianę.
4. **Merge**: Po akceptacji i zielonym CI, merge wykonuje autor PR.

### Wymagania

- **Tytuł**: Zgodny z Conventional Commits.
- **Opis**: Kontekst, zakres zmian, jak testować.
- **Wielkość**: Preferowane małe PR (< 400 linii). Duże zmiany dziel na serie PR.
- **Testy**: Nowe features muszą mieć testy. Bugfix musi mieć regression test.

### Strategia Merge

Stosujemy **Squash Merge**.

- Historia feature brancha spłaszczana do jednego commita na `main`.
- Czysta, linearna historia na gałęzi głównej.

---

## 5. Workflow AI-Assisted Backend

> **Kontekst:** Backend (Python / FastAPI) jest pisany przez AI (Claude). Deweloper (frontend) reviewuje, rozumie logikę, ale nie pisze backendu samodzielnie.

### Zasady dla sesji AI

1. **Czytaj kontekst**: Przed generowaniem kodu przeczytaj istniejące pliki w module (router, service, models, tests).
2. **Konwencje**: Przestrzegaj konwencji tego repozytorium (nie wprowadzaj własnych wzorców).
3. **Type hints**: Każda funkcja ma type hints. Pydantic models dla request/response.
4. **Testy**: Każdy nowy endpoint/service ma testy (unit + integration).
5. **Migracje**: Po zmianie modeli — generuj migrację Alembic.
6. **Nie wymyślaj**: Nie dodawaj features poza zakresem zadania. Minimalna złożoność.

### Checklist Code Review (deweloper → AI code)

- [ ] Rozumiem co robi każda funkcja.
- [ ] Type hints są poprawne.
- [ ] Endpoint ma walidację inputu (Pydantic).
- [ ] Błędy mają sensowne kody HTTP i komunikaty.
- [ ] Testy pokrywają happy path i edge cases.
- [ ] Nie ma hardcoded wartości (używamy config/env vars).
- [ ] Migracja Alembic jest wygenerowana i poprawna.
- [ ] Nie wprowadzono zależności poza ustalonym stackiem.

---

## 6. Język i nazewnictwo

| Element | Język | Konwencja |
|:---|:---|:---|
| Kod (zmienne, funkcje, klasy) | Angielski | `snake_case` (Python), `camelCase` (TS) |
| Commit messages | Angielski | Conventional Commits |
| PR titles / descriptions | Angielski | — |
| Komentarze w kodzie | Angielski | — |
| Dokumentacja (`docs/`) | Polski | — |
| Komentarze biznesowe (TODO, FIXME) | Angielski | `# TODO: ...`, `// FIXME: ...` |
