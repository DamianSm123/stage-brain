# StageBrain — Plan UI: Specyfikacja, Wireframe'y i Sesje Implementacji

> **Data**: 2026-02-20
> **Status**: Do zatwierdzenia
> **Decyzja layoutowa**: Option A — Command Center (3 kolumny)
> **Dokumenty zrodlowe**:
> - `.claude/projekt/DOMENY_PYTANIA.md` — wiedza domenowa (odpowiedzi)
> - `.claude/projekt/StageBrain_Dokumentacja_Kompletna.md` — dokumentacja projektowa
> - `ai/StageBrain_Architektura_i_Plan.md` — architektura i stack
> - `ai/StageBrain_Strategia_Pracy_z_AI.md` — oryginalny plan sesji (do rewizji)

---

## 1. Twarde wymagania UI — wyekstrahowane z wiedzy domenowej

Ponizsze wymagania wynikaja z odpowiedzi w `DOMENY_PYTANIA.md` i sa **niepodwazalne** — definiuja srodowisko pracy showcallera.

### 1.1 Srodowisko pracy

| Wymaganie | Zrodlo | Konsekwencja dla UI |
|-----------|--------|---------------------|
| Backstage jest ciemny | DOMENY sekcja 9 | **Wylacznie dark mode**, zero opcji jasnego |
| Odleglosc od ekranu: 40-80 cm | DOMENY sekcja 9 | Font bazowy min 18-20px, kluczowe liczby 32-48px |
| Urzadzenie: tablet (iPad Pro 12.9") lub laptop | DOMENY sekcja 9 | Target: 1366x1024 landscape, responsive |
| Interakcja jednorekzna | DOMENY sekcja 9 | Touch-first, min 44x44px touch targets |
| Showcaller ma radio w drugiej rece | DOMENY sekcja 1 | Jedno tapniecie = jedna akcja |
| Okno decyzyjne: 30-90 sekund | DOMENY sekcja 1 | Informacja proaktywna, nie na zadanie |
| Srodowisko glosne | DOMENY sekcja 1 | Brak alertow dzwiekowych, tylko wizualne |
| Showcaller patrzy katem oka | DOMENY sekcja 9 | Duze bloki, nie gesty dashboard |
| Jeden operator, jeden panel | DOMENY sekcja 9 | Zero komplikacji z uprawnieniami w MVP |

### 1.2 Informacje ALWAYS VISIBLE (bez interakcji)

Showcaller musi widziec te 7 elementow **zawsze**, bez tapania:

| # | Element | Wizualizacja | Rozmiar | Priorytet |
|---|---------|-------------|---------|-----------|
| 1 | Aktualny utwor | Nazwa + wariant (full/short) + progress bar | Duzy blok | WYSOKI |
| 2 | Nastepny utwor | Nazwa + wariant | Mniejszy, pod aktualnym | SREDNI |
| 3 | Zegar absolutny | hh:mm:ss | 24-32px | WYSOKI |
| 4 | Czas do curfew | Odliczanie -hh:mm:ss | 32-48px, **NAJWIEKSZY** | KRYTYCZNY |
| 5 | Delta opoznienia | +2:40 (czerwony) / -0:30 (zielony) | 24-32px, kolorowy | WYSOKI |
| 6 | Engagement score | Pasek + kolor + strzalka trendu | Wizualny, nie liczba | SREDNI |
| 7 | Status systemu | Zielona/czerwona kropka | Mala ikona w rogu | NISKI |

### 1.3 Informacje ON DEMAND (po tapnieciu)

| # | Element | Jak wywolywany | Forma |
|---|---------|---------------|-------|
| 1 | Scenariusze odzysku czasu | Tap na delta lub przycisk | Lista: akcja + oszczednosc + ryzyko + wplyw |
| 2 | Rekomendacje nastepnego segmentu | Widoczne w prawej kolumnie | Top 1 (duza karta) + 2-3 alternatywy |
| 3 | Szczegoly utworu | Tap na segment w liscie | Metadane, flagi, ikona klodki |
| 4 | Pelna setlista z edycja | Tap na sekcje segments | Drag & drop reorder |
| 5 | Historia decyzji / log | Tap na log | Timeline decyzji |
| 6 | Szczegoly engagement | Tap na gauge | Rozbudowany wykres |

### 1.4 Rekomendacje — zasady wyswietlania

Z DOMENY sekcja 8:

- **Top 1 rekomendacja** — duza karta, latwa do tapniecia
- **2-3 alternatywy** — mniejsze karty pod spodem
- **Nigdy wiecej niz 4-5 opcji** — paraliz decyzyjny pod stresem
- **Nie procent pewnosci** — zamiast tego: poziom ryzyka (niskie/srednie/wysokie) kolorem
- **Uzasadnienie**: 3-5 slow (np. "sprawdzony banger", "wymaga przebudowy")
- **Elementy locked** (klodka): nigdy nie sugerowane do pominiecia
- **Brak dobrej opcji**: komunikat "Brak opcji bez wysokiego ryzyka" + sugestia eskalacji

### 1.5 Scenariusze odzysku czasu — zasady wyswietlania

Z DOMENY sekcja 8:

- Kazdy scenariusz pokazuje: **akcje** + **oszczednosc czasu** + **czy wystarczy** + **ryzyko** + **wplyw na dramaturgie**
- **Scenariusze zlozone**: kombinacja kilku zmian (np. "Skroc #3 + pomin interlude = -5:10")
- Przycisk "Zastosuj" przy kazdym scenariuszu

### 1.6 Manualne tagi

Z DOMENY sekcja 9:

- **6-8 predefiniowanych tagow** jako duze przyciski (min 44x44px)
- **Jedno tapniecie** = tag dodany z timestampem
- Predefiniowane: Peak moment, Low energy, Tech issue, Artysta improwizuje, Swietna reakcja, Przebudowa trwa, Custom
- Opcjonalnie: krotka notatka tekstowa (3-5 slow)
- **Nie glos** — backstage za glosny

### 1.7 Elementy zablokowane (locked)

Z DOMENY sekcja 2 i 8:

- Utwory z flaga `locked: true` / `skippable: false` maja **ikone klodki** w UI
- Dotyczy: kontraktowe hity, pirotechnika zaladowana, elementy sponsorskie, krytyczne timecode
- System **nigdy** nie sugeruje ich pominiecia w rekomendacjach ani scenariuszach odzysku

### 1.8 Typy elementow setlisty

Z DOMENY sekcja 2:

- `song` — utwor muzyczny (wiekszosc elementow)
- `intro` — otwiera show lub segment
- `outro` — zamyka show
- `interlude` — przerwa artystyczna/techniczna miedzy segmentami

Kazdy typ powinien byc wizualnie rozrozniony w UI (ikona lub kolor).

---

## 2. Wireframe'y — 3 ekrany

### 2.1 Panel Live — Command Center (Option A)

Target: tablet landscape 1366x1024 (iPad Pro 12.9")
Layout: 3 kolumny — Segments (lewo) | Now Playing + Tags (srodek) | Recommendations + Recovery (prawo)
Top bar: status + zegar + curfew + delta

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              TOP BAR (always visible)                        │
│  StageBrain   [●]          22:47:33          CURFEW  -01:12:27   Δ +2:40   │
│              status        zegar abs.        odliczanie           delta      │
│              (zielona      (24-32px)         (32-48px,            (+czerwony │
│               kropka)                         NAJWIEKSZY)         -zielony)  │
├────────────┬──────────────────────────────────────┬──────────────────────────┤
│ KOLUMNA 1  │ KOLUMNA 2                            │ KOLUMNA 3               │
│ ~200px     │ ~flex (reszta)                       │ ~280px                  │
│ SEGMENTS   │ CENTRUM DOWODZENIA                   │ WSPARCIE DECYZYJNE      │
│            │                                      │                          │
│            │  ┌────────────────────────────────┐  │                          │
│  Scrollable│  │  ▶ NOW PLAYING                 │  │  RECOMMENDED NEXT        │
│  lista     │  │                                │  │                          │
│            │  │  Candy                         │  │  ┌──────────────────┐   │
│  1. ✓ Intro│  │  wariant: full                 │  │  │  #1 Bubbletea    │   │
│     1:30   │  │                                │  │  │  Risk: LOW       │   │
│            │  │  ████████████████░░░░░  2:40   │  │  │  "energy match"  │   │
│  2. ✓ Tatuaz  │  ─────────────────── / 3:20   │  │  │                  │   │
│     3:30   │  │                                │  │  │  [ ACCEPT  ]     │   │
│            │  │  NEXT: Bubbletea (full) 3:00   │  │  └──────────────────┘   │
│  3. ▶ Candy│  └────────────────────────────────┘  │                          │
│     3:20   │                                      │  #2 Jesien    Risk: MED │
│            │  ┌────────────────────────────────┐  │  "ballad contrast"       │
│  4.  Bubble│  │  ENGAGEMENT                    │  │                          │
│     3:00   │  │  ████████████████░░░░  78      │  │  #3 Szubiepp  Risk: HI  │
│            │  │  trend: ↗ rising               │  │  "requires pyro"         │
│  5.  Jesien│  └────────────────────────────────┘  │                          │
│     4:00   │                                      │  ─────────────────────── │
│            │  QUICK TAGS                          │                          │
│  6. 🔒 Szubi│                                     │  RECOVERY SCENARIOS      │
│     3:15   │  ┌──────┐ ┌──────────┐ ┌──────┐    │  (widoczne gdy delta > 0) │
│            │  │Peak ⚡│ │Low ener ↓│ │Tech ⚠│    │                          │
│ ────────── │  └──────┘ └──────────┘ └──────┘    │  Skip Jesien             │
│            │  ┌──────┐ ┌──────────┐ ┌──────┐    │  → save 4:00  Risk: MED  │
│ [ START ]  │  │Improv│ │ Great! ★ │ │ +Tag │    │                          │
│ [  END  ]  │  └──────┘ └──────────┘ └──────┘    │  Short Bubbletea         │
│ [ SKIP  ]  │                                      │  → save 0:50  Risk: LOW  │
│            │                                      │                          │
│            │                                      │  Combo (oba powyzsze)    │
│            │                                      │  → save 4:50             │
│            │                                      │  [ ZASTOSUJ ]            │
└────────────┴──────────────────────────────────────┴──────────────────────────┘

KOLORY STATUSOWE:
  Zielony (#22c55e)  — on time, niskie ryzyko, completed
  Zolty   (#eab308)  — uwaga, srednie ryzyko, delta 1-5 min
  Czerwony(#ef4444)  — problem, wysokie ryzyko, delta > 5 min
  Niebieski(#3b82f6) — aktywny segment, info neutralne
  Szary   (#6b7280)  — planned, nieaktywne
```

#### Zachowania interaktywne Panel Live:

| Interakcja | Efekt |
|------------|-------|
| Tap na segment w liscie | Rozwija szczegoly: metadane, warianty, flagi, czas |
| Tap na "ACCEPT" rekomendacji | Segment staje sie nastepny w kolejce, feedback wizualny |
| Tap na tag | Tag dodany z timestampem, przycisk flashuje na 0.5s |
| Tap na "+ Tag" | Otwiera mini-input na custom tag (3-5 slow) |
| Tap na "ZASTOSUJ" scenariusz | Modyfikuje setliste wg scenariusza, potwierdza dialog |
| Tap na START | Startuje nastepny segment, zmienia status na active |
| Tap na END | Konczy biezacy segment, zmienia status na completed |
| Tap na SKIP | Pomija nastepny segment, zmienia status na skipped |
| Tap na engagement gauge | Rozwija rozbudowany wykres energii (overlay/modal) |

#### Stany specjalne Panel Live:

| Stan | Zachowanie UI |
|------|--------------|
| Delta = 0 (on time) | Delta zielona, sekcja Recovery ukryta |
| Delta > 0 < 5 min | Delta zolta, Recovery widoczne z opcjami |
| Delta > 5 min | Delta czerwona, pulsuje, Recovery prominentne |
| Delta > 10 min | Caly top bar pulsuje czerwono, Recovery na pelnym ekranie |
| Engagement spada 3+ okna | Recommendations pulsuja, visual cue "rozwaz zmiane" |
| Audio disconnected | Status czerwony, badge "OFFLINE", ostatni znany stan |
| Brak rekomendacji | Komunikat "Brak opcji bez ryzyka" + sugestia eskalacji |

---

### 2.2 Setup (Pre-show)

Target: ta sama rozdzielczosc, ale uzycie spokojniejsze (nie pod presja czasu)
Layout: single column / card-based wizard

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  StageBrain — Setup                                              [●] Online │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  KROK 1/4 ─── KROK 2/4 ─── KROK 3/4 ─── KROK 4/4                          │
│  Show info     Venue        Setlista      Podsumowanie                       │
│  ●────────────○────────────○────────────○                                    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  KROK 1: INFORMACJE O SHOW                                           │  │
│  │                                                                       │  │
│  │  Nazwa show:    [ Quebonafide — Warszawa 15.05.2026        ]         │  │
│  │  Data:          [ 2026-05-15 ]                                       │  │
│  │  Planowany start: [ 20:00 ]                                          │  │
│  │  Curfew:        [ 23:00 ]                                            │  │
│  │                                                                       │  │
│  │                                                    [ DALEJ → ]        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────   │
│  OSTATNIE SHOW:                                                              │
│  ┌──────────────────────────────┐ ┌──────────────────────────────┐          │
│  │ Quebonafide — Gdansk         │ │ Mata — Krakow                │          │
│  │ 10.05.2026 | Ended          │ │ 03.05.2026 | Ended           │          │
│  │ [ KLONUJ → ]                │ │ [ KLONUJ → ]                 │          │
│  └──────────────────────────────┘ └──────────────────────────────┘          │
└──────────────────────────────────────────────────────────────────────────────┘
```

```
KROK 2: VENUE + KALIBRACJA

┌────────────────────────────────────────────────────────────────────────┐
│  Venue:         [ Teatr Wielki — Warszawa          ▼ ] [ + Nowy ]    │
│  Typ obiektu:   [ Hala ▼ ]     Pojemnosc: [ 3000 ]                  │
│                                                                       │
│  KALIBRACJA                                                          │
│  Preset:  [ Hip-hop / Hala 3000-8000 ▼ ]                            │
│                                                                       │
│  Energy baseline:    ████████░░░░░░░░  0.45                         │
│  Sensitivity:        ██████████░░░░░░  0.65                         │
│  Noise floor:        ██░░░░░░░░░░░░░░  0.15                         │
│                                                                       │
│                                    [ ← WSTECZ ]  [ DALEJ → ]        │
└────────────────────────────────────────────────────────────────────────┘
```

```
KROK 3: SETLISTA

┌────────────────────────────────────────────────────────────────────────┐
│  Setlista: [ Quebonafide — Full Set ▼ ]   [ IMPORT CSV ]  [ + Nowa ]│
│                                                                       │
│  Laczny czas: 17:05   |   Segmentow: 5   |   Z wariantami: 4       │
│                                                                       │
│  ┌────┬───────────┬────────┬─────────┬──────┬────────┬─────────────┐ │
│  │ #  │ Nazwa     │ Typ    │ Full    │Short │ BPM   │ Flagi       │ │
│  ├────┼───────────┼────────┼─────────┼──────┼────────┼─────────────┤ │
│  │ ≡1 │ Tatuaz    │ song   │ 3:30    │2:45  │ 90    │ skippable   │ │
│  │ ≡2 │ Candy     │ song   │ 3:20    │2:30  │ 110   │             │ │
│  │ ≡3 │ Bubbletea │ song   │ 3:00    │ —    │ 100   │             │ │
│  │ ≡4 │ Jesien    │ song   │ 4:00    │3:00  │ 75    │ skippable   │ │
│  │ ≡5 │ Szubiepp  │ song   │ 3:15    │ —    │ 130   │ 🔒 locked   │ │
│  └────┴───────────┴────────┴─────────┴──────┴────────┴─────────────┘ │
│  ≡ = drag & drop handle                                              │
│                                                                       │
│  Tap na wiersz → edycja inline: nazwa, czasy, warianty, flagi       │
│                                                                       │
│                                    [ ← WSTECZ ]  [ DALEJ → ]        │
└────────────────────────────────────────────────────────────────────────┘
```

```
KROK 4: PODSUMOWANIE

┌────────────────────────────────────────────────────────────────────────┐
│  Show:      Quebonafide — Warszawa 15.05.2026                        │
│  Venue:     Teatr Wielki (hala, 3000 osob)                           │
│  Start:     20:00                                                     │
│  Curfew:    23:00  (3h show, bufor: ~2h 43min setlista)             │
│  Setlista:  Quebonafide — Full Set (5 segmentow, 17:05)             │
│  Kalibracja: Hip-hop / Hala 3000-8000                                │
│                                                                       │
│                       [ ← WSTECZ ]                                   │
│                                                                       │
│              ┌─────────────────────────────────────┐                 │
│              │                                     │                 │
│              │         🟢  START SHOW              │                 │
│              │                                     │                 │
│              └─────────────────────────────────────┘                 │
│              Duzy przycisk, min 60px wysokosci                       │
│              Po kliknieciu → redirect do /live                       │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2.3 Post-show

Target: uzywane po koncercie, spokojne srodowisko, moze byc na laptopie
Layout: dashboard analityczny, wiecej danych niz w live

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  StageBrain — Post-show Analysis                                             │
│  Quebonafide — Warszawa 15.05.2026 | Teatr Wielki | 20:02 – 22:48          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PODSUMOWANIE                                                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│  │ Czas trwania │ │ Avg Engage.  │ │ Delta        │ │ Decyzje      │       │
│  │   2h 46min   │ │     72       │ │  +3:20       │ │   4 zmiany   │       │
│  │  (plan: 2h43)│ │  (max: 94)   │ │  (za planem) │ │   2 skipy    │       │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                                              │
│  ENGAGEMENT TIMELINE                                                         │
│  100 ┤                                                                       │
│   80 ┤      ██                    ████                                       │
│   60 ┤  ████  ████            ████    ██              ████████              │
│   40 ┤            ████    ████            ████    ████                       │
│   20 ┤                ████                    ████                           │
│    0 ┤──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──                  │
│       Intro Tatuaz  Candy  Bubble  Jesien    Szubiepp                       │
│                                                                              │
│       ▲ Peak moment (tag)    ▼ Low energy (tag)    ⚠ Tech issue (tag)      │
│                                                                              │
│  TABELA SEGMENTOW                                                            │
│  ┌────┬───────────┬──────────┬──────────┬────────┬──────────┬──────────┐    │
│  │ #  │ Nazwa     │ Plan     │ Faktyczny│ Delta  │ Wariant  │ Avg Eng. │    │
│  ├────┼───────────┼──────────┼──────────┼────────┼──────────┼──────────┤    │
│  │ 1  │ Tatuaz    │ 3:30     │ 3:42     │ +0:12  │ full     │ 65       │    │
│  │ 2  │ Candy     │ 3:20     │ 3:20     │  0:00  │ full     │ 78       │    │
│  │ 3  │ Bubbletea │ 3:00     │ 3:15     │ +0:15  │ full     │ 71       │    │
│  │ 4  │ Jesien    │ 4:00     │ SKIPPED  │ -4:00  │ —        │ —        │    │
│  │ 5  │ Szubiepp  │ 3:15     │ 3:25     │ +0:10  │ full     │ 94       │    │
│  └────┴───────────┴──────────┴──────────┴────────┴──────────┴──────────┘    │
│                                                                              │
│  DECYZJE OPERATORA                                                           │
│  22:15 — Rekomendacja: skip Jesien (accepted) — powod: delta +3:20          │
│  22:30 — Tag: "Peak moment" — podczas Szubiepp                              │
│                                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐                │
│  │ Export CSV    │ │ Export JSON  │ │ Generuj raport PDF   │                │
│  └──────────────┘ └──────────────┘ └──────────────────────┘                │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Zrewidowany plan sesji — UI-first

### Zmiana podejscia wzgledem oryginalnego planu

**Oryginalny plan** (`ai/StageBrain_Strategia_Pracy_z_AI.md`):
Sesje 5-7 buduja CRUD backend + API, dopiero sesje 10-16 robia UI.

**Problem**: Klient nie zobaczy nic wizualnego az do sesji 10. To za pozno.

**Nowe podejscie**: Frontend z mock data NAJPIERW, backend API POTEM.
Mock data = hardcoded JSON w Zustand store, identyczna struktura jak przyszle API responses.
Gdy backend API bedzie gotowe — podmieniamy mock na fetch. Zero przerobek komponentow.

### Warunek wstepny: merge branchy

Przed rozpoczeciem sesji UI:
1. Zmergowac `feat/react-boilerplate-shadcn` do `chore/backend-infra-db-schema`
2. Lub zmergowac oba do `main`
3. Stworzyc nowy branch `feat/ui-live-panel` od zmerge'owanego stanu

### Plan sesji UI

#### Sesja UI-0: Przygotowanie mock data + doinstalowanie komponentow shadcn
**Typ**: F | **Czas**: ~45min

**Scope**:
- Doinstalowac potrzebne komponenty shadcn/ui: `Progress`, `Slider`, `Select`, `Dialog`, `Tabs`, `Tooltip`, `ScrollArea`, `Table`, `DropdownMenu`
- Stworzyc plik `src/lib/mock-data.ts` z przykladowymi danymi (Quebonafide, Teatr Wielki, 5 segmentow z seed backendu)
- Stworzyc TypeScript types w `src/types/` dla: Show, Venue, Segment, SegmentVariant, EngagementMetric, OperatorTag, Recommendation, RecoveryScenario
- Stworzyc Zustand store: `showStore.ts` (stan show, aktualny segment, timeline)

**Output**: Typy i dane gotowe, shadcn komponenty zainstalowane.

---

#### Sesja UI-1a: Panel Live — Top Bar (always visible)
**Typ**: F | **Czas**: ~1.5h

**Scope**:
- Top bar z 5 elementami: status, zegar absolutny, curfew countdown, delta, logo
- Komponent `ShowClock` — aktualny czas, aktualizacja co sekunde
- Komponent `CurfewCountdown` — odliczanie do curfew, 32-48px, kolorowane wg progow
- Komponent `TimeDelta` — +/-mm:ss, zielony/zolty/czerwony wg progow (0-2min/2-5min/5+min)
- Komponent `SystemStatus` — zielona/czerwona kropka
- Layout 3-kolumnowy (grid) z proporcjami ~200px | flex | ~280px

**Progi kolorow delta**:
- Delta <= 0 (on time lub ahead): zielony
- Delta 1-300s (1-5 min behind): zolty
- Delta > 300s (5+ min behind): czerwony, pulsuje

**Output**: Top bar dziala z mock data, odlicza czas, zmienia kolory.

**Weryfikacja**:
```
Zegar pokazuje aktualny czas
Curfew odlicza do ustawionej godziny
Delta zmienia kolor przy rroznych wartosciach
```

---

#### Sesja UI-1b: Panel Live — Kolumna srodkowa (Now Playing + Engagement)
**Typ**: F | **Czas**: ~1.5h

**Scope**:
- Komponent `NowPlaying` — nazwa segmentu, wariant (badge full/short), progress bar z czasem
- Komponent `NextSegment` — mniejszy, pod NowPlaying, nazwa + wariant nastepnego
- Komponent `EngagementGauge` — pasek (nie okrag), 0-100, kolor wg poziomu, strzalka trendu (↑ ↗ → ↘ ↓)
- Progress bar segmentu — animowany, pokazuje elapsed / total czas
- Logika: engagement gauge zmienia kolor: 0-30 czerwony, 30-60 zolty, 60-100 zielony

**Output**: Srodkowa kolumna pokazuje aktualny stan show z mock data.

---

#### Sesja UI-1c: Panel Live — Kolumna lewa (Segments Timeline)
**Typ**: F | **Czas**: ~1.5h

**Scope**:
- Komponent `SegmentTimeline` — scrollowalna lista segmentow
- Kazdy segment: numer, nazwa, czas (full), status badge
- Statusy wizualne: planned (szary), active (niebieski highlight), completed (zielony checkmark), skipped (przekreslony, przyciszony)
- Ikona klodki przy locked segmentach
- Ikony typow: song (nuta), intro (strzalka), outro (stop), interlude (pauza)
- Przyciski na dole: [START] [END] [SKIP] — duze, min 44px, kolorowe
- START = zielony, END = niebieski, SKIP = szary/czerwony

**Interakcja**:
- Tap na segment → rozwija szczegoly (warianty, BPM, gatunek, flagi, notatki)
- START → nastepny planned segment staje sie active
- END → aktualny active staje sie completed
- SKIP → nastepny planned staje sie skipped

**Output**: Lista segmentow z interakcja, zmiana stanow dziala na mock data.

---

#### Sesja UI-1d: Panel Live — Quick Tags
**Typ**: F | **Czas**: ~45min

**Scope**:
- Komponent `QuickTags` — 6 predefiniowanych przyciskow + 1 custom
- Przyciski: Peak ⚡ | Low energy ↓ | Tech issue ⚠ | Improv 🎤 | Great! ★ | Przebudowa 🔧
- Przycisk "+ Tag" → otwiera mini-dialog z inputem (max 30 znakow)
- Po tapnieciu: przycisk flashuje (0.5s feedback), tag zapisywany w store z timestampem
- Grid 2 wiersze x 3 kolumny + 1 przycisk custom

**Output**: Tagi dodawane jednym tapnieciem, widoczne w konsoli/store.

---

#### Sesja UI-1e: Panel Live — Kolumna prawa (Recommendations + Recovery)
**Typ**: F | **Czas**: ~2h

**Scope**:
- Komponent `RecommendationCard` — duza karta top rekomendacji:
  - Nazwa segmentu
  - Badge ryzyka: LOW (zielony) / MED (zolty) / HIGH (czerwony)
  - Uzasadnienie (3-5 slow)
  - Przycisk [ACCEPT] (duzy, 44px+)
- Komponent `RecommendationAlt` — mniejsze karty alternatyw (2-3)
- Komponent `RecoveryScenarios` — lista scenariuszy odzysku:
  - Kazdy: opis akcji + oszczednosc czasu + badge ryzyka
  - Scenariusze zlozone (combo) wyroznionym stylem
  - Przycisk [ZASTOSUJ] przy kazdym
- Logika widocznosci: Recovery widoczne tylko gdy delta > 0
- Stan "brak rekomendacji": komunikat + sugestia eskalacji

**Output**: Prawa kolumna z rekomendacjami i scenariuszami, interaktywna.

---

#### Sesja UI-1f: Panel Live — integracja i polish
**Typ**: F | **Czas**: ~1h

**Scope**:
- Polaczenie wszystkich komponentow w finalny layout `/live`
- Stany specjalne: pulsowanie przy duzym opoznieniu, "OFFLINE" badge
- Responsywnosc: tablet landscape + laptop (min-width: 1024px)
- Sprawdzenie touch targets (wszystkie >= 44px)
- Sprawdzenie typografii (font bazowy >= 18px, kluczowe >= 32px)
- Sprawdzenie kontrastow kolorow na ciemnym tle
- Animacje: progress bar segmentu, trend engagement, flash tagow

**Output**: Panel Live kompletny, gotowy do demo klientowi.

**Weryfikacja**:
```
Tablet view (Chrome DevTools, iPad Pro) → layout poprawny
Wszystkie elementy always-on widoczne bez scrollowania
Tap na tag → feedback wizualny
Zmiana stanow segmentow → aktualizacja UI
Kolory delta zmieniaja sie wg progow
```

---

#### Sesja UI-2a: Setup — wizard flow (krok 1-2)
**Typ**: F | **Czas**: ~1.5h

**Scope**:
- Step indicator (4 kroki)
- Krok 1: Show info — nazwa, data, start, curfew (formularze shadcn)
- Krok 2: Venue + kalibracja — dropdown venue, preset, sliders
- Lista "ostatnie show" z przyciskiem "Klonuj"
- Nawigacja: Dalej / Wstecz

---

#### Sesja UI-2b: Setup — setlista (krok 3)
**Typ**: F | **Czas**: ~2h

**Scope**:
- Tabela segmentow (TanStack Table lub prostsza implementacja)
- Kolumny: drag handle, #, nazwa, typ, czas full, czas short, BPM, flagi
- Edycja inline po tapnieciu na wiersz
- Drag & drop reorder (dnd-kit)
- Import CSV: upload → preview → confirm (moze byc uproszczony na start)
- Krok 4: Podsumowanie + przycisk START SHOW

---

#### Sesja UI-3: Post-show dashboard
**Typ**: F | **Czas**: ~2h

**Scope**:
- Karty podsumowania (czas, avg engagement, delta, decyzje)
- Engagement timeline chart (Recharts — line chart, kolorowany per segment)
- Tagi operatora zaznaczone na wykresie
- Tabela segmentow z wynikami (plan vs fakt, delta, wariant, avg engagement)
- Lista decyzji operatora
- Przyciski eksportu (na razie placeholder — backend jeszcze nie gotowy)

---

### Podsumowanie sesji UI

| Sesja | Czas | Co powstaje | Kumulatywny rezultat |
|-------|------|-------------|---------------------|
| UI-0 | 45min | Mock data, typy, shadcn components | Fundament gotowy |
| UI-1a | 1.5h | Top bar (zegar, curfew, delta) | Top bar zyje |
| UI-1b | 1.5h | Now Playing + Engagement | Srodek zyje |
| UI-1c | 1.5h | Segments Timeline + Start/End/Skip | Lewa kolumna zyje |
| UI-1d | 45min | Quick Tags | Tagi dzialaja |
| UI-1e | 2h | Recommendations + Recovery | Prawa kolumna zyje |
| UI-1f | 1h | Integracja + polish | **PANEL LIVE GOTOWY DO DEMO** |
| UI-2a | 1.5h | Setup wizard krok 1-2 | Setup zyje |
| UI-2b | 2h | Setup setlista krok 3-4 | **SETUP GOTOWY** |
| UI-3 | 2h | Post-show dashboard | **POST-SHOW GOTOWY** |
| **SUMA** | **~14.5h** | **3 ekrany z mock data** | **Demo dla klienta** |

### Po zakonczeniu sesji UI — co dalej

Po zbudowaniu UI z mock data, wracamy do backendu:
1. Backend API (CRUD: venues, shows, setlists, segments) — sesje 5-7 z oryginalnego planu
2. Podlaczenie frontendu do API (zamiana mock → fetch) — nowa sesja
3. Audio pipeline (sesje 8-10 z oryginalnego planu)
4. Podlaczenie WebSocket do Panel Live — nowa sesja
5. Kontynuacja wg oryginalnego planu (sesje 11-18) z adaptacjami

---

## 4. Mock data — struktura

Dane do mockowania oparte na seed z backendu (Quebonafide, Teatr Wielki, 5 segmentow):

```typescript
// src/types/domain.ts — typy dopasowane do przyszlych Pydantic schemas

interface Show {
  id: string
  name: string
  status: 'setup' | 'live' | 'paused' | 'ended'
  scheduled_start: string  // ISO datetime
  curfew: string           // ISO datetime
  actual_start?: string
  venue: Venue
  setlist: Setlist
}

interface Venue {
  id: string
  name: string
  type: 'hall' | 'stadium' | 'club' | 'open_air'
  capacity: number
  city: string
}

interface Setlist {
  id: string
  name: string
  segments: Segment[]
  total_planned_duration_seconds: number
}

interface Segment {
  id: string
  name: string
  position: number
  type: 'song' | 'intro' | 'outro' | 'interlude'
  bpm?: number
  genre?: string
  expected_energy: number  // 0-1
  is_locked: boolean
  is_skippable: boolean
  has_pyro: boolean
  notes?: string
  variants: SegmentVariant[]
}

interface SegmentVariant {
  id: string
  variant_type: 'full' | 'short' | 'extended' | 'acoustic'
  duration_seconds: number
}

type SegmentStatus = 'planned' | 'active' | 'completed' | 'skipped'

interface TimelineEntry {
  segment_id: string
  status: SegmentStatus
  variant_used?: string
  started_at?: string
  ended_at?: string
  planned_duration_seconds: number
  actual_duration_seconds?: number
  delta_seconds?: number
}

interface EngagementMetric {
  timestamp: string
  score: number          // 0-100
  trend: 'rising' | 'stable' | 'falling'
  event_type?: string    // 'applause' | 'cheering' | 'silence' | ...
}

interface Recommendation {
  segment_id: string
  segment_name: string
  risk: 'low' | 'medium' | 'high'
  reason: string         // 3-5 slow
  expected_engagement_delta: number
}

interface RecoveryScenario {
  id: string
  description: string    // "Skip Jesien"
  time_saved_seconds: number
  risk: 'low' | 'medium' | 'high'
  impact: string         // "usuwa ballad contrast"
  is_compound: boolean   // scenariusz zlozony?
  actions: string[]      // lista akcji w combo
}

interface OperatorTag {
  id: string
  tag: string
  custom_text?: string
  timestamp: string
}
```

---

## 5. Roznice wzgledem oryginalnego planu sesji

| Oryginalny plan (Strategia_Pracy_z_AI.md) | Nowy plan (ten dokument) |
|-------------------------------------------|--------------------------|
| Sesja 5-7: Backend CRUD najpierw | Odlozone — UI first |
| Sesja 10: Panel Live v1 (gauge, trend) | Rozbite na UI-1a do UI-1f (6 krokow) |
| Brak mock data | UI-0: mock data + typy |
| UI budowane po backendzie | UI budowane PRZED backendem |
| Sesja 10 nie uwzglednia wymagan z DOMENY | Nowy plan oparty na DOMENY_PYTANIA.md |
| Brak wireframe'ow | Wireframe'y w tym dokumencie |
| Sesje 11-12 (timeline, czas) jako osobne | Wbudowane w UI-1a (top bar) i UI-1c (segments) |
| Sesja 14 (rekomendacje) osobno | UI-1e: rekomendacje + recovery razem |
| Sesja 16 (post-show) | UI-3: post-show |
| Setup rozlozony na sesje 5-7 | UI-2a + UI-2b: setup kompletny |

Sesje backendowe (5-7, 8-9) realizowane **po** sesjach UI, z adaptacjami pod gotowy frontend.
Sesje 11-16 z oryginalnego planu beda wymagaly rewizji — czesc pracy UI juz zrobiona.

---

## 6. Otwarte pytania do decyzji

| # | Pytanie | Wplyw | Rekomendacja |
|---|---------|-------|-------------|
| 1 | Alerty/powiadomienia: jakie? | Wizualne pulsowanie? Zmiana koloru top bar? | Pulsowanie delta + top bar przy duzym opoznieniu |
| 2 | Hierarchia setlisty: segmenty (bloki) vs utwory? | Model danych ma Segment → Variant, DOMENY mowi o Setlist → Segment → Song | W MVP traktujemy Segment = Song (obecny model). Hierarchia bloków na potem |
| 3 | Engagement gauge: pasek czy arc? | Styl wizualny | Pasek (prostszy, czytelniejszy, mniej miejsca) |
| 4 | Drag & drop w setup: dnd-kit czy natywny HTML5? | Zaleznosc npm | dnd-kit (lepsza obsluga touch, a11y) |
| 5 | Recharts vs visx w post-show? | Zlozonosc | Recharts (prostszy API, wystarczajacy) |
