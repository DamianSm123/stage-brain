# StageBrain — Domeny i pytania do zgłębienia

> **Powiązany dokument:** Przy analizie tego pliku zawsze uwzględniaj również [`StageBrain_Dokumentacja_Kompletna.md`](./StageBrain_Dokumentacja_Kompletna.md) — pełna dokumentacja projektowa, która dostarcza kontekst i odpowiedzi na wiele z poniższych pytań.

> Lista kluczowych obszarów wiedzy potrzebnych do budowy systemu.
> Każda domena zawiera pytania, na które trzeba znać odpowiedź, zanim zaczniemy projektować i kodować.
> Priorytet: od najważniejszego do opcjonalnego.

---

## 1. Workflow showcallera — jak wygląda jego praca na żywo

To jest **najważniejsza domena** — cały system istnieje, żeby wspierać tę jedną osobę w tych konkretnych momentach.

### Pytania:

- Czym dokładnie zajmuje się showcaller podczas koncertu? Jakie są jego obowiązki sekunda po sekundzie?
- Jakie decyzje podejmuje showcaller w trakcie show — i w jakim tempie? (sekundy vs minuty?)
- Kiedy showcaller ma czas na analizę, a kiedy działa instynktownie?
- Jak wygląda komunikacja radiowa — kto z kim rozmawia, jakie komendy padają, jaka jest hierarchia?
- Jakie narzędzia showcaller ma dziś przy sobie? (papierowa setlista? tablet? zegar? notatki?)
- Gdzie fizycznie stoi/siedzi showcaller? Co widzi, co słyszy?
- Jaka jest różnica między showcallerem a reżyserem a producentem — kto co decyduje?
- W jakich momentach koncertu showcaller jest najbardziej obciążony?
- Co się dzieje, kiedy coś idzie nie tak — jak wygląda "tryb kryzysowy"?
- Jakie informacje showcaller **chciałby mieć**, ale dziś ich nie ma?

---

## 2. Struktura setlisty i model danych utworu

System operuje na setliście — musimy dokładnie wiedzieć, czym ona jest na poziomie danych.

### Pytania:

- Ile utworów typowo ma setlista? (zakres: od najmniejszego do największego koncertu)
- Czy setlista jest liniowa (A → B → C), czy ma rozgałęzienia i warianty?
- Jakie warianty może mieć pojedynczy utwór? (full / short / acoustic / inne?)
- Ile wariantów typowo przygotowuje się dla jednego utworu?
- Co to jest "segment" — czy to to samo co utwór, czy coś szerszego? (np. blok tematyczny, segment z przerwą techniczną)
- Czy istnieją intro / outro / interlude jako osobne elementy? Jak się je traktuje?
- Jakie metadane ma utwór poza czasem trwania? (tonacja, BPM, nastrój, wymagania sceniczne?)
- Czy są **zależności** między utworami? ("po X musi być Y", "X i Z nie mogą być obok siebie")
- Czy zależności wynikają z logistyki scenicznej (przebudowa), dramaturgii, czy obu?
- Jak dziś setlista jest dokumentowana — w jakim formacie? (Excel? PDF? dedykowane narzędzie?)
- Kto tworzy setlistę i kto ją zatwierdza? Artysta? Manager? Reżyser?
- Czy setlista zmienia się między koncertami na tej samej trasie?
- Co to znaczy "utwór jest zaprogramowany"? Co konkretnie jest przypisane do utworu? (cue listy, timecode, pirotechnika?)

---

## 3. Elementy techniczne produkcji przypisane do utworów

Każdy utwór ma "zaprogramowane" elementy — system musi wiedzieć, czym one są, żeby rozumieć konsekwencje zmian.

### Pytania:

- Jakie elementy techniczne są przypisywane do utworów? (światło, pirotechnika, wideo, timecode, ruch sceniczny, confetti, CO2...)
- Czy te elementy są w systemie timecode — tzn. odpalane automatycznie z muzyką?
- Co się dzieje z elementami technicznymi, gdy utwór zostaje skrócony? Czy wariant "short" ma osobny zestaw cue?
- Co się dzieje z elementami technicznymi, gdy zmieni się kolejność utworów?
- Czy są elementy, które **wymagają czasu przygotowania** między utworami? (np. przebudowa sceny, ładowanie pirotechniki)
- Ile czasu trwają typowe przerwy techniczne między segmentami?
- Jakie elementy techniczne są "bezpieczne" do pominięcia, a jakie są krytyczne?
- Czy istnieje coś takiego jak "scenariusz produkcyjny" — dokument opisujący cały show z perspektywy technicznej?

---

## 4. Dramaturgia koncertu — krzywa energetyczna i wzorce

System ma rozumieć energię — ale najpierw my musimy rozumieć, jak działa dramaturgia koncertu.

### Pytania:

- Czy istnieje typowy wzorzec krzywej energetycznej koncertu? (np. otwarcie mocne → budowanie → szczyt → zjazd → encore)
- Jak ten wzorzec różni się między gatunkami? (hip-hop vs pop vs rock vs elektronika)
- Co oznacza "energia" z perspektywy showcallera — jak ją dziś ocenia? Po czym poznaje spadek?
- Ile jest typowo "szczytów energetycznych" w koncercie?
- Czym jest encore — formalność czy realna decyzja?
- Czy artysta zmienia zachowanie na podstawie energii publiczności? Jak to wpływa na setlistę?
- Jakie sygnały mówią showcallerowi "tu jest dobrze" vs "tu jest problem"?
- Czy są momenty w koncercie, gdzie spadek energii jest **zamierzony** (ballada, moment intymny)?
- Jak odróżnić zamierzony spadek od problematycznego?

---

## 5. Czas, opóźnienia i curfew

Druga kluczowa funkcja systemu — kontrola czasu. Musimy rozumieć, skąd biorą się opóźnienia i jakie mają konsekwencje.

### Pytania:

- Czym jest curfew? Kto go ustala i jak rygorystycznie jest egzekwowany?
  > **Odp.:** Curfew to sztywny limit czasowy zakończenia emisji dźwięku na obiekcie. Ustala go właściciel/operator obiektu (hala, stadion) na podstawie regulacji lokalnych — pozwolenia na hałas, przepisy miejskie, umowy z sąsiadami. Na festiwalach i open-airach curfew wynika z decyzji administracyjnych (miasto, powiat). Egzekwowany jest bardzo rygorystycznie, szczególnie na stadionach miejskich i obiektach w centrach miast. Operator obiektu może fizycznie odciąć zasilanie nagłośnienia po przekroczeniu limitu. Na dużych halach widowiskowych (np. Atlas Arena, Tauron Arena) curfew jest egzekwowany co do minuty.

- Jakie są realne konsekwencje przekroczenia curfew? (kary finansowe — jakiego rzędu? zakaz powrotu na obiekt? inne?)
  > **Odp.:** Kary finansowe: typowo od kilku do kilkudziesięciu tysięcy złotych za każde rozpoczęte 15 minut przekroczenia; na dużych obiektach międzynarodowych mogą sięgać tysięcy euro. Zakaz powrotu na obiekt lub utrudnienia w przyszłych rezerwacjach. Kary kontraktowe od promotora/organizatora. Na festiwalach — opóźnienie kaskadowe wpływające na kolejne sceny i artystów. Problemy prawne z lokalnymi regulacjami dot. hałasu (skargi mieszkańców, interwencje policji). Ryzyko wizerunkowe dla producenta i artysty.

- Skąd typowo biorą się opóźnienia? (artysta, technika, logistyka, publiczność?)
  > **Odp.:** Ze strony artysty — późne wyjście na scenę, dłuższe interakcje z publicznością, bisowanie poza planem, zmiany zdania co do setlisty. Technika — awarie sprzętu (mikrofon, instrumenty, timecode), problemy z monitorem, konieczność restartów. Logistyka — przebudowy sceniczne trwające dłużej niż planowano, problemy z przemieszczaniem artysty. Publiczność — opóźnienia przy wpuszczaniu widzów, incydenty medyczne. Pogoda (open-air) — burze i opady wymuszają przerwy z powodów bezpieczeństwa.

- Ile wynosi typowe opóźnienie — minuty? dziesiątki minut?
  > **Odp.:** Typowe opóźnienie wynosi od 5 do 20 minut. Najczęściej 5–15 minut — spowodowane późnym startem (artysta wychodzi później). Opóźnienia techniczne w trakcie show to zazwyczaj 2–5 minut. Powyżej 20–30 minut to rzadkość (poważne awarie, incydenty pogodowe, bezpieczeństwo). Najtrudniejszy do uchwycenia wzorzec to kumulacja drobnych opóźnień — 30 sekund tu, minuta tam — z pozoru niegroźne, ale w sumie dają 10–15 minut.

- Jak dziś showcaller śledzi czas? (stoper? zegar? w głowie?)
  > **Odp.:** Kombinacja narzędzi: stoper (telefon lub dedykowany), zegar/zegarek (czas absolutny vs curfew), papierowa setlista z odręcznymi notatkami (zapisywanie rzeczywistych czasów startu/końca każdego utworu), arkusze kalkulacyjne przygotowane przed koncertem z planowanymi czasami. W głowie — doświadczony showcaller ma wyczucie, ile trwa dany utwór i ile zostało. Niektórzy używają prostych aplikacji stoperowych na tablecie. Brak zintegrowanego narzędzia, które automatycznie porównuje plan z rzeczywistością — to robi się mentalnie lub ręcznie. To jest dokładnie luka, którą StageBrain ma wypełnić.

- Jak dziś się "odzyskuje" czas — jakie są typowe strategie?
  > **Odp.:** (1) Skrócenie wersji utworów — z "full" na "short" (ucięcie zwrotki, skrócenie outro). (2) Pominięcie utworu o niższym priorytecie produkcyjnym. (3) Skrócenie przerw między utworami — mniej gadania artysty, szybsze przejścia. (4) Zmiana kolejności — przeniesienie utworu wymagającego przebudowy, by zoptymalizować przerwy techniczne. (5) Rezygnacja z encoru lub jego skrócenie. (6) Skrócenie interlude / przerw technicznych. (7) W skrajnych przypadkach — ucięcie całego segmentu.

- Czy istnieje "bufor czasowy" w planowaniu setlisty?
  > **Odp.:** Tak, doświadczone produkcje zawsze planują bufor — typowo 5–15 minut wbudowane w plan. Bufor może być "rozłożony" (każda przerwa między segmentami ma 30 sekund zapasu) lub "skupiony" (celowo luźniejszy segment pod koniec, łatwy do skrócenia). Niektóre produkcje przygotowują "opcjonalne" utwory — w planie, ale od początku wiadomo, że mogą zostać pominięte. Im większa produkcja i surowszy curfew, tym większy planowany bufor.

- Kiedy opóźnienie jest jeszcze do nadrobienia, a kiedy trzeba ciąć program?
  > **Odp.:** Orientacyjne progi (zależne od długości koncertu): **Do ~5 min** — do nadrobienia przez skrócenie przerw i drobne korekty (skrócenie jednego utworu). **5–10 min** — wymaga aktywnego zarządzania: skrócenie kilku utworów, pominięcie jednego mniej istotnego. **10–15 min** — konieczne cięcie programu: pominięcie 1–2 utworów lub całego segmentu. **Powyżej 15–20 min** — poważna reorganizacja setlisty, pominięcie segmentu, rezygnacja z encoru. Przy 2,5h show jest więcej miejsca na manewr niż przy 60-minutowym secie festiwalowym.

- Kto podejmuje decyzję o skróceniu / pominięciu utworu? Showcaller sam, czy konsultacja z artystą/producentem?
  > **Odp.:** Zależy od skali zmiany i kultury produkcji. **Drobne korekty** (skrócenie wersji, szybsze przejścia) — showcaller decyduje samodzielnie i komunikuje ekipie. **Pominięcie utworu** — konsultacja z producentem lub tour managerem; artysta informowany przez in-ear lub managera na boku sceny. **Duże cięcia** (segment, encore) — decyzja produkcyjna z udziałem artysty/managera, ale pod presją czasu to producent/showcaller proponuje rozwiązanie, a artysta akceptuje lub nie. Kluczowa praktyka: scenariusze awaryjne uzgadnia się PRZED koncertem ("jeśli tracimy X minut, robimy Y").

- Jak szybko trzeba podjąć taką decyzję?
  > **Odp.:** Decyzja musi zapaść w ciągu sekund do kilku minut. Między utworami showcaller ma zazwyczaj 30–90 sekund na podjęcie i zakomunikowanie decyzji. Gdy artysta jest na scenie i gra, decyzja o zmianie kolejnego utworu musi zapaść zanim bieżący się skończy. W sytuacji kryzysowej (awaria, incydent) — decyzje zapadają w sekundach. To jest jeden z głównych powodów, dla których StageBrain musi prezentować scenariusze proaktywnie, zanim showcaller o nie poprosi.

- Czy są elementy, które **nigdy** nie mogą być pominięte? (np. kontraktowy hit, sponsor, pirotechnika już załadowana)
  > **Odp.:** Tak, kilka kategorii: (1) **Kontraktowe hity** — jeśli umowa z promotorem lub sponsorem wymaga zagrania konkretnych utworów. (2) **Elementy sponsorskie** — jeśli sponsor zapłacił za obecność w show (branding, dedykowany moment). (3) **Pirotechnika już załadowana** — ze względów bezpieczeństwa, raz załadowanej pirotechniki nie można po prostu pominąć; musi zostać odpalona lub profesjonalnie rozładowana, co zajmuje czas. (4) **Krytyczne elementy timecode'owe** powiązane z innymi systemami (synchronizacja wideo-audio-światło). (5) **Encore kontraktowy** lub stanowiący kulminację produkcyjną (największy hit artysty). (6) **Elementy bezpieczeństwa** — ewakuacyjne komunikaty, procedury związane z efektami specjalnymi. System StageBrain powinien te elementy oznaczać jako "zablokowane" i nigdy nie sugerować ich pominięcia.

---

## 6. Audio publiczności — co słychać i co da się z tego wyciągnąć

Główne źródło danych w MVP. Musimy rozumieć, czym dysponujemy.

### Pytania:

- Jakie mikrofony są dostępne na typowym koncercie? (audience mic, ambient mic, FOH feed — czym się różnią?)
- Który sygnał najlepiej oddaje reakcję publiczności?
- Jak głośno jest na koncercie od strony nagłośnienia vs od strony publiczności?
- Czy da się wyizolować dźwięk publiczności od muzyki?
- Jakie dźwięki wydaje publiczność? (krzyk, śpiew, skandowanie, oklaski, cisza, rozmowy, buczenie)
- Które z tych dźwięków korelują z "wysoką energią", a które z "niską"?
- Jak zmienia się dźwięk publiczności w zależności od wielkości obiektu? (klub 500 osób vs stadion 50 000)
- Czy dźwięk publiczności różni się między gatunkami muzyki?
- Jakie artefakty mogą zafałszować sygnał? (pogłos hali, bass muzyki, wiatr na open-air)
- Czy na próbach generalnych jest publiczność? Czy da się przetestować audio w realnych warunkach przed koncertem?

---

## 7. Venue — różnice między obiektami

Każdy obiekt jest inny. System musi to uwzględniać.

### Pytania:

- Jakie typy obiektów obsługuje TINAP? (hala, stadion, open-air, klub, teatr?)
- Co zmienia się między obiektami z perspektywy showcallera?
- Jak akustyka obiektu wpływa na słyszalność publiczności?
- Jakie ograniczenia narzucają obiekty? (curfew, limity dźwięku, ograniczenia pirotechniczne)
- Czy te same utwory brzmią/wyglądają inaczej na różnych obiektach?
- Ile obiektów jest typowo na jednej trasie koncertowej?
- Czy showcaller ma czas na "kalibrację" przed koncertem na nowym obiekcie?
- Co to znaczy "kalibracja per venue" — jakie parametry trzeba dostroić?

---

## 8. Rekomendacje — logika sugestii systemu

System ma rekomendować, nie decydować. Ale musimy wiedzieć, **na jakiej podstawie**.

### Pytania:

- Jakie kryteria powinny wpływać na rekomendację kolejnego utworu? (energia, czas, dramaturgiczna krzywa, ograniczenia techniczne?)
- Jak ważyć te kryteria wobec siebie? (co wygrywa — czas czy energia?)
- Czy showcaller chce widzieć jedną rekomendację, top 3, czy pełny ranking?
- Jak prezentować "pewność" rekomendacji? (czy system powinien mówić "pewne 85%" vs "sugestia"?)
- Jakie scenariusze odzyskiwania czasu są realistyczne? (skrócenie utworu, pominięcie, zmiana kolejności, skrócenie przerwy?)
- Czy istnieją rekomendacje, które system **nie powinien** dawać? (np. nigdy nie sugeruj pominięcia głównego hitu)
- Jak system powinien się zachować, gdy nie ma dobrej opcji?
- Czy rekomendacje powinny uwzględniać historię z poprzednich koncertów na tej samej trasie?

---

## 9. UI / panel operatora — jak to ma wyglądać i działać

System musi być użyteczny pod presją czasu i stresu.

### Pytania:

- Na jakim urządzeniu showcaller będzie korzystał z systemu? (tablet, laptop, dedykowany monitor?)
- Ile czasu showcaller może poświęcić na patrzenie w ekran?
- Jakie informacje muszą być widoczne **zawsze** (bez interakcji)?
- Jakie informacje mogą być "na żądanie" (po kliknięciu/tapnięciu)?
- Jak duży tekst / elementy UI muszą być? (oświetlenie backstage, odległość od ekranu)
- Czy interfejs powinien działać w trybie ciemnym? (backstage jest ciemny)
- Jak showcaller wchodzi w interakcję — dotyk, klawiatura, skróty klawiszowe?
- Co to są "manualne tagi" — jak szybko muszą być dodane? Jedno kliknięcie? Głos?
- Czy system musi działać offline (bez internetu)?
- Jakie powiadomienia / alerty system powinien wysyłać? Dźwiękowe? Wizualne?
- Czy ktoś inny poza showcallerem patrzy na ten sam panel? (reżyser, producent, artysta?)

---

## 10. Dane historyczne i uczenie systemu

System z czasem ma się uczyć. Musimy wiedzieć, z czego.

### Pytania:

- Jakie dane z koncertu powinny być zapisywane na potrzeby przyszłych wydarzeń?
- Czy TINAP ma dziś jakiekolwiek dane historyczne? (nagrania, notatki, setlisty z opisami?)
- Ile koncertów rocznie realizuje TINAP?
- Czy da się uzyskać nagrania audio z poprzednich koncertów do trenowania modeli?
- Jak definiujemy "udany koncert" vs "problematyczny" — jakie metryki?
- Kto po koncercie robi retrospektywę? Czy są notatki z takich spotkań?
- Czy różni artyści mają różne wzorce — i czy system powinien się uczyć per artysta?

---

## Kolejność zgłębiania

Sugerowana kolejność pracy z tymi pytaniami:

| Priorytet | Domena | Dlaczego najpierw |
|-----------|--------|-------------------|
| 1 | **Workflow showcallera** | Bez tego nie wiemy, dla kogo budujemy |
| 2 | **Struktura setlisty** | Bez tego nie mamy modelu danych |
| 3 | **Czas i curfew** | Jedna z dwóch głównych funkcji MVP |
| 4 | **Dramaturgia koncertu** | Potrzebna do zrozumienia "energii" |
| 5 | **Audio publiczności** | Główne źródło danych w MVP |
| 6 | **Elementy techniczne** | Wpływają na ograniczenia rekomendacji |
| 7 | **Rekomendacje** | Logika systemu — wymaga wiedzy z 1-6 |
| 8 | **UI / panel** | Projektowany na bazie wiedzy z 1-7 |
| 9 | **Venue** | Kalibracja — ważne, ale po MVP wariant A |
| 10 | **Dane historyczne** | Długoterminowe, nie blokuje MVP |
