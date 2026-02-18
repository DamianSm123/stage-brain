# Persony Użytkowników

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Deweloper / AI

---

## 1. [Showcaller / Reżyser / Producent](../00-start-here/glossary.md#showcaller--reżyser--producent)

- **Rola**: Główny użytkownik systemu. Osoba podejmująca decyzje w czasie rzeczywistym podczas koncertu — zarządza przebiegiem show, kolejnością segmentów, reaguje na opóźnienia i energię publiczności.
- **Cele**: Mieć dane do szybkiej decyzji (nie tylko intuicję), kontrolować czas do curfew, nie zgubić energii publiczności.
- **Pain Points**: Decyzje oparte wyłącznie na komunikacji radiowej, brak obiektywnych wskaźników energii, kumulujące się opóźnienia, presja finansowa (kary za curfew).
- **Kontekst pracy**: Backstage, ciemno, głośno, stres, rękawiczki. Komunikacja przez radio. Dostęp do tabletu/laptopa na stanowisku.
- **Relacja z systemem**: StageBrain **rekomenduje** — showcaller **decyduje** ([human-in-the-loop](../00-start-here/glossary.md#human-in-the-loop)).

## 2. [Operator](../00-start-here/glossary.md#operator)

- **Rola**: Osoba obsługująca panel StageBrain podczas koncertu. W MVP to ta sama osoba co showcaller. W przyszłości może być dedykowany technik.
- **Cele**: Szybko skonfigurować system przed show (venue, setlista, kalibracja, audio test), sprawnie obsługiwać panel live (start/stop segmentów, tagi, akceptacja rekomendacji), przejrzeć dane po koncercie.
- **Pain Points**: Zbyt skomplikowany UI, za dużo kliknięć do decyzji, elementy za małe na tablecie, jasny ekran oślepiający w ciemnym backstage.
- **Kontekst pracy**: Identyczny jak showcaller — backstage, tablet, ograniczony czas na interakcję.
- **Dostęp**: Panel web (SPA) — przeglądarka na tablecie lub laptopie. Trzy tryby: pre-show setup, live panel, post-show review.

## 3. [TINAP](../00-start-here/glossary.md#tinap) (Design Partner)

- **Rola**: Inicjator projektu i design partner. Ekipa showcallingu i stage managementu (Quebonafide, Mata, Sobel).
- **Cele**: Współtworzyć narzędzie, które realnie pomoże w ich pracy. Przetestować MVP na żywym koncercie.
- **Wkład**: Źródło know-how produkcyjnego — wiedza o pracy showcallera, reżysera, producenta. Scenariusze decyzyjne z realnych koncertów. Walidacja rekomendacji ML. Feedback z pilota.
- **Relacja z systemem**: Pierwszy użytkownik, miejsce testów MVP (maj 2026).

---

## Macierz Interakcji z Systemem

| Akcja | Showcaller | Operator | TINAP |
|:---|:---:|:---:|:---:|
| Konfiguracja pre-show (venue, setlista, kalibracja) | — | ✅ | ✅ (walidacja) |
| Start / pause / end show | — | ✅ | — |
| Start / end / skip segment | ✅ (decyzja) | ✅ (wykonanie) | — |
| Przegląd rekomendacji ML | ✅ | ✅ | — |
| Accept / reject rekomendacji | ✅ (decyzja) | ✅ (wykonanie) | — |
| Dodanie tagu operatora | ✅ | ✅ | — |
| Przegląd post-show analytics | ✅ | ✅ | ✅ |
| Eksport danych / raport | — | ✅ | ✅ |
| Walidacja engagement score | — | — | ✅ |
| Feedback na rekomendacje | — | — | ✅ |

> **Uwaga MVP**: W praktyce showcaller i operator to jedna osoba. Rozdzielenie ról jest koncepcyjne — na potrzeby przyszłego systemu uprawnień (Wariant C).
