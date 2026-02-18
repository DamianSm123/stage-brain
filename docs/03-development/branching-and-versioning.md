# Branching & Versioning

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Zespół deweloperski

---

Strategia pracy z Git w StageBrain. Podejście trunk-based z feature branches — uproszczone względem GitFlow, bo zespół to 1 deweloper + AI, a nie 10-osobowy team.

## 1. Dlaczego nie pełny GitFlow?

GitFlow (master/dev/release/hotfix) zaprojektowany jest dla dużych zespołów z wieloma równoległymi features i release'ami. W StageBrain:

- **1 deweloper** (frontend) + AI (backend) — brak konfliktów między zespołami.
- **1 środowisko** produkcyjne (VPS) — brak staging/UAT.
- **MVP 10 tygodni** — szybki cykl iteracji, nie formalne release'y.

Uproszczona strategia to **trunk-based development z feature branches**: `main` + `feature/*`.

---

## 2. Struktura Gałęzi

### Gałąź stała

| Gałąź | Opis | Ochrona |
|:---|:---|:---|
| **`main`** | Produkcja. Kod na `main` = kod na VPS. Deploy automatyczny po merge. | Protected (wymaga PR + CI green) |

### Gałęzie tymczasowe

| Typ | Źródło | Cel (Merge) | Opis |
|:---|:---|:---|:---|
| **`feature/*`** | `main` | `main` | Nowe funkcjonalności i rozszerzenia |
| **`fix/*`** | `main` | `main` | Poprawki błędów |
| **`hotfix/*`** | `main` | `main` | Krytyczne poprawki (priorytetowy review + merge) |

---

## 3. Nazewnictwo Gałęzi

**Format:** `type/kebab-case-description`

### Przykłady

```
feature/audio-pipeline-yamnet-classification
feature/live-panel-engagement-gauge
feature/setlist-csv-import
fix/websocket-reconnect-on-disconnect
fix/engagement-score-calibration-offset
hotfix/docker-compose-postgres-volume
```

### Konwencja

- Typ: `feature`, `fix`, `hotfix`
- Opis: angielski, kebab-case, krótki i opisowy
- Bez numerów ticketów (nie używamy Jiry/Linear w MVP)

---

## 4. Workflow

### Codzienna praca

```
main (protected)
  │
  ├── feature/audio-pipeline-librosa ──► PR ──► squash merge ──► main
  │
  ├── feature/live-panel-layout ──► PR ──► squash merge ──► main
  │
  └── fix/engagement-trend-calculation ──► PR ──► squash merge ──► main
```

### Krok po kroku

```bash
# 1. Utwórz branch z aktualnego main
git checkout main
git pull origin main
git checkout -b feature/audio-pipeline-librosa

# 2. Pracuj, commituj (Conventional Commits)
git add .
git commit -m "feat(audio): add librosa feature extraction"

# 3. Push i utwórz PR
git push -u origin feature/audio-pipeline-librosa
gh pr create --title "feat(audio): add librosa feature extraction" --body "..."

# 4. Po review + CI green → Squash Merge na main
# (GitHub UI lub gh pr merge --squash)

# 5. Deploy automatyczny (CI/CD → VPS)
```

### Zasady

1. **Nie commituj bezpośrednio na `main`** — zawsze przez PR.
2. **Squash Merge** — czysta historia.
3. **Usuwaj branch po merge** — GitHub robi to automatycznie (ustawienie repo).
4. **Rebase before merge** — przed merge upewnij się, że branch jest aktualny z `main`.

---

## 5. Wersjonowanie

### MVP (teraz)

W fazie MVP nie stosujemy formalnego SemVer. Wersja = **hash commita na `main`** + **Docker image tag**.

```
ghcr.io/org/stagebrain-api:main-abc1234
ghcr.io/org/stagebrain-web:main-def5678
```

### Post-MVP (po pilocie)

Jeśli projekt przejdzie do fazy produkcyjnej, wprowadzimy:

- **SemVer**: `MAJOR.MINOR.PATCH` (np. `1.0.0`, `1.1.0`, `1.1.1`)
- **Git Tags**: `v1.0.0` na `main`
- **Changelog**: Automatycznie generowany z Conventional Commits
- Osobne wersje dla `api` i `web` (np. `api@1.2.0`, `web@1.1.0`)

---

## 6. Hotfix Flow

Dla krytycznych bugów na produkcji:

```bash
# 1. Branch z main
git checkout main && git pull
git checkout -b hotfix/websocket-crash-on-binary-frame

# 2. Fix + test
git commit -m "fix(websocket): handle malformed binary frames"

# 3. PR z etykietą "hotfix" — priorytetowy review
gh pr create --title "fix(websocket): handle malformed binary frames" --label hotfix

# 4. Merge + automatyczny deploy
```

Hotfix różni się od zwykłego fix:
- **Priorytetowy review** (może być self-review dla krytycznych sytuacji).
- **Natychmiastowy merge** po CI green.
- **Nie czekamy** na batch z innymi zmianami.
