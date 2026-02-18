# Wizja Produktu (Product Vision)

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Deweloper / AI

---

## Problem i Szansa

W produkcji koncertowej decyzje o kolejności utworów, zarządzaniu czasem i reagowaniu na energię publiczności podejmowane są dziś głównie na bazie **intuicji i komunikacji radiowej**. Brak obiektywnych danych w czasie rzeczywistym prowadzi do:

- **Spadków energii publiczności**, których nie da się szybko wykryć ani zmierzyć.
- **Chaosu czasowego** — opóźnienia kumulują się, a brak prognozowania uniemożliwia wyprzedzające reagowanie.
- **Presji finansowej** — przekroczenie [curfew](../00-start-here/glossary.md#curfew) oznacza kary finansowe i konflikty z obiektem.
- **Ryzyka wizerunkowego** — napięcia artysta–produkcja, nieoptymalny przebieg show.

## Rozwiązanie

**StageBrain** — system wsparcia decyzyjnego w czasie rzeczywistym dla [showcallera / reżysera / producenta](../00-start-here/glossary.md#showcaller--reżyser--producent) koncertu.

System:

- Analizuje reakcje publiczności (w MVP głównie **audio**).
- Oblicza [engagement score](../00-start-here/glossary.md#engagement-score) w czasie rzeczywistym.
- Rekomenduje kolejność kolejnych utworów/segmentów.
- Monitoruje czas do [curfew](../00-start-here/glossary.md#curfew) i prezentuje scenariusze odzysku.
- Loguje przebieg show i generuje raporty post-show.

## Czym system NIE jest

- **Nie zastępuje człowieka** — nie podejmuje autonomicznych decyzji.
- **Nie ingeruje w przygotowane show** — operuje wyłącznie na wcześniej przygotowanych wariantach.
- **Nie jest aplikacją konsumencką** — to narzędzie produkcyjne backstage.
- **Nie generuje contentu** — nie steruje światłem, pirotechniką ani dźwiękiem.
- **[Human-in-the-loop](../00-start-here/glossary.md#human-in-the-loop)**: System rekomenduje — **decyzję zawsze podejmuje człowiek**.
- **[Fail-safe](../00-start-here/glossary.md#fail-safe)**: Awaria systemu nie może blokować realizacji — koncert idzie dalej klasycznie.

## Grupy Docelowe (Target Audience)

1. **[Showcaller / Reżyser / Producent](../00-start-here/glossary.md#showcaller--reżyser--producent)**: Główny użytkownik — podejmuje decyzje w czasie rzeczywistym na podstawie rekomendacji systemu.
2. **[Operator](../00-start-here/glossary.md#operator)**: Obsługuje panel StageBrain. W MVP to ta sama osoba co showcaller. W przyszłości może być dedykowany technik.
3. **[TINAP](../00-start-here/glossary.md#tinap)**: Design partner — współtworzy wymagania, waliduje rozwiązania, pierwszy użytkownik i miejsce testów MVP.

## Wartość (Value Proposition)

- **Lepsze decyzje live** oparte o dane (a nie wyłącznie intuicję / komunikację radiową).
- **Większa kontrola nad energią show** — szybkie wykrywanie spadków i rekomendacje scenariuszy.
- **Mniejszy chaos czasowy** — stała prognoza i warianty odzyskiwania czasu.
- **Redukcja ryzyka finansowego** (kary za przekroczenie curfew) i ryzyk wizerunkowych.
- **Produkt gotowy do skalowania** — harmonogram: wideo, inne sygnały, analityka post-show, eksport na rynki zagraniczne.

## Cele i Metryki Sukcesu (MVP Plus)

- Stabilność systemu przez 90+ minut koncertu.
- [Engagement score](../00-start-here/glossary.md#engagement-score) koreluje z obserwowaną energią (ocena TINAP).
- Prognoza [curfew](../00-start-here/glossary.md#curfew) z dokładnością ±2 minuty.
- Rekomendacje "mają sens" wg showcallera.
- Panel czytelny w backstage (ciemno, stres, tablet).
- Reconnect WebSocket < 10 sekund.

## Out-of-Scope (Czego NIE robimy w MVP Plus)

- **Wariant C**: tryb hybrydowy (edge/offline), observability, role użytkowników, hardening bezpieczeństwa, pilotaż onsite + runbook.
- **Moduł wideo** (bez rozpoznawania twarzy).
- **Integracje z narzędziami produkcyjnymi** (import setlisty z formatu klienta).
- **Tryb multi-venue / multi-tour** (panel administracyjny).
- **On-site support** na wybranych datach.
- **Strategia go-to-market**.
- **Rozpoznawanie twarzy, identyfikacja osób, analiza emocji jednostek.**
- **Pełna automatyzacja koncertu, sterowanie oświetleniem/pirotechniką.**
