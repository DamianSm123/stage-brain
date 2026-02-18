# Jak korzystać z tej dokumentacji

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Deweloper / AI

---

Przewodnik po nawigacji i współtworzeniu dokumentacji StageBrain.

## Scenariusze

### 1. Pierwszy kontakt z projektem

**Cel:** Szybkie zrozumienie co budujemy i dlaczego.

1. **Zacznij Tutaj:** Przeczytaj `00-start-here/README.md` — kontekst, wariant, mapa dokumentacji.
2. **Słownik:** Przeczytaj [Słownik](./glossary.md) — pojęcia domenowe (showcaller, engagement score, curfew...).
3. **Produkt:** Przeczytaj `01-product/README.md` — co budujemy, dla kogo, jakie problemy rozwiązujemy.
4. **Architektura:** Przejdź do `02-architecture/README.md` — stack, pipeline audio, diagramy.

### 2. Praca nad frontendem (React/TypeScript)

**Cel:** Zrozumieć kontekst backend API i zaimplementować UI.

1. **Features:** Sprawdź `01-product/features/` — specyfikacja funkcji, wymagania UX.
2. **API:** Przejrzyj `02-architecture/integrations/api-contracts.md` — endpointy, formaty, WebSocket.
3. **Setup:** `03-development/local-setup.md` — jak uruchomić stack lokalnie.
4. **Typy:** Typy TS generowane z OpenAPI backendu — `packages/shared-types/`.

### 3. Sesja z AI (Claude) — praca nad backendem

**Cel:** Dać AI pełen kontekst do napisania kodu backendu.

1. **Architektura:** `02-architecture/` — decyzje technologiczne (ADR), schemat danych, pipeline.
2. **Dokumenty źródłowe:** `ai/` — pełna dokumentacja produktowa, notatki z sesji architektonicznych.
3. **CLAUDE.md:** Instrukcje dla AI w root repo — scope, out-of-scope, referencje.
4. **Standardy kodu:** `03-development/coding-standards.md` — konwencje Python/FastAPI.

### 4. Konfiguracja i deployment

**Cel:** Postawić środowisko, wdrożyć na VPS.

1. **Setup lokalny:** `03-development/local-setup.md` — Docker Compose, zmienne środowiskowe.
2. **Infrastruktura:** `03-development/infrastructure.md` — VPS, specyfikacje.
3. **CI/CD:** `03-development/ci-cd.md` — GitHub Actions, pipeline.
4. **Operacje:** `04-operations/` — backup, środowiska, release.

---

## Jak szukać informacji

- **Struktura plików** — pliki zorganizowane logicznie:
  - Szukasz wymagań? → `01-product/`
  - Szukasz decyzji technicznych? → `02-architecture/adr/`
  - Szukasz jak uruchomić projekt? → `03-development/local-setup.md`
  - Szukasz pipeline audio? → `02-architecture/` (sequences, diagramy)
- **Wyszukiwanie globalne** — `Ctrl+Shift+F` / `Cmd+Shift+F` po słowach kluczowych.
- **Słownik** — nieznany termin? Sprawdź [Słownik](./glossary.md).

---

## Zasady aktualizacji

### Kiedy zmieniać dokumentację?

- **ZAWSZE**: Gdy zachowanie kodu zmienia się w sposób znaczący.
- **ZAWSZE**: Gdy zmieniają się wymagania produktowe.
- **ZAWSZE**: Gdy podejmowana jest decyzja architektoniczna (nowy ADR).
- **NIGDY**: Nie duplikuj kodu w dokumentacji — opisuj *intencję*, nie implementację.

> **Opis intencji vs duplikacja kodu:**
>
> Zapis "Engagement score to ważona suma RMS energy, spectral brightness i klasyfikacji YAMNet" jest lepszy niż kopiowanie formuły z kodu. Formuła się zmieni — intencja zostaje.

### Przepływ decyzji

1. **Mała poprawka** (literówka, doprecyzowanie) → bezpośredni PR.
2. **Nowa funkcja / zmiana** → aktualizacja istniejącego dokumentu + PR.
3. **Zmiana architektoniczna** → nowy ADR w `02-architecture/adr/`.
