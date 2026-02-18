# Konwencje i Standardy

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Deweloper / AI

---

Aby dokumentacja StageBrain pozostała czysta, czytelna i użyteczna, przestrzegamy poniższych konwencji.

## Struktura Pliku

Każdy większy plik dokumentacji (poza indeksami `README.md`) powinien zaczynać się od nagłówka:

```markdown
# Tytuł Dokumentu

**Status**: [Draft | Active | Deprecated]
**Ostatni przegląd**: RRRR-MM-DD
**Właściciel**: [Osoba / AI]

---
```

### Sekcje

- **Kontekst/Wstęp**: 1-2 zdania o tym, co pokrywa dana strona.
- **Treść**: Używaj jasnych nagłówków H2 (`##`) i H3 (`###`).
- **Referencje**: Linki do powiązanego kodu lub innych dokumentów na dole.

## Zasady Nazewnictwa

- **Pliki**: Małe litery, kebab-case.
  - (TAK) `audio-pipeline.md`
  - (NIE) `AudioPipeline.md`, `audio_pipeline.md`
- **Obrazy/Diagramy**: Umieszczaj w podkatalogu `assets/` relatywnie do dokumentu.
  - `02-architecture/assets/c4-container.png`

## Standard Linkowania

- **Linki Relatywne**: Zawsze używaj linków relatywnych.
  - (TAK) `[Architektura](../02-architecture/README.md)`
  - (NIE) `[Architektura](https://github.com/org/repo/blob/main/docs/02-architecture/README.md)`
- **Referencje do kodu**: Podawaj ścieżkę pliku + numer linii.
  - (TAK) `apps/api/src/audio/pipeline.py:42`

## Jedno Źródło Prawdy (SSOT)

| Typ Informacji | Źródło Prawdy |
|:---|:---|
| **Zakres produktu i wymagania** | `docs/01-product/` |
| **Decyzje techniczne** | `docs/02-architecture/adr/` |
| **Kontrakty API** | Kod (OpenAPI/Swagger) + `docs/02-architecture/` |
| **Procedury wdrożeniowe** | `docs/04-operations/` |
| **Polityki bezpieczeństwa** | `docs/05-security/` |
| **Terminologia** | `docs/00-start-here/glossary.md` |
| **Dokumenty źródłowe projektu** | `ai/` (kontekst historyczny, nie SSOT) |

**Zasada**: Nie kopiuj definicji. Linkuj do SSOT.

### Hierarchia i Rozwiązywanie Konfliktów

1. **Dokumentacja (`docs/`)** = **Prawda o tym, CO system ma robić i JAK jest zbudowany.**
2. **Kod** = **Prawda o implementacji.** Nie może przedefiniowywać wymagań bez zmiany w docs.
3. **`ai/`** = **Kontekst historyczny.** Jeśli `docs/` i `ai/` się rozmijają, wygrywa `docs/`.

## Język dokumentacji

- Dokumentacja techniczna: **polski** (z anglojęzycznymi terminami technicznymi tam, gdzie to naturalne).
- Kod, nazwy zmiennych, komentarze w kodzie: **angielski**.
- Komunikaty UI: **angielski** (MVP).

## Styl Markdown

- **Pogrubienie** (`**tekst**`) dla kluczowych terminów lub podkreślenia.
- *Kursywa* (`*tekst*`) dla stanów lub subtelnego podkreślenia.
- `Kod` (backticks) dla ścieżek plików, zmiennych, wartości konfiguracyjnych.
- Używaj **cytatów blokowych** (`>`) dla ostrzeżeń lub kluczowych uwag.
