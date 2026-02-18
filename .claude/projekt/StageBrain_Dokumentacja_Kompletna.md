# StageBrain — Kompletna Dokumentacja Projektu

> Dokument scalony na podstawie: **Oferta współpracy CodeAgency** (11.02.2026) oraz **Stage Brain Briefing TINAP** (2026)
>
> **Realizowany wariant: B — MVP Plus (10 tygodni)**

---

## Spis treści

- [1. Kontekst projektu i strony zaangażowane](#1-kontekst-projektu-i-strony-zaangażowane)
  - [1.1 TINAP — inicjator i design partner](#11-tinap--inicjator-i-design-partner)
  - [1.2 CodeAgency — partner technologiczny](#12-codeagency--partner-technologiczny)
- [2. Cel projektu i propozycja wartości](#2-cel-projektu-i-propozycja-wartości)
  - [2.1 Cel nadrzędny](#21-cel-nadrzędny)
  - [2.2 Propozycja wartości](#22-propozycja-wartości)
  - [2.3 Czym system NIE jest](#23-czym-system-nie-jest)
- [3. Główne problemy do rozwiązania](#3-główne-problemy-do-rozwiązania)
- [4. Wybrany zakres realizacji — Wariant B (MVP Plus)](#4-wybrany-zakres-realizacji--wariant-b-mvp-plus)
  - [4.1 Co wchodzi w zakres (IN SCOPE)](#41-co-wchodzi-w-zakres-in-scope)
  - [4.2 Co NIE wchodzi w zakres (OUT OF SCOPE)](#42-co-nie-wchodzi-w-zakres-out-of-scope)
- [5. Funkcjonalności kluczowe](#5-funkcjonalności-kluczowe)
  - [5.1 Dynamiczne zarządzanie setlistą](#51-dynamiczne-zarządzanie-setlistą)
  - [5.2 Kontrola czasu i reagowanie na opóźnienia](#52-kontrola-czasu-i-reagowanie-na-opóźnienia)
  - [5.3 Panel operatora (UI)](#53-panel-operatora-ui)
  - [5.4 Logi, analityka post-show i raporty](#54-logi-analityka-post-show-i-raporty)
- [6. Dane wejściowe](#6-dane-wejściowe)
- [7. Charakter i architektura systemu](#7-charakter-i-architektura-systemu)
  - [7.1 Wymagania niefunkcjonalne](#71-wymagania-niefunkcjonalne)
  - [7.2 Proponowana architektura](#72-proponowana-architektura)
- [8. Co NIE jest celem realizacji](#8-co-nie-jest-celem-realizacji)
- [9. Plan realizacji — Wariant B (10 tygodni)](#9-plan-realizacji--wariant-b-10-tygodni)
- [10. Wycena — kontekst wariantów](#10-wycena--kontekst-wariantów)
  - [10.1 Porównanie wariantów (dla kontekstu)](#101-porównanie-wariantów-dla-kontekstu)
  - [10.2 Szacunkowe koszty infrastruktury](#102-szacunkowe-koszty-infrastruktury)
  - [10.3 Opcje dodatkowe (po MVP Plus)](#103-opcje-dodatkowe-po-mvp-plus)
- [11. Założenia i ryzyka](#11-założenia-i-ryzyka)
- [12. Warunki handlowe](#12-warunki-handlowe)
- [13. Następne kroki](#13-następne-kroki)

---

## 1. Kontekst projektu i strony zaangażowane

### 1.1 TINAP — inicjator i design partner

TINAP to jedna z najbardziej doświadczonych ekip w Polsce w obszarze **showcallingu i stage managementu** przy dużych produkcjach live. Dotychczasowe współprace obejmują m.in.:

- **Quebonafide** — *PÓŁNOC / POŁUDNIE*
- **Mata** — *MATA2040 TOUR*
- **Sobel** — *NAPISZ JAK BĘDZIESZ*
- oraz inne koncerty i wydarzenia na dużą skalę

Projekt StageBrain powstaje **z realnych problemów znanych z backstage'u** — nie jako koncept teoretyczny, ale narzędzie, z którego TINAP sam chce korzystać.

**Rola TINAP w projekcie:**

- **Design partner** — współtworzenie wymagań i walidacja rozwiązań
- **Źródło know-how produkcyjnego** — wiedza o pracy showcallera, reżysera, producenta
- **Pierwszy użytkownik i miejsce testów MVP** — realne warunki koncertowe do pilotażu

### 1.2 CodeAgency — partner technologiczny

- **Kontakt:** Piotr Waśk, CEO/Founder
- **Email:** piotr.wask@codeagency.pl
- **Telefon:** +48 517 352 715
- **Adresat oferty:** Jakub Zaradkiewicz
- **Data oferty:** 11 lutego 2026

CodeAgency odpowiada za zaprojektowanie i wdrożenie architektury technicznej MVP, realizację backendu, frontendu oraz pilotaż systemu.

---

## 2. Cel projektu i propozycja wartości

### 2.1 Cel nadrzędny

Celem StageBrain jest stworzenie **systemu wsparcia decyzyjnego w czasie rzeczywistym** dla reżysera / showcallera / producenta koncertu.

System:

- **nie zastępuje człowieka**,
- **nie podejmuje autonomicznych decyzji**,
- **nie ingeruje w bezpieczeństwo wydarzenia**,

ale:

- dostarcza dane,
- interpretuje sytuację live,
- pokazuje możliwe scenariusze działań.

StageBrain to **narzędzie decyzyjne dla ludzi**, nie „AI reżyser".

### 2.2 Propozycja wartości

- **Lepsze decyzje live** oparte o dane (a nie wyłącznie intuicję / komunikację radiową).
- **Większa kontrola nad energią show** — szybkie wykrywanie spadków i rekomendacje scenariuszy.
- **Mniejszy chaos czasowy** — stała prognoza i warianty odzyskiwania czasu.
- **Redukcja ryzyka finansowego** (kary za przekroczenie czasu) i ryzyk wizerunkowych.
- **Produkt gotowy do skalowania** — harmonogram: wideo, inne sygnały, analityka post-show, eksport na rynki zagraniczne.

### 2.3 Czym system NIE jest

- Nie jest aplikacją konsumencką — jest **narzędziem produkcyjnym**.
- Nie generuje contentu i nie ingeruje w przygotowane show.
- Operuje wyłącznie na **wcześniej przygotowanych wariantach**.
- Zasada **human-in-the-loop**: system rekomenduje, decyzję **zawsze podejmuje człowiek**.
- Zasada **fail-safe**: awaria systemu nie może blokować realizacji — koncert działa klasycznie.

---

## 3. Główne problemy do rozwiązania

| # | Problem | Opis |
|---|---------|------|
| 1 | **Brak danych do decyzji live** | Decyzje podejmowane są dziś głównie na intuicji i komunikacji radiowej. Brak obiektywnych wskaźników w czasie rzeczywistym. |
| 2 | **Spadki energii publiczności w trakcie show** | Trudne do obiektywnej oceny w czasie rzeczywistym. Brak narzędzi do szybkiego wykrywania i reagowania. |
| 3 | **Opóźnienia i chaos czasowy** | Szczególnie w drugiej połowie koncertu, przy zdarzeniach losowych. Brak prognozowania wpływu opóźnień na dalszy przebieg. |
| 4 | **Presja produkcyjna i finansowa** | Kary za przekroczenie czasu, konflikty z obiektami, napięcia artysta – produkcja. |

---

## 4. Wybrany zakres realizacji — Wariant B (MVP Plus)

Klient wybrał **Wariant B — MVP Plus** jako docelowy zakres realizacji. Poniżej jednoznaczny podział na to, co wchodzi i nie wchodzi w zakres prac.

### 4.1 Co wchodzi w zakres (IN SCOPE)

**Baza (z Wariantu A):**

- Audio publiczności + metryka energii (engagement score)
- Kontrola czasu (prognoza do curfew, scenariusze odzysku)
- Rekomendacje kolejnych utworów/segmentów (na regułach)
- Panel operatora (UI) — czytelny, odporny na stres, szybkie decyzje
- Logi przebiegu show
- Manualne tagi od showcallera

**Dodane w Wariancie B:**

- **Kalibracja per obiekt/venue** — dostosowanie wskaźników do specyfiki miejsca i gatunku
- **Lepszy ranking utworów (ML)** — model uczenia maszynowego zamiast samych reguł
- **Panel post-show** — analiza po koncercie
- **Eksport danych** — możliwość wyciągnięcia danych z systemu
- **Automatyczne raporty** — generowanie podsumowań po wydarzeniu

### 4.2 Co NIE wchodzi w zakres (OUT OF SCOPE)

**Elementy z Wariantu C (Production Track) — poza zakresem:**

- Tryb hybrydowy (edge/offline)
- Observability (zaawansowany monitoring infrastruktury)
- Role użytkowników (system uprawnień)
- Hardening bezpieczeństwa
- Pilotaż onsite + runbook

**Opcje dodatkowe (po MVP Plus) — poza zakresem:**

- Moduł wideo
- Integracje z narzędziami produkcyjnymi
- Tryb multi-venue / multi-tour
- On-site support
- Strategia go-to-market

---

## 5. Funkcjonalności kluczowe

### 5.1 Dynamiczne zarządzanie setlistą

System działa jako **wsparcie decyzyjne dla reżyserii koncertu**.

**Założenia:**

- Reżyser / produkcja wgrywa do systemu **bazę utworów (setlistę)**.
- Każdy utwór jest **wcześniej zaprogramowany przez ludzi**, m.in.:
  - światło,
  - pirotechnika,
  - timecode,
  - inne elementy sceniczne.
- System **nie generuje contentu i nie ingeruje w przygotowane show**.
- System operuje wyłącznie na **wcześniej przygotowanych wariantach** (np. full / short).

**Działanie:**

- System analizuje reakcje publiczności (w MVP głównie **audio**, w przyszłości także wideo i inne sygnały).
- Na tej podstawie:
  - **rekomenduje kolejność kolejnych utworów**,
  - **wskazuje momenty wysokiego / niskiego zaangażowania**,
  - **sugeruje alternatywne scenariusze** (np. wariant energetyczny vs uspokajający).

**Przykłady rekomendacji:**

- „Energia spada szybciej niż w poprzednich segmentach"
- „Rekomendowany utwór: X (wysoka skuteczność przy podobnych reakcjach)"
- „Rozważyć skrócony wariant kolejnego segmentu"

**Decyzja zawsze należy do showcallera / reżysera.**

### 5.2 Kontrola czasu i reagowanie na opóźnienia

Drugi fundament systemu.

**Założenia — system na bieżąco monitoruje:**

- planowaną agendę wydarzenia,
- rzeczywisty przebieg koncertu,
- wszystkie opóźnienia i odchylenia od planu.

**Działanie — w czasie rzeczywistym system pokazuje:**

- **gdzie** powstało opóźnienie,
- **jaki ma ono wpływ** na dalszą część wydarzenia,
- **ile realnie „brakuje"** do zmieszczenia się w czasie.

System nie wymusza decyzji, ale prezentuje:

- możliwe scenariusze,
- ich konsekwencje czasowe i produkcyjne.

**Przykłady:**

- „Opóźnienie: +3:20 min — przy obecnym tempie przekroczenie curfew o 5 min"
- „Możliwe scenariusze: skrócenie segmentu / zmiana kolejności / przeniesienie elementu"

**Etap opcjonalny (po MVP):**

- Automatyczne dopasowywanie kolejności segmentów w celu nadrobienia czasu **bez utraty zaangażowania publiczności**, w oparciu o dane historyczne i live.

### 5.3 Panel operatora (UI)

Panel musi być:

- **bardzo czytelny**,
- **odporny na stres**,
- **zorientowany na szybkie decyzje**.

Zawiera:

- rekomendacje (ranking kolejnych utworów / segmentów),
- status czasu (prognoza do curfew, scenariusze odzysku czasu),
- manualne tagi (szybkie oznaczenia kontekstowe od showcallera),
- historię decyzji.

### 5.4 Logi, analityka post-show i raporty

- Zapis przebiegu show i danych do iteracji produktu.
- Post-show insights — analiza po koncercie.
- **Panel post-show** — dedykowany widok do przeglądu danych po wydarzeniu.
- **Eksport danych** — możliwość pobrania surowych danych i wyników analizy.
- **Automatyczne raporty** — generowanie podsumowań z każdego show.

---

## 6. Dane wejściowe

Na etapie MVP Plus zakładany jest **minimalny, bezpieczny zestaw danych**:

**Dostępne źródła danych:**

| Źródło | Opis |
|--------|------|
| **Audio publiczności** | Ambient / audience mic / FOH feed |
| **Metadane segmentów** | Czas trwania, warianty (full / short), przypisane elementy techniczne |
| **Manual input od showcallera** | Szybkie tagi kontekstowe (np. „problem techniczny", „energia spada") |

**Czego system NIE wykorzystuje:**

- Rozpoznawanie twarzy
- Identyfikacja osób
- Analiza emocji jednostek
- Autonomiczne decyzje systemu

---

## 7. Charakter i architektura systemu

### 7.1 Wymagania niefunkcjonalne

- System musi działać **w czasie rzeczywistym** (low latency).
- System **nie może być single point of failure** — w razie awarii koncert jest realizowany klasycznie.
- System jest **narzędziem produkcyjnym**, nie aplikacją konsumencką.
- **Human-in-the-loop** — system rekomenduje, decyzję zawsze podejmuje człowiek.
- **Fail-safe** — awaria systemu nie może blokować realizacji.

### 7.2 Proponowana architektura

Rozwiązanie zaprojektowane tak, aby było **tanie w utrzymaniu, przewidywalne**. W Wariancie B system działa **w chmurze** (tryb hybrydowy edge/offline jest poza zakresem — Wariant C).

**Pipeline przetwarzania (low-latency / human-in-the-loop / fallback):**

| Warstwa | Opis |
|---------|------|
| **1. Ingest** | Pobranie audio, buforowanie w krótkich oknach czasowych (np. 5–10 s), normalizacja poziomów. |
| **2. Feature extraction** | Cechy akustyczne + detekcja zdarzeń (oklaski, śpiew, krzyk, skandowanie, cisza) na bazie modeli audio. |
| **3. Engagement score** | Agregacja cech do wskaźników (energia, trend, anomalia) + **kalibracja per obiekt / gatunek** (Wariant B). |
| **4. Rekomendacje** | Ranking wariantów kolejnych utworów / segmentów z użyciem **ML** (Wariant B) + sugestie odzyskiwania czasu. |
| **5. UI operatora** | Panel bardzo czytelny, odporny na stres — rekomendacje, status czasu, manualne tagi, historia decyzji. |
| **6. Logi i analityka** | Zapis przebiegu show, **panel post-show, eksport danych, automatyczne raporty** (Wariant B). |

Koncert działa dalej bez systemu w razie awarii (fallback).

---

## 8. Co NIE jest celem realizacji

- Pełna automatyzacja koncertu
- Sterowanie światłem / pirotechniką
- Analiza emocji jednostek
- System bezpieczeństwa lub crowd control
- Rozpoznawanie twarzy / identyfikacja osób
- Generowanie contentu
- Tryb hybrydowy / edge / offline (Wariant C)
- Role użytkowników i system uprawnień (Wariant C)
- Moduł wideo (opcja po MVP Plus)

---

## 9. Plan realizacji — Wariant B (10 tygodni)

Cel: **stabilny pilot do testu na wydarzeniu w maju**. Harmonogram zakłada szybkie iteracje i równoległe prowadzenie UX + backend. Wariant B rozszerza plan bazowy o prace nad ML, panelem post-show, eksportem danych i raportami.

| Faza | Zakres | Czas |
|------|--------|------|
| **0. Kick-off + doprecyzowanie workflow** | Mapa decyzji showcallera, format setlisty, źródła audio, definicja metryk sukcesu | 3–5 dni |
| **1. Prototyp UX + specyfikacja** | Kluczowe ekrany panelu (w tym panel post-show), scenariusze, backlog | 1 tydzień |
| **2. Fundamenty real-time** | Ingest audio, bufor, feature extraction, podstawowy wskaźnik energii | 2 tygodnie |
| **3. Setlista + kontrola czasu** | Model utworów/segmentów, prognoza do curfew, scenariusze odzysku czasu | 2 tygodnie |
| **4. Rekomendacje + kalibracja** | Ranking kolejnych utworów (ML), kalibracja per venue, walidacja na danych historycznych | 2 tygodnie |
| **5. Post-show + eksport + raporty** | Panel post-show, eksport danych, automatyczne raporty | 1 tydzień |
| **6. Pilot + poprawki** | Test w warunkach zbliżonych do live, stabilizacja, deployment | 1–2 tygodnie |

---

## 10. Wycena — kontekst wariantów

Warianty różnią się poziomem stabilizacji produkcyjnej oraz zakresem pilota. **Wybrany został Wariant B (MVP Plus).** Poniżej pełna tabela dla kontekstu.

Wycena zakłada **intensywne wykorzystanie narzędzi AI** w procesie wytwarzania (prototypowanie, generowanie boilerplate, testy, dokumentacja, automatyzacje DevOps), co skraca czas i redukuje koszt bez kompromisu na jakości.

### 10.1 Porównanie wariantów (dla kontekstu)

| Wariant | Dla kogo | Zakres w skrócie | Czas |
|---------|----------|------------------|------|
| **A. Pilot MVP** | Szybki test na trasie / proof-of-value | Audio + metryka energii, kontrola czasu, rekomendacje (reguły), panel operatora, logi | **8 tyg.** |
| **B. MVP Plus** *(WYBRANY)* | MVP do pierwszych wdrożeń komercyjnych | A + kalibracja per obiekt, lepszy ranking utworów (ML), panel post-show, eksport danych, automatyczne raporty | **10 tyg.** |
| **C. Production Track** | Produkt gotowy do skali (tour / festiwal) | B + tryb hybrydowy (edge/offline), observability, role użytkowników, hardening bezpieczeństwa, pilotaż onsite + runbook | **12 tyg.** |

### 10.2 Szacunkowe koszty infrastruktury

| Element | Koszt |
|---------|-------|
| **Pilot / testy** (chmura + storage + monitoring) | 200–800 PLN / miesiąc (zależnie od wolumenu audio i częstotliwości analizy) |
| **Event 1,5 h** — koszt analizy | Pojedyncze PLN do kilkunastu PLN (przy podejściu audio i krótkich oknach) |
| **Wariant C (edge/offline)** | Dodatkowy koszt sprzętu (np. laptop / mini-PC) lub leasing; dobierany do warunków obiektu |

### 10.3 Opcje dodatkowe (po MVP Plus)

Poniższe elementy NIE wchodzą w zakres Wariantu B, ale mogą być realizowane jako osobne etapy:

- **Elementy z Wariantu C:** tryb hybrydowy (edge/offline), observability, role użytkowników, hardening bezpieczeństwa, pilotaż onsite + runbook
- **Moduł wideo** (bez rozpoznawania twarzy) + konsultacja prawna / privacy-by-design
- **Integracje z narzędziami produkcyjnymi** (np. import setlisty z formatu klienta, eksport do narzędzi planowania)
- **Tryb multi-venue / multi-tour** (panel administracyjny, zarządzanie konfiguracjami)
- **On-site support** na wybranych datach (próba + koncert)
- **Harmonogram i strategia produktu** (go-to-market, płatności, pakiety dla klientów zagranicznych)

---

## 11. Założenia i ryzyka

Projekt ma charakter **R&D w czasie rzeczywistym** — ryzyka są adresowane jawnie. Podejście minimalizuje je przez wąski MVP, szybki pilot i fail-safe.

| Ryzyko | Sposób mitygacji |
|--------|-----------------|
| **Jakość sygnału audio** | Dobór najlepszego źródła (ambient / audience mic / FOH), wstępne testy i kalibracja filtrów. |
| **Różnice między obiektami** | Kalibracja per venue + możliwość ręcznego ustawienia czułości, logowanie i szybkie iteracje. |
| **Opóźnienia / łączność** | Krótkie okna analizy, bufor. Tryb edge/offline dostępny w Wariancie C (poza obecnym zakresem). |
| **Oczekiwania „magii AI"** | Jasne definicje: system rekomenduje i pokazuje scenariusze; człowiek decyduje; mierzymy skuteczność. |
| **Dane historyczne do uczenia** | Na start — modele ogólne + reguły; z czasem budowany jest własny zbiór danych klienta jako przewaga konkurencyjna. |

---

## 12. Warunki handlowe

- **Ceny:** netto + VAT.
- **Płatność w etapach:**
  - 40% — start projektu
  - 40% — po fazie 3 (setlista + kontrola czasu)
  - 20% — po pilocie
- **IP:** Prawa do kodu źródłowego i rezultatów — po pełnej płatności przeniesienie na Klienta (lub licencja — do uzgodnienia).
- **Gwarancja:** 30 dni poprawek stabilizacyjnych po odbiorze MVP.
- **Wsparcie po MVP:** Opcjonalny miesięczny retainer (SLA + rozwój) — od 3 000 PLN / miesiąc.

---

## 13. Następne kroki

1. **Warsztat doprecyzowujący** (30–45 min) — workflow i źródła danych.
2. ~~Wybór wariantu A / B / C i podpisanie zamówienia.~~ — **Wybrany Wariant B (MVP Plus).**
3. **Kick-off i szybki prototyp UX** (5 dni roboczych) — bezpłatnie, jako element procesu decyzyjnego.
