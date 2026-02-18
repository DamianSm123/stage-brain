# Dokumentacja Systemu StageBrain

Witamy w centralnej bazie wiedzy projektu **StageBrain** — systemu wsparcia decyzyjnego w czasie rzeczywistym dla reżysera / showcallera / producenta koncertu.

## Cel

To repozytorium dokumentacji ma na celu:

1. **Wdrożenie** — szybkie zrozumienie projektu, jego kontekstu i decyzji.
2. **Dokumentowanie** — decyzje architektoniczne (ADR), logika produktowa, pipeline audio/ML.
3. **Standaryzację** — procedury programistyczne, konwencje kodu, deployment.

## Realizowany wariant

**Wariant B — MVP Plus (10 tygodni)**. Zawiera zakres Wariantu A (baza) plus: kalibracja per venue, ML ranking utworów (LightGBM), panel post-show, eksport danych, automatyczne raporty.

## Mapa Dokumentacji

| Folder | Opis |
|:---|:---|
| [**00-start-here**](./) | **Zacznij Tutaj**: Konwencje, nawigacja, słownik pojęć domenowych. |
| [**01-product**](../01-product/) | **Produkt**: Wizja, wymagania funkcjonalne, persony, user journeys, features MVP. |
| [**02-architecture**](../02-architecture/) | **Architektura**: C4, ADR, schemat bazy danych, pipeline audio, diagramy sekwencji. |
| [**03-development**](../03-development/) | **Development**: Konfiguracja lokalna, standardy kodu, testowanie, struktura repo. |
| [**04-operations**](../04-operations/) | **Operacje**: CI/CD, deployment (Docker Compose), monitoring, backup. |
| [**05-security**](../05-security/) | **Bezpieczeństwo**: Autentykacja, prywatność danych audio, fail-safe. |
| [**06-templates**](../06-templates/) | **Szablony**: ADR, RFC, postmortem, runbook. |

---

## Źródła dokumentacji

Projekt posiada dwa zestawy dokumentów:

| Lokalizacja | Rola |
|:---|:---|
| `docs/` (ten folder) | **Dokumentacja techniczna** — strukturalna, utrzymywana, Single Source of Truth. |
| `ai/` | **Dokumenty źródłowe i sesje architektoniczne** — briefing TINAP, oferta CodeAgency, notatki z sesji AI. Służą jako kontekst, nie jako SSOT. |

> **Zasada:** Jeśli informacja istnieje w `docs/` i w `ai/`, prawdą jest wersja z `docs/`. Dokumenty w `ai/` to materiały wejściowe i kontekst historyczny.

---

## Kontekst projektu

- **Inicjator**: TINAP — ekipa showcallingu i stage managementu (Quebonafide, Mata, Sobel)
- **Design partner**: TINAP (współtworzenie wymagań, walidacja, pierwszy użytkownik)
- **Realizacja**: Deweloper frontend (React/TS) + AI (Claude) pisze backend (Python/FastAPI)
- **Cel pilota**: Maj 2026 — test w warunkach koncertowych

---

## Workflow zmian w dokumentacji

1. **Pull Request**: Wszystkie zmiany wymagają PR.
2. **Commit Messages**: Conventional commits (`docs: update deployment guide`).
3. **Aktualizuj dokumentację przy zmianach w kodzie** — nie odkładaj na później.

### Definicja "Docs Done"

- [ ] Treść jest merytorycznie poprawna.
- [ ] Brak martwych linków.
- [ ] Zgodność z [Konwencjami](./conventions.md).
- [ ] Dodano wpisy do [Słownika](./glossary.md), jeśli wprowadzono nowe pojęcia.

---

_Jeśli czujesz się zagubiony, zacznij od [Jak korzystać z tej dokumentacji](./how-to-use-this-docs.md)._
