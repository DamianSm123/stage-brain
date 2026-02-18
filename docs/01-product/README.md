# Product & Requirements

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Deweloper / AI

W tej sekcji znajduje się kompletna dokumentacja produktowa systemu **StageBrain** — systemu wsparcia decyzyjnego w czasie rzeczywistym dla reżysera / showcallera / producenta koncertu.

## Realizowany wariant

**Wariant B — MVP Plus (10 tygodni)**. Zawiera zakres Wariantu A (baza) plus: kalibracja per venue, ML ranking utworów (LightGBM), panel post-show, eksport danych, automatyczne raporty.

## Jak korzystać z tej sekcji?

Dokumentacja produktowa jest **źródłem prawdy** o tym, jak system ma działać.

1. **Zrozumienie wizji**: Zacznij od [vision.md](./vision.md), aby zrozumieć cel i propozycję wartości.
2. **Dla kogo budujemy**: [personas.md](./personas.md) opisuje aktorów systemu.
3. **Jak to działa**: [user-journeys.md](./user-journeys.md) pokazuje kluczowe przepływy operatora.
4. **Co budujemy**: [features/](./features/) — katalog funkcjonalności z opisami.
5. **Wymagania niefunkcjonalne**: [nfr.md](./nfr.md) określa standardy jakości i ograniczenia.
6. **Plan działania**: [roadmap.md](./roadmap.md) — harmonogram i warianty realizacji.

## Kluczowa zasada

- **Dokumentacja (tutaj)**: Opisuje **Feature Overview** — cel, zasady, logikę, przypadki brzegowe. Tu szukamy odpowiedzi na pytanie "jak to ma działać?".
- **`ai/`**: Dokumenty źródłowe (briefing TINAP, oferta CodeAgency, notatki z sesji). Kontekst historyczny, nie SSOT.

## Struktura

- [features/](./features/) — Szczegółowe opisy funkcjonalności.
- [releases/](./releases/) — Definicje zakresu dla konkretnych wersji.
- [user-journeys/](./user-journeys/) — Ścieżki użytkownika (operator).
