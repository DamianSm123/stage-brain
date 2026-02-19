# Coding Conventions — StageBrain

Reguły, których linter nie sprawdzi. Biome (frontend) i Ruff (backend) pokrywają formatowanie i statyczną analizę — ten plik opisuje wzorce architektoniczne i konwencje nazewnicze.

---

## Frontend (React + TypeScript)

### Naming

| Element              | Konwencja              | Przykład                       |
| -------------------- | ---------------------- | ------------------------------ |
| Komponent            | `PascalCase.tsx`       | `CrowdHeatmap.tsx`             |
| Hook                 | `useCamelCase.ts`      | `useCrowdDensity.ts`           |
| Store (Zustand)      | `camelCaseStore.ts`    | `showRunnerStore.ts`           |
| Utility / helper     | `camelCase.ts`         | `formatDuration.ts`            |
| Typy / interfejsy    | `PascalCase`           | `CrowdMetrics`, `ShowSegment`  |
| Stałe                | `UPPER_SNAKE_CASE`     | `MAX_RETRY_COUNT`              |

### Exports

- **Named exports only** — nigdy `export default` (wyjątek: pliki konfiguracyjne jak `vite.config.ts`)
- Biome wymusza tę regułę; override jest w `biome.json` dla plików config

### Props

- Zawsze `interface`, nie `type` — dla spójności i lepszych error messages
- Interface wyciągnięty nad komponent, nazwany `XxxProps`

```tsx
interface CrowdHeatmapProps {
  zoneId: string;
  showDensity: boolean;
}

export function CrowdHeatmap({ zoneId, showDensity }: CrowdHeatmapProps) {
  // ...
}
```

### Struktura katalogów

```
src/
  features/
    crowd/
      components/       # komponenty UI specyficzne dla crowd
      hooks/            # custom hooks
      stores/           # Zustand stores
      index.ts          # public API modułu (re-exporty)
  components/           # shared components
  hooks/                # shared hooks
  lib/                  # utilities, API client
  types/                # shared types
```

### State management — decision tree

1. **Props** — dane z rodzica, < 2 poziomy prop drilling
2. **useState** — lokalny stan komponentu (toggle, input value)
3. **URL state** (search params) — filtry, paginacja, cokolwiek co powinno być linkable
4. **Zustand store** — stan współdzielony między komponentami, dane z WebSocket

### Custom hooks

- Gdy hook zwraca 3+ wartości → zwracaj obiekt (nie tablicę)
- Prefix `use` obowiązkowy

### Error boundaries

- Top-level boundary opakowuje całą aplikację
- Osobne boundary per feature (np. `CrowdErrorBoundary`)

### API calls

- Zawsze przez **openapi-fetch** client (generowany z OpenAPI schema)
- Nigdy raw `fetch()` ani `axios`
- Typy importowane z wygenerowanego klienta

### TypeScript

- `strict: true` w tsconfig
- Prefer `unknown` over `any`
- Użyj `import type { Xxx }` dla importów typów
- Unikaj enums — preferuj `as const` objects lub union types

---

## Backend (Python + FastAPI)

### Struktura modułu

Każdy moduł domenowy (np. `crowd`, `show`) ma cztery pliki:

```
src/
  crowd/
    router.py       # endpointy — thin, deleguje do service
    service.py      # logika biznesowa
    models.py       # modele SQLAlchemy (ORM)
    schemas.py      # schematy Pydantic (request/response)
  main.py           # FastAPI app, include routers
```

### Naming Pydantic schemas

| Operacja   | Nazwa             | Przykład             |
| ---------- | ----------------- | -------------------- |
| Create     | `XxxCreate`       | `ShowCreate`         |
| Response   | `XxxResponse`     | `ShowResponse`       |
| Update     | `XxxUpdate`       | `ShowUpdate`         |
| Filtry     | `XxxFilters`      | `CrowdFilters`       |
| Wewnętrzny | `XxxBase` (priv.) | `ShowBase`           |

### Service layer

- **Plain async functions**, nie klasy
- Nie rzucaj `HTTPException` w service — rzucaj domain exceptions (np. `ShowNotFoundError`)
- Router łapie domain exceptions i konwertuje na `HTTPException`

```python
# service.py
async def get_show(show_id: UUID) -> Show:
    show = await db.get(Show, show_id)
    if not show:
        raise ShowNotFoundError(show_id)
    return show

# router.py
@router.get("/shows/{show_id}")
async def get_show_endpoint(show_id: UUID) -> ShowResponse:
    try:
        show = await get_show(show_id)
    except ShowNotFoundError:
        raise HTTPException(status_code=404, detail="Show not found")
    return ShowResponse.model_validate(show)
```

### Async

- Wszystko `async` — router, service, DB queries
- CPU-bound tasks (ML inference, image processing) → `ProcessPoolExecutor`
- Nie mieszaj sync i async bez wyraźnego powodu

### Dependencies (FastAPI)

- Reusable dependencies w `dependencies.py` per moduł
- Annotated types dla dependency injection:

```python
from typing import Annotated
CurrentShow = Annotated[Show, Depends(get_current_show)]
```

### Testy

- **pytest** + **pytest-asyncio**
- Struktura testów odzwierciedla `src/`:

```
tests/
  crowd/
    test_service.py
    test_router.py
  conftest.py
```

- Fixtures w `conftest.py` (per-moduł i globalne)
- Nazewnictwo: `test_<what>_<scenario>` np. `test_get_show_returns_404_when_missing`
