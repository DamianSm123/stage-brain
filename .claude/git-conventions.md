# Git Conventions — StageBrain

## Commit Messages

Format: **Conventional Commits** (angielski)

```
<type>: <short description>
```

Dozwolone typy:

| Typ        | Kiedy używać                                 |
| ---------- | -------------------------------------------- |
| `feat`     | Nowa funkcjonalność                          |
| `fix`      | Naprawa buga                                 |
| `docs`     | Zmiany w dokumentacji                        |
| `refactor` | Refaktoryzacja bez zmiany zachowania         |
| `test`     | Dodanie lub modyfikacja testów               |
| `chore`    | Konfiguracja, tooling, zależności            |
| `style`    | Formatowanie, białe znaki (bez zmian logiki) |
| `ci`       | Zmiany w CI/CD pipeline                      |

Zasady:
- Pierwsza litera opisu **małą literą**: `feat: add crowd module` (nie `Add`)
- Maksymalnie **72 znaki** w pierwszej linii
- Opcjonalnie dłuższy opis po pustej linii
- Nie kończyć kropką

## Nazewnictwo Branchy

Format: `<type>/<krótki-opis-kebab-case>`

Przykłady:
- `feat/crowd-heatmap`
- `fix/websocket-reconnect`
- `docs/api-endpoints`
- `refactor/event-service`
- `chore/eslint-config`
- `test/crowd-module-unit`

## Workflow

1. **Nowa praca** → zawsze nowy branch z `main`
2. **Commituj często** — małe, atomowe commity (jedna logiczna zmiana = jeden commit)
3. **Nie pushuj bez pytania** — push do remote tylko na wyraźną prośbę użytkownika
4. **Squash merge do main** — przy merge'owaniu PR-a do main, squash do jednego commita
5. **Nie ruszaj `main` bezpośrednio** — zawsze przez feature branch + PR
