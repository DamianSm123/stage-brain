# Biblioteka Szablonów (Templates)

**Status**: Active
**Ostatni przegląd**: 2026-02-09
**Właściciel**: Janusz Kowalski

Katalog zawiera standardowe szablony dokumentów używanych w projekcie. Użycie szablonów zapewnia spójność i kompletność dokumentacji.

## Jak używać?

Nie edytuj plików w tym folderze bezpośrednio (chyba że aktualizujesz sam szablon).
Skopiuj wybrany plik `.md` do docelowego folderu i wypełnij go treścią.

## Lista szablonów

| Szablon | Plik | Zastosowanie | Docelowa lokalizacja |
| :--- | :--- | :--- | :--- |
| **Feature Overview** | [`feature-overview.md`](./feature-overview.md) | Opis nowej funkcjonalności produktu. | `docs/01-product/features/` |
| **ADR** | [`adr.md`](./adr.md) | Architectural Decision Record - decyzje architektoniczne. | `docs/02-architecture/adr/` |
| **RFC** | [`rfc.md`](./rfc.md) | Request For Comments - propozycje większych zmian wymagające dyskusji. | `docs/02-architecture/` lub inne |
| **Runbook** | [`runbook.md`](./runbook.md) | Instrukcja obsługi incydentu operacyjnego. | `docs/04-operations/runbooks/` |
| **Postmortem** | [`postmortem.md`](./postmortem.md) | Analiza po wystąpieniu incydentu (Root Cause Analysis). | `docs/04-operations/incident-management/postmortems/` |

## Utrzymanie

Jeśli zauważysz, że w szablonie brakuje ważnej sekcji, zgłoś to jako Pull Request do tego katalogu.
Pamiętaj o zaktualizowaniu dokumentacji w innych miejscach, jeśli zmieniasz strukturę szablonów.
