# Operator Tags (Tagi Operatora)

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Deweloper / AI

---

## Cel i Wartość

Manualne oznaczenia kontekstowe dodawane przez showcallera/operatora w trakcie koncertu. Tagi dostarczają kontekstu, którego system nie może wykryć automatycznie — "problem techniczny", "artysta mówi do publiczności", "publiczność szaleje". Służą do wzbogacenia post-show analytics i lepszego zrozumienia przebiegu show.

## Zakres (Scope)

### In
- Quick tagi: predefiniowane etykiety dostępne jednym tapem.
- Custom tagi: pole tekstowe na szybką notatkę.
- Zapis z timestampem i powiązaniem z aktualnym segmentem.
- Wyświetlanie tagów na timeline (live i post-show).

### Out
- Tagi wpływające na engagement score (na MVP nie korygują metryk).
- Tagi wpływające na rekomendacje ML (post-MVP: mogą być feature w modelu).

## Predefiniowane Quick Tagi

| Tag | Kontekst | Ikona (sugestia) |
|:---|:---|:---|
| `tech_issue` | Problem techniczny (awaria sprzętu, dźwięk, światło) | ⚠️ |
| `energy_drop` | Subiektywne odczucie spadku energii | ↓ |
| `energy_peak` | Subiektywne odczucie szczytu energii | ↑ |
| `crowd_interaction` | Artysta mówi do publiczności / interakcja | 🎤 |
| `unplanned_pause` | Nieplanowana pauza | ⏸️ |
| `weather` | Wpływ pogody (deszcz, wiatr — open air) | 🌧️ |
| `custom` | Własna notatka tekstowa | 📝 |

> Lista quick tagów jest konfigurowalna — możliwość dodania nowych w setup pre-show.

## Scenariusze

### Quick Tag
1. W trakcie show showcaller mówi: "Mamy problem z gitarą".
2. Operator tapuje quick tag `tech_issue` na panelu (1 tap).
3. System zapisuje: timestamp, segment_id, tag_type = `tech_issue`.
4. Tag pojawia się na timeline panelu live.

### Custom Tag
1. Operator tapuje "Custom tag" → otwiera się pole tekstowe.
2. Wpisuje: "Artysta poprosił o ciszę, dedykuje piosenkę".
3. System zapisuje z timestampem i segmentem.

### Przegląd Post-show
1. Na timeline post-show tagi wyświetlane jako markery.
2. Analityk widzi korelację: tag `tech_issue` o 21:15 + spadek engagement o 21:15 → problem techniczny był przyczyną spadku.

## Reguły

- Tag jest zawsze powiązany z `show_id` i `timestamp`.
- Jeśli jest aktywny segment → tag jest również powiązany z `segment_id`.
- Quick tagi wymagają jednego tapa (zero dodatkowych kroków).
- Custom tag: max 200 znaków.
- Tagi są nieusuwalne (append-only log) — dla spójności post-show analytics.
- Na panelu live wyświetlanych jest max 3-5 ostatnich tagów (nie zaśmiecają UI).

## Linki

- Powiązane: [operator-panel.md](./operator-panel.md), [post-show-analytics.md](./post-show-analytics.md)
