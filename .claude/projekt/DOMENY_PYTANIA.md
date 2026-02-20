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
  > **Odp.:** Showcaller to **centralny koordynator przebiegu show w czasie rzeczywistym**. Jego praca sekunda po sekundzie: (1) **Przed utworem** (30–90 sek. przerwy) — ogłasza przez radio co nadchodzi ("standby for song 7, full version"), upewnia się, że wszystkie działy są gotowe (światło, wideo, dźwięk, scena, pirotechnika), daje komendę "GO" do uruchomienia następnego elementu. (2) **W trakcie utworu** — monitoruje przebieg (czy timecode biegnie poprawnie, czy nie ma problemów technicznych), obserwuje czas (ile trwa utwór vs plan), obserwuje publiczność i scenę, notuje czasy rzeczywiste, planuje mentalnie kolejny ruch. (3) **Między segmentami** — zarządza przerwą techniczną, koordynuje przebudowę sceny, monitoruje czas i decyduje o ewentualnych korektach setlisty. (4) **W tle ciągle** — liczy czas do curfew, aktualizuje w głowie deltę opóźnienia, komunikuje się radiem z ekipą. To jest rola **dyrygenta logistycznego** — nie podejmuje decyzji artystycznych, ale pilnuje, żeby cała maszyneria show działała zsynchronizowanie i na czas.

- Jakie decyzje podejmuje showcaller w trakcie show — i w jakim tempie? (sekundy vs minuty?)
  > **Odp.:** Showcaller podejmuje decyzje na dwóch poziomach: **Decyzje rutynowe (co kilka sekund do kilkudziesięciu sekund):** kiedy dać "standby", kiedy dać "GO", czy ekipa jest gotowa, czy przejście może się odbyć. To są decyzje niemal automatyczne, wynikające z doświadczenia i setlisty — jak prowadzenie samochodu. **Decyzje taktyczne (co kilka minut, między utworami/segmentami):** czy jesteśmy w czasie, czy trzeba coś skrócić/pominąć, czy zmienić wariant następnego utworu, czy poinformować producenta o problemie. Na podjęcie takiej decyzji showcaller ma **30–90 sekund** (czas przejścia między utworami). **Decyzje kryzysowe (natychmiast, w sekundach):** awaria techniczna, incydent na widowni, problem z artystą — tu decyzja pada w 5–15 sekund. StageBrain ma największą wartość w **decyzjach taktycznych** — daje dane i scenariusze w tym krytycznym oknie 30–90 sekund.

- Kiedy showcaller ma czas na analizę, a kiedy działa instynktownie?
  > **Odp.:** **Czas na analizę: głównie między segmentami i podczas interlude** — gdy trwa przebudowa sceny lub nagranie wideo na ekranach, showcaller ma 2–5 minut "oddechu". To jedyne momenty, gdy może spojrzeć na dane, przemyśleć sytuację, porozmawiać z producentem. W mniejszym stopniu — podczas dłuższych utworów (4–5 min), gdy wszystko biegnie po timecode i nie wymaga interwencji. **Działanie instynktowne: podczas przejść między utworami, w momentach kryzysowych, przy szybkich sekwencjach.** Gdy utwór się kończy, showcaller musi w kilkanaście sekund dać standby, upewnić się o gotowości, dać GO — tu nie ma czasu na analizowanie danych. Implikacja dla StageBrain: **system musi "przygotować" informacje ZANIM showcaller ich potrzebuje** — proaktywnie, nie na żądanie. Gdy showcaller patrzy na ekran w 30-sekundowym oknie, dane muszą już tam być, czytelne od razu.
  > **Dotyczy modułu:** `apps/web/src/features/live-panel/` — proaktywne wyświetlanie rekomendacji i alertów, nie na żądanie

- Jak wygląda komunikacja radiowa — kto z kim rozmawia, jakie komendy padają, jaka jest hierarchia?
  > **Odp.:** Na dużych produkcjach komunikacja radiowa jest **ustrukturyzowana i zhierarchizowana**: **Kanały** — typowo 2–5 oddzielnych kanałów: (1) główny kanał show (showcaller + wszystkie działy), (2) kanał techniczny (dźwięk + światło), (3) kanał backstage/produkcja, (4) kanał bezpieczeństwa. **Hierarchia** — showcaller ma najwyższy priorytet na kanale show; gdy mówi, wszyscy milkną. **Komendy standardowe** — branżowy żargon, krótkie i jednoznaczne: "Standby LX cue 47" (uwaga, światło, cue 47), "GO" (odpal), "Hold" (wstrzymaj), "Strike" (zlikwiduj element), "Copy" (zrozumiałem). **Kto z kim:** showcaller → wszyscy (komendy), działy → showcaller (potwierdzenia, raporty problemów), producent ↔ showcaller (decyzje taktyczne), stage manager ↔ showcaller (logistyka backstage). Showcaller ma radio w ręce lub zestawie nagłownym **przez cały czas trwania show** — to jego główne narzędzie pracy, ważniejsze niż jakikolwiek ekran.

- Jakie narzędzia showcaller ma dziś przy sobie? (papierowa setlista? tablet? zegar? notatki?)
  > **Odp.:** Typowy zestaw showcallera na dużej produkcji: (1) **Radio (walkie-talkie)** — najważniejsze narzędzie, zawsze w ręce lub na zestawie nagłownym. (2) **Papierowa setlista** — wydruk z kolumnami (nr, tytuł, wariant, planowany czas), z miejscem na odręczne notatki; bywa zalaminowana. (3) **Zegarek / zegar** — czas absolutny, odniesienie do curfew. (4) **Stoper** — na telefonie lub dedykowany; do mierzenia czasu trwania utworów i przerw. (5) **Długopis / marker** — do notowania rzeczywistych czasów na papierowej setliście. (6) **Telefon** — stoper, komunikacja (SMS/WhatsApp z producentem/managerem), czasem latarka. (7) **Tablet (opcjonalnie)** — niektórzy showcallerzy korzystają z tabletu z setlistą w PDF lub prostym arkuszu; nie jest to standard, ale trend rośnie. (8) **Latarka z czerwonym/niebieskim filtrem** — do czytania w ciemności backstage. Kluczowa obserwacja: **żadne z tych narzędzi nie jest zintegrowane** — showcaller żongluje między radiem, papierem, stoperem i zegarem, robiąc obliczenia w głowie. StageBrain konsoliduje to wszystko w jeden ekran.

- Gdzie fizycznie stoi/siedzi showcaller? Co widzi, co słyszy?
  > **Odp.:** Lokalizacja showcallera zależy od venue i produkcji, ale najczęstsze pozycje: (1) **Stage left lub stage right** — tuż za kulisami, z widokiem na scenę (przynajmniej częściowym) i na ekrany monitorowe. To najpopularniejsza pozycja na dużych produkcjach — showcaller widzi artystę i moment wejść/wyjść. (2) **Dedykowane stanowisko backstage** — stół z monitorami (podgląd kamer scenicznych, feed z konsoletki oświetleniowej), radio, setlista. (3) **FOH (Front of House)** — rzadziej, ale na niektórych produkcjach showcaller siedzi przy mikserze na widowni; ma najlepszy widok na scenę i publiczność, ale jest daleko od backstage. **Co widzi:** scenę (bezpośrednio lub na monitorach), ekrany z podglądem kamer, setlistę, swoje narzędzia. **Co słyszy:** muzykę (z opóźnieniem i pogłosem jeśli backstage, wyraźniej na FOH), radio (w uchu), rozmowy ekipy, dźwięki backstage. Środowisko jest **ciemne, głośne i chaotyczne** — stąd wymóg, żeby StageBrain był czytelny bez wpatrywania się i działał na dotyk jedną ręką.
  > **Dotyczy modułu:** `apps/web/src/features/live-panel/` — dark mode, duże elementy, touch-first

- Jaka jest różnica między showcallerem a reżyserem a producentem — kto co decyduje?
  > **Odp.:** Trzy różne role, często mylone, z wyraźnym podziałem odpowiedzialności: **Producent (show producer / tour producer):** odpowiada za **całość koncepcji show** — wizja artystyczna, budżet, zespół, harmonogram produkcji. Decyduje o tym, JAK show wygląda i ile kosztuje. Pracuje głównie przed koncertem (pre-produkcja), w trakcie show nadzoruje, ale nie koordynuje operacyjnie. **Reżyser (show director):** odpowiada za **warstwę artystyczną i dramaturgiczną** — krzywa emocjonalna, scenografia, choreografia, timing artystyczny. Na dużych produkcjach często jest też reżyser świateł (LD) i reżyser wideo (VD) jako osobne role. Reżyser ustala "co chcemy przekazać", producent "jak to zrealizować". **Showcaller (stage manager / show caller):** odpowiada za **egzekucję w czasie rzeczywistym** — koordynuje wszystkie działy, daje komendy GO, pilnuje czasu, reaguje na problemy. Nie podejmuje decyzji artystycznych, ale podejmuje decyzje operacyjne (skrócić, pominąć, zmienić kolejność — w konsultacji z producentem). StageBrain jest narzędziem **showcallera** — to on jest przy ekranie w trakcie show. Producent i reżyser mogą korzystać z danych post-show.

- W jakich momentach koncertu showcaller jest najbardziej obciążony?
  > **Odp.:** Momenty najwyższego obciążenia: (1) **Otwarcie show** — najwyższy stres, wszystko musi zagrać idealnie za pierwszym razem; ekipa jest naelektryzowana, artysta wchodzi, publiczność reaguje; showcaller daje serię szybkich komend (światło, wideo, dźwięk, pirotechnika — GO GO GO). (2) **Przejścia między segmentami z przebudową** — showcaller koordynuje jednocześnie: wyjście artysty, start interlude, przebudowę sceny, gotowość techniczną, czas do następnego segmentu. Wiele rzeczy dzieje się równolegle. (3) **Momenty z pirotechniką / efektami specjalnymi** — wymóg precyzji co do sekundy, konsekwencje błędu są poważne (bezpieczeństwo). (4) **Sytuacje kryzysowe** — awaria techniczna w trakcie utworu, artysta improwizuje/zmienia plan, incydent na widowni. (5) **Końcówka show przy opóźnieniu** — czas ucieka, trzeba podejmować decyzje o cięciu programu pod presją curfew. (6) **Encore** — pozornie "luz", ale w rzeczywistości koordynacja: kiedy artysta wraca, jaki wariant encore'u, czy się mieścimy w czasie. StageBrain jest **najcenniejszy w momentach 4 i 5** — tam dane i scenariusze ratują od błędnych decyzji pod presją.

- Co się dzieje, kiedy coś idzie nie tak — jak wygląda "tryb kryzysowy"?
  > **Odp.:** "Tryb kryzysowy" to moment, gdy plan się rozpada i showcaller musi natychmiast reagować. Typowe scenariusze i reakcje: (1) **Awaria timecode / playbacku** — muzyka się zatrzymuje; showcaller daje "HOLD" na wszystkie systemy, komunikuje z artystą (in-ear: "technical, hold position"), koordynuje restart z operatorem playbacku; decyzja: czekamy na restart czy artysta improwizuje akustycznie? Typowy czas rozwiązania: 30 sek. – 3 min. (2) **Awaria mikrofonu / instrumentu** — showcaller koordynuje z dźwiękowcem swap sprzętu, jednocześnie informuje artystę; show zazwyczaj nie przerywa się, ale artysta może musieć się zaadaptować. (3) **Artysta odchodzi od planu** — dłuższa gadka z publicznością, powtarza refren, improwizuje; showcaller w czasie rzeczywistym przelicza czas i informuje ekipę "overrun estimated +2 min, standby for possible cut of song X". (4) **Incydent na widowni** — medyczny lub bezpieczeństwa; showcaller koordynuje z security, decyzja o ewentualnej przerwie w porozumieniu z producentem. (5) **Pogoda (open-air)** — burza, deszcz; możliwa ewakuacja; showcaller jest częścią łańcucha decyzyjnego. We wszystkich przypadkach: **komunikacja radiowa staje się intensywna, decyzje padają w sekundach, showcaller jest centralnym węzłem informacyjnym**. StageBrain w trybie kryzysowym powinien: nie przeszkadzać (nie zalewać alertami), pokazywać konsekwencje czasowe zdarzenia, mieć gotowe scenariusze odzysku.
  > **Dotyczy modułu:** `apps/web/src/features/live-panel/` — zachowanie panelu w sytuacji kryzysowej (nie zasłaniać kluczowych informacji alertami)

- Jakie informacje showcaller **chciałby mieć**, ale dziś ich nie ma?
  > **Odp.:** To jest **rdzeń propozycji wartości StageBrain** — luki, które showcaller wypełnia dziś głową, intuicją i doświadczeniem: (1) **Prognoza czasu do curfew z uwzględnieniem aktualnego tempa** — dziś liczy w głowie; "ile mi zostało, jeśli każdy utwór potrwa tyle co dotychczas". (2) **Gotowe scenariusze odzysku czasu** — "jeśli skrócę X i pominę Y, zyskam 4:30" — dziś musi to wyliczyć mentalnie pod presją. (3) **Obiektywny wskaźnik energii publiczności** — dziś ocenia subiektywnie po dźwięku i (jeśli widzi) po widowni; brak metryki, brak trendu, brak porównania z innymi koncertami. (4) **Porównanie "plan vs rzeczywistość"** — dziś zapisuje czasy ręcznie na papierze; brak automatycznego zestawienia i delty. (5) **Historia z poprzednich koncertów** — "jak zagraliśmy ten set w Gdańsku, ile trwały przejścia, gdzie było opóźnienie" — dziś ginie w pamięci lub notatkach, których nikt nie digitalizuje. (6) **Konsekwencje techniczne zmian** — "jeśli pominę utwór 8, co się stanie z pirotechniką?" — dziś musi znać to z pamięci lub pytać radiem. (7) **Proaktywne ostrzeżenia** — "jeśli ten utwór potrwa tak jak ostatnio, nie zmieścisz się w curfew" — dziś nikt go nie ostrzega z wyprzedzeniem. Wszystkie te 7 punktów to dokładnie funkcjonalności StageBrain.
  > **Dotyczy modułów:**
  > - `apps/api/src/shows/` — prognoza czasu, scenariusze odzysku
  > - `apps/api/src/recommendations/` — rekomendacje oparte na danych
  > - `apps/web/src/features/live-panel/` — wyświetlanie wszystkich powyższych w czasie live
  > - `apps/api/src/analytics/` — dane historyczne, porównania między koncertami

---

## 2. Struktura setlisty i model danych utworu

System operuje na setliście — musimy dokładnie wiedzieć, czym ona jest na poziomie danych.

### Pytania:

- Ile utworów typowo ma setlista? (zakres: od najmniejszego do największego koncertu)
  > **Odp.:** Zakres zależy od skali produkcji i formatu. **Festiwalowy set** (45–75 min): 10–15 utworów. **Koncert halowy / klubowy** (90–120 min): 18–25 utworów. **Duża produkcja stadionowa / arena** (120–150 min): 22–30+ utworów (wliczając encore). Na największych trasach (Beyoncé, Coldplay, Taylor Swift) setlisty mają 25–35 pozycji, ale wiele z nich to krótkie segmenty, interlude, medleye. W polskich realiach (Quebonafide, Mata, Sobel — skala TINAP): typowo **18–25 utworów** na koncercie halowym/arenowym trwającym ~2h. Do tego dochodzą intro, outro, interlude — łącznie model danych powinien obsługiwać **30–40 elementów** na setlistę z zapasem.

- Czy setlista jest liniowa (A → B → C), czy ma rozgałęzienia i warianty?
  > **Odp.:** **Bazowo liniowa, ale z przygotowanymi wariantami.** Przed koncertem setlista ma ustaloną kolejność A → B → C → D. Jednak produkcja przygotowuje "plan B" — showcaller wie, które utwory można pominąć, zamienić miejscami lub skrócić. Nie jest to rozgałęzienie w sensie drzewa decyzyjnego — raczej **liniowa sekwencja z oznaczonymi punktami elastyczności**. Typowo 3–5 utworów na setliście ma flagę "opcjonalny / do pominięcia", a kilka kluczowych przejść ma przygotowane alternatywne kolejności. Dokładnie to StageBrain ma modelować: liniowa baza + warianty/permutacje w zdefiniowanych punktach.
  > **Dotyczy modułu:** `apps/api/src/setlist/` — model setlisty: ordered list z flagami elastyczności

- Jakie warianty może mieć pojedynczy utwór? (full / short / acoustic / inne?)
  > **Odp.:** Najczęstsze warianty na dużych produkcjach: (1) **Full** — pełna wersja, standardowa. (2) **Short** — skrócona (ucięta zwrotka, krótsze outro, pominięty bridge) — najczęstsza strategia odzysku czasu. (3) **Extended** — wydłużona (dłuższe outro, dodatkowa interakcja z publicznością, jam session) — używana, gdy jest nadwyżka czasu lub energia jest bardzo wysoka. (4) **Acoustic / stripped** — inna aranżacja, zazwyczaj cichsza, intymniejsza — zmiana dynamiki. (5) **Medley** — fragment utworu połączony z fragmentami innych w jeden ciągły blok. (6) **With special** — wersja z dodatkowym elementem produkcyjnym (gość specjalny, pirotechnika, efekt sceniczny, konfetti). Nie każdy utwór ma wszystkie warianty — większość ma full + short, niektóre mają 3–4 opcje.
  > **Dotyczy modułu:** `apps/api/src/setlist/` — model wariantów: enum/tablica wariantów per utwór, każdy z osobnym czasem trwania i zestawem cue

- Ile wariantów typowo przygotowuje się dla jednego utworu?
  > **Odp.:** **Większość utworów: 2 warianty (full + short).** To absolutne minimum i zarazem standard. Kilka kluczowych utworów na setliście (3–5) może mieć 3 warianty (np. full / short / extended lub full / short / acoustic). Utwory oznaczone jako "locked" (kontraktowe hity, pirotechnika) mają zazwyczaj **tylko 1 wariant** — full — bo ich przebieg jest ściśle powiązany z timecode i cue listami, skrócenie wymagałoby przeprogramowania. W modelu danych: średnio **1,5–2 warianty na utwór**, ale system powinien obsługiwać do 4–5 dla elastyczności.

- Co to jest "segment" — czy to to samo co utwór, czy coś szerszego? (np. blok tematyczny, segment z przerwą techniczną)
  > **Odp.:** Segment to **coś szerszego niż utwór** — jest to blok tematyczny lub dramaturgiczny grupujący kilka utworów. Typowa struktura dużego koncertu: **4–6 segmentów**, każdy po 3–6 utworów. Przykład: "Segment 1: Opening" (3 energetyczne utwory), "Segment 2: Ballady" (3–4 wolne), "Segment 3: Party block" (4–5 bangerów), "Segment 4: Encore" (2–3 hity). Między segmentami są **przerwy techniczne** (przebudowa sceny, zmiana kostiumów, pauza dramaturgiczna) — typowo 2–5 minut. Segmenty mają znaczenie dla showcallera, bo to naturalne punkty decyzyjne: łatwiej pominąć/skrócić cały segment niż wyciągać pojedynczy utwór ze środka bloku. W modelu danych: **dwupoziomowa hierarchia — setlista → segmenty → utwory (z wariantami)**.
  > **Dotyczy modułu:** `apps/api/src/setlist/` — hierarchia: Setlist → Segment → Song → Variant

- Czy istnieją intro / outro / interlude jako osobne elementy? Jak się je traktuje?
  > **Odp.:** Tak, to **pełnoprawne elementy setlisty**, nie dekoracja. (1) **Intro** — otwiera show lub segment; może być nagrane (playback z timecode), może być live; typowo 1–3 minuty; buduje napięcie przed pierwszym utworem; ma zaprogramowane światło, wideo, efekty. (2) **Outro** — zamyka show; może być nagranie, może być live; czasem łączy się z ostatnim utworem. (3) **Interlude** — przerwa artystyczna/techniczna między segmentami; często nagranie wideo na ekranach, podczas gdy za kulisami trwa przebudowa/zmiana kostiumów; typowo 2–5 minut. Wszystkie trzy mają **własny timecode, cue listy i czas trwania**. Interlude jest szczególnie ważne z perspektywy zarządzania czasem — to naturalny "bufor" do skrócenia, gdy brakuje czasu. W modelu danych: traktowane jako **elementy setlisty z typem** (song / intro / outro / interlude), nie jako osobna struktura.
  > **Dotyczy modułu:** `apps/api/src/setlist/` — pole `type` na elemencie setlisty: `song | intro | outro | interlude`

- Jakie metadane ma utwór poza czasem trwania? (tonacja, BPM, nastrój, wymagania sceniczne?)
  > **Odp.:** Na dużych produkcjach utwór niesie ze sobą sporo kontekstu: (1) **Czas trwania per wariant** — full: 4:20, short: 3:10, itd. (2) **BPM** — istotne dla DJ-owego flow i przejść między utworami. (3) **Tonacja** — ważna przy przejściach, żeby nie było dysonansu; mniej krytyczne w hip-hopie/popie, bardzo krytyczne w rocku/live band. (4) **Poziom energii** (skala, np. 1–10) — subiektywna ocena producenta/artysty, jak "mocny" jest utwór. (5) **Wymagania sceniczne** — czy wymaga przebudowy, specjalnej konfiguracji, gościa specjalnego, rekwizytu. (6) **Elementy techniczne** — lista powiązanych cue: światło, wideo, pirotechnika, konfetti, CO2, lasery. (7) **Flagi operacyjne** — `locked` (niepomijalny), `skippable`, `has_pyro` (załadowana pirotechnika), `requires_setup_time` (czas przygotowania przed utworem). (8) **Nastrój / tag dramaturgiczny** — np. "banger", "ballada", "intymny", "party", "epic closer". (9) **Notatki produkcyjne** — wolny tekst, uwagi showcallera/reżysera. Nie wszystko musi być w MVP, ale model danych powinien to przewidywać.
  > **Dotyczy modułu:** `apps/api/src/setlist/models.py` — metadane utworu i wariantu

- Czy są **zależności** między utworami? ("po X musi być Y", "X i Z nie mogą być obok siebie")
  > **Odp.:** Tak, zależności istnieją i są jednym z powodów, dla których zarządzanie setlistą jest trudne. Typy zależności: (1) **Twarda sekwencja** — "po intro MUSI być utwór X" (bo intro przechodzi płynnie w utwór, timecode jest ciągły, światło i wideo są zsynchronizowane). (2) **Wymóg bliskości** — "X i Y muszą być blisko siebie" (bo mają wspólną aranżację, tę samą konfigurację sceny, lub dramaturgicznie tworzą parę). (3) **Wykluczenie** — "X i Z nie mogą być obok siebie" (bo wymagają sprzecznej konfiguracji sceny, albo mają zbyt podobną energię i dramaturgicznie się "zjadają"). (4) **Wymóg czasu przygotowania** — "przed X musi być min. 3 min przerwy" (bo wymaga przebudowy sceny, załadowania pirotechniki, zmiany kostiumów). Na typowej dużej produkcji: 3–8 twardych zależności, które system musi respektować przy generowaniu rekomendacji.
  > **Dotyczy modułu:** `apps/api/src/setlist/` — model zależności (constraints/rules) między elementami setlisty

- Czy zależności wynikają z logistyki scenicznej (przebudowa), dramaturgii, czy obu?
  > **Odp.:** **Z obu, ale logistyka sceniczna tworzy twarde ograniczenia, a dramaturgia — miękkie.** Logistyczne (twarde, nieprzekraczalne): czas przebudowy sceny, ładowanie/rozładowanie pirotechniki, zmiana instrumentów (np. fortepian wjeżdża/wyjeżdża), zmiana kostiumów artysty, konfiguracja monitorów. Dramaturgiczne (miękkie, ale ważne): krzywa energetyczna (po balladzie nie kolejna ballada), kontrast emocjonalny, budowanie napięcia przed szczytem, gatunkowe flow. System StageBrain musi **respektować twarde ograniczenia bezwzględnie** (nigdy nie sugerować kolejności, która łamie logistykę) i **optymalizować pod miękkie** (rekomendować kolejność, która zachowuje dobrą dramaturgię, ale pozwolić showcallerowi ją złamać).
  > **Dotyczy modułu:** `apps/api/src/recommendations/` — podział constraints na hard (logistyka) i soft (dramaturgia) w algorytmie rekomendacji

- Jak dziś setlista jest dokumentowana — w jakim formacie? (Excel? PDF? dedykowane narzędzie?)
  > **Odp.:** Na dużych produkcjach: **mieszanka formatów, brak jednego standardu.** Najczęściej: (1) **Arkusz kalkulacyjny** (Excel / Google Sheets) — główny dokument planowania, z kolumnami: nr, tytuł, wariant, czas, uwagi, elementy techniczne. (2) **PDF / wydruk** — wersja "finalna" dystrybuowana ekipie przed koncertem; showcaller ma papierową kopię przy sobie jako backup. (3) **Dedykowane narzędzia do cue list** — np. CueLab, QLab — ale to narzędzia reżyserów świateł/dźwięku, nie showcallera. (4) **Notatki odręczne** — showcaller dopisuje na wydruku uwagi, czasy rzeczywiste, korekty. (5) **Komunikacja radiowa / chat** — zmiany w setliście komunikowane ustnie, potem nikt ich nie zapisuje. Kluczowa luka: **brak jednego źródła prawdy**, brak narzędzia, które łączy plan z rzeczywistością w czasie live. To jest dokładnie to, co StageBrain ma być.

- Kto tworzy setlistę i kto ją zatwierdza? Artysta? Manager? Reżyser?
  > **Odp.:** Na dużych produkcjach to proces kolaboracyjny, ale z jasną hierarchią: (1) **Artysta** — ma ostateczne słowo co do wyboru utworów i ich kolejności; to jego show, jego wizja artystyczna. (2) **Manager / tour manager** — wpływa na kontekst (kontraktowe wymagania, czas trwania, komercyjne priorytety — "ten singiel musi być zagrany, bo jest aktualnie promowany"). (3) **Reżyser / producent show** — doradza od strony dramaturgii i techniki ("ta kolejność nie działa produkcyjnie, bo nie zdążymy z przebudową" albo "ta krzywa energetyczna jest płaska"). (4) **Showcaller** — zazwyczaj nie tworzy setlisty, ale zna ją najlepiej operacyjnie; zgłasza uwagi czasowe i logistyczne. Proces: artysta + manager ustalają bazę → reżyser/producent dopracowuje pod kątem show → showcaller weryfikuje pod kątem czasu i logistyki → finalny dokument dystrybuowany ekipie.

- Czy setlista zmienia się między koncertami na tej samej trasie?
  > **Odp.:** **Tak, ale w ograniczonym zakresie.** Szkielet setlisty (segmenty, kluczowe hity, struktura dramaturgiczna) pozostaje stały przez całą trasę — jest za dużo zaprogramowanych elementów (timecode, światło, wideo, pirotechnika), żeby zmieniać go codziennie. Natomiast **zmienia się**: (1) 2–5 utworów "rotacyjnych" — wymieniane między koncertami, żeby show było świeże (szczególnie dla fanów odwiedzających wiele dat). (2) Kolejność wewnątrz segmentu — drobne przetasowania. (3) Warianty — na jednym koncercie full, na innym short, zależnie od czasu i energii. (4) Reakcja na lokalne konteksty — "w Krakowie zagramy X, bo tu ma to specjalne znaczenie". (5) Ewolucja trasy — po kilku koncertach produkcja widzi, co działa, co nie, i modyfikuje plan. System StageBrain powinien pozwalać na **klonowanie setlisty z poprzedniego koncertu jako bazy** i modyfikowanie pod następny event.
  > **Dotyczy modułu:** `apps/api/src/setlist/` — klonowanie setlisty, wersjonowanie, historia zmian per event

- Co to znaczy "utwór jest zaprogramowany"? Co konkretnie jest przypisane do utworu? (cue listy, timecode, pirotechnika?)
  > **Odp.:** "Zaprogramowany" oznacza, że utwór ma **precyzyjnie przypisane elementy techniczne, zsynchronizowane z muzyką, często na timecode**. Konkretnie: (1) **Timecode** — ścieżka czasowa, do której synchronizują się wszystkie systemy; muzyka "biegnie" na timerze i każdy cue odpalany jest w konkretnej sekundzie/klatce. (2) **Cue listy oświetleniowe** — dziesiątki do setek cue na utwór (zmiana koloru, intensywności, ruchu głów ruchomych); zaprogramowane na konsoli (grandMA, Avolites). (3) **Cue wideo** — content na ekranach LED, projekcjach; zsynchronizowany z timecode. (4) **Pirotechnika** — jeśli przypisana: dokładny moment odpalenia (co do sekundy), wymagana wcześniejsza załadunek i uzbrojenie. (5) **Konfetti / CO2 / lasery / inne efekty specjalne** — każdy z osobnym cue. (6) **Ruch sceniczny** — platformy, podnośniki, ruchome elementy scenografii. (7) **Automatyka dźwięku** — snapshoty miksera, zmiany monitora. Kluczowa implikacja dla StageBrain: zmiana wariantu utworu (full → short) oznacza **inny zestaw cue**, a pominięcie utworu z pirotechniką oznacza konieczność bezpiecznego rozładowania. System nie musi zarządzać cue listami, ale musi **wiedzieć, jakie konsekwencje techniczne** ma każda zmiana.
  > **Dotyczy modułów:**
  > - `apps/api/src/setlist/models.py` — metadane techniczne per utwór/wariant (has_pyro, has_timecode, technical_requirements)
  > - `apps/api/src/recommendations/` — uwzględnianie konsekwencji technicznych w rekomendacjach

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
  > **Odp.:** Wszystkie wymienione, z priorytetyzacją zależną od kontekstu. Gdy jest opóźnienie — czas dominuje. Gdy czas jest OK — energia i dramaturgia dominują. Ograniczenia techniczne (pirotechnika załadowana, przebudowa sceny) są zawsze twarde i filtrują opcje przed rankingiem. Kryteria: (1) ograniczenia twarde (czas przygotowania technicznego, zależności między utworami, elementy niepomijalne), (2) czas do curfew i aktualne opóźnienie, (3) aktualny poziom engagement i trend, (4) krzywa dramaturgiczna (kontrast energetyczny vs poprzedni utwór), (5) historyczna skuteczność utworu w podobnym kontekście.
  > **Dotyczy modułu:** `apps/api/src/recommendations/` — silnik rekomendacji, ważenie kryteriów

- Jak ważyć te kryteria wobec siebie? (co wygrywa — czas czy energia?)
  > **Odp.:** Dynamiczne ważenie zależne od sytuacji. Gdy opóźnienie < 2 min → czas ma niską wagę, energia i dramaturgia dominują. Gdy opóźnienie 2–5 min → czas i energia mają równą wagę. Gdy opóźnienie > 5 min → czas dominuje, rekomendacje skupiają się na scenariuszach odzysku. Ograniczenia twarde (bezpieczeństwo, kontraktowe, techniczne) zawsze mają najwyższy priorytet — niezależnie od czasu czy energii. Progi powinny być konfigurowalne per show.
  > **Dotyczy modułu:** `apps/api/src/recommendations/` — algorytm ważenia, konfigurowalne progi

- Czy showcaller chce widzieć jedną rekomendację, top 3, czy pełny ranking?
  > **Odp. / Decyzja:** Model **"top rekomendacja + 2–3 alternatywy"**. Jedna główna rekomendacja wyświetlana wyraźnie (duża, łatwa do kliknięcia jednym tapem). Poniżej 2–3 alternatywy z jasnym porównaniem. Nigdy więcej niż 4–5 opcji naraz — paraliż decyzyjny pod stresem. Uzasadnienie: (1) w 90% przypadków showcaller weźmie top rekomendację — szybko i bez myślenia, (2) w 10% ma kontekst, którego system nie zna — wtedy scrolluje i wybiera alternatywę, (3) pełny ranking jest zbyt przytłaczający w warunkach backstage.
  > **Dotyczy modułu:** `apps/web/src/features/live-panel/` — komponent rekomendacji i scenariuszy odzysku czasu

- Jak prezentować "pewność" rekomendacji? (czy system powinien mówić "pewne 85%" vs "sugestia"?)
  > **Odp.:** Nie pokazywać procenta pewności — showcaller nie ma czasu interpretować "73% vs 81%". Zamiast tego: **poziom ryzyka** przy każdej opcji (niskie / średnie / wysokie), wyrażony kolorem i etykietą. Ryzyko = agregacja czynników: czy utwór jest kontraktowy, czy wymaga przebudowy, jaki wpływ na dramaturgię, czy to testowana opcja (dane historyczne) czy nowa. Dodatkowo przy każdej opcji: krótkie uzasadnienie w 3–5 słowach (np. "sprawdzony banger", "wymaga przebudowy", "niski kontrast energetyczny").
  > **Dotyczy modułu:** `apps/web/src/features/live-panel/` — wyświetlanie ryzyka i uzasadnień przy rekomendacjach

- Jakie scenariusze odzyskiwania czasu są realistyczne? (skrócenie utworu, pominięcie, zmiana kolejności, skrócenie przerwy?)
  > **Odp.:** Wszystkie wymienione są realistyczne i powinny być dostępne jako opcje. Przy każdym scenariuszu system pokazuje: (1) **nazwę akcji** — co dokładnie robimy ("Skróć utwór #3 → short", "Pomiń utwór #6"), (2) **oszczędność czasu** w minutach/sekundach — najważniejsza liczba, (3) **czy to wystarczy** — czy ta zmiana zamyka problem, czy trzeba więcej, (4) **poziom ryzyka** — niskie/średnie/wysokie, (5) **wpływ na dramaturgię** — krótki sygnał ("usuwa szczyt energetyczny" / "brak wpływu"). Dodatkowo system powinien umieć prezentować **scenariusze złożone** — kombinację kilku mniejszych zmian, które razem dają wymagany zysk czasowy (np. "Skróć #3 + pomiń interlude + skróć przejście = -5:10"). To jest największa wartość StageBrain — liczy za showcallera.
  > **Dotyczy modułów:**
  > - `apps/api/src/shows/` — silnik generowania scenariuszy odzysku czasu
  > - `apps/web/src/features/live-panel/` — komponent wyświetlania scenariuszy (pojedynczych i złożonych)

- Czy istnieją rekomendacje, które system **nie powinien** dawać? (np. nigdy nie sugeruj pominięcia głównego hitu)
  > **Odp.:** Tak. System **nigdy** nie sugeruje pominięcia: (1) utworów oznaczonych jako "kontraktowe" (wymóg promotora/sponsora), (2) elementów sponsorskich, (3) utworów powiązanych z pirotechniką już załadowaną (bezpieczeństwo), (4) elementów krytycznie powiązanych z timecode'em (synchronizacja systemów). Te elementy powinny mieć w modelu danych flagę `locked: true` / `skippable: false` i być wizualnie oznaczone w UI (np. ikoną kłódki). Silnik rekomendacji filtruje je przed wygenerowaniem opcji — nigdy nie pojawiają się jako kandydaci do pominięcia.
  > **Dotyczy modułów:**
  > - `apps/api/src/setlist/` — model danych: flaga `skippable` na segmencie/wariancie
  > - `apps/api/src/recommendations/` — filtrowanie zablokowanych elementów
  > - `apps/web/src/features/live-panel/` — wizualne oznaczenie elementów zablokowanych (ikona kłódki)

- Jak system powinien się zachować, gdy nie ma dobrej opcji?
  > **Odp.:** System powinien jasno to zakomunikować, a nie na siłę podawać słabą rekomendację. Komunikat w stylu: "Brak opcji odzysku czasu bez wysokiego ryzyka" + lista tego, co sprawdzono i dlaczego nie pasuje. W tej sytuacji showcaller musi eskalować do producenta/artysty — system może to zasugerować. Alternatywnie: pokazać opcje oznaczone jako "wysokie ryzyko" z jasnym ostrzeżeniem, żeby showcaller miał pełen obraz i sam zdecydował. Lepsze "nie wiem, oto sytuacja" niż fałszywie pewna rekomendacja.
  > **Dotyczy modułu:** `apps/web/src/features/live-panel/` — stan "brak rekomendacji" / tryb eskalacji

- Czy rekomendacje powinny uwzględniać historię z poprzednich koncertów na tej samej trasie?
  > **Odp.:** Tak — to kluczowa wartość Wariantu B (ML). Dane historyczne z poprzednich koncertów: (1) skuteczność danego utworu w podobnym kontekście (engagement delta po zagraniu), (2) typowy overrun per utwór (czy ten utwór regularnie trwa dłużej niż plan), (3) jakie scenariusze odzysku były stosowane i czy zadziałały. Na start (cold start, brak historii) system działa na regułach + profilu gatunkowym. Z każdym koncertem model się uczy. Dane historyczne trafiają do modelu LightGBM jako features.
  > **Dotyczy modułów:**
  > - `apps/api/src/recommendations/` — features historyczne w modelu ML
  > - `apps/api/src/analytics/` — zapis i agregacja danych historycznych per utwór/artysta

---

## 9. UI / panel operatora — jak to ma wyglądać i działać

System musi być użyteczny pod presją czasu i stresu.

### Pytania:

- Na jakim urządzeniu showcaller będzie korzystał z systemu? (tablet, laptop, dedykowany monitor?)
- Ile czasu showcaller może poświęcić na patrzenie w ekran?
- Jakie informacje muszą być widoczne **zawsze** (bez interakcji)?
  > **Odp.:** Showcaller potrzebuje widzieć bez jakiejkolwiek interakcji: (1) **Aktualny utwór** — nazwa, grany wariant (full/short), pasek postępu lub odliczanie do końca. (2) **Następny utwór** w kolejce (+ wariant). (3) **Zegar absolutny** — aktualny czas (hh:mm:ss), duży, jednoznaczny. (4) **Czas do curfew** — odliczanie, najważniejsza liczba na ekranie. (5) **Delta opóźnienia** — ile jesteśmy przed/za planem (np. "+2:40" na czerwono, "-0:30" na zielono). (6) **Engagement score / wskaźnik energii** — prosty, wizualny (pasek, kolor, trend strzałką w górę/w dół), nie liczba do analizowania. (7) **Status systemu** — czy audio działa, czy jest połączenie — minimalny sygnał "zielona lampka". To jest dokładnie to, co showcaller dziś ma w głowie lub na kartce i zegarku — system to konsoliduje w jedno miejsce.
  > **Dotyczy modułu:** `apps/web/src/features/live-panel/` — główny widok panelu live

- Jakie informacje mogą być "na żądanie" (po kliknięciu/tapnięciu)?
  > **Odp.:** Informacje dostępne po interakcji: (1) **Scenariusze odzysku czasu** — "co jeśli skrócimy X", "co jeśli pominiemy Y" z kalkulacją zysku czasowego. (2) **Rekomendacje zmian w setliście** — top rekomendacja + 2–3 alternatywy. (3) **Szczegóły utworu** — pełne metadane, powiązane elementy techniczne, czas przygotowania, flagi (locked/skippable). (4) **Pełna setlista z edycją** — widok wszystkich pozostałych utworów z możliwością przestawiania. (5) **Historia decyzji / log show** — co zmieniono, kiedy, jakie tagi dodano. (6) **Szczegóły engagement** — rozbudowany wykres energii, trend historyczny w ramach koncertu. (7) **Informacje o venue** — curfew szczegóły, parametry kalibracji. Logika: "zawsze widoczne" = to, na co showcaller patrzy co 30 sekund. "Na żądanie" = to, czego potrzebuje przy podejmowaniu decyzji (między utworami, 30–90 sekund okna decyzyjnego).
  > **Dotyczy modułu:** `apps/web/src/features/live-panel/` — panele szczegółów, scenariusze, widok setlisty

- Jak duży tekst / elementy UI muszą być? (oświetlenie backstage, odległość od ekranu)
  > **Odp.:** Showcaller na dużych produkcjach siedzi przy dedykowanym stanowisku backstage lub w reżyserce, z ekranem na wyciągnięcie ręki do ~1 metra. Urządzenie to najczęściej laptop lub tablet (iPad Pro 12.9" to standard w branży) — rzadziej dedykowany monitor, bo stanowisko jest mobilne między venue. Backstage jest ciemny lub półciemny — jedyne światło to ekrany, bluebox, ewentualnie punktowe lampki z kolorowym filtrem (niebieskim/czerwonym). Odległość od ekranu: 40–80 cm. Stąd wymagania: (1) **Minimum 18–20px font bazowy**, kluczowe liczby (czas, delta) **znacznie większe — 32–48px**. (2) **Wysoki kontrast** — nie subtelne szarości, ale wyraźne kolory na ciemnym tle. (3) **Elementy klikalne na dotyk: minimum 44×44px** (Apple HIG) — palce, nie precyzyjny kursor. (4) **Brak drobnych detali** — informacja musi "wskakiwać" bez fokusowania wzroku, showcaller patrzy kątem oka. (5) Preferowany układ: **duże bloki informacyjne**, nie gęsty dashboard.
  > **Dotyczy modułu:** `apps/web/src/features/live-panel/` — design system, typografia, rozmiary komponentów

- Czy interfejs powinien działać w trybie ciemnym? (backstage jest ciemny)
  > **Odp.:** Tak, **wyłącznie ciemny tryb — bez opcji jasnego**. Backstage na dużych produkcjach jest celowo ciemny — oświetlenie ograniczone do minimum, żeby nie "wyciekało" na scenę i nie rozpraszało artystów/ekipy. Jasny ekran w ciemnym pomieszczeniu to: źródło oślepienia dla showcallera (utrata adaptacji wzroku do ciemności), potencjalne rozproszenie dla osób w pobliżu, widoczny "świecący prostokąt" niepożądany na backstage. Branżowy standard: ciemne tła, przytłumione barwy bazowe, a kolory sygnałowe (czerwony alert, zielony OK, żółty uwaga) jako jedyne jasne elementy. Analogia: konsola oświetleniowa, mikser — wszystko ma ciemne UI.
  > **Dotyczy modułu:** `apps/web/` — globalny theme, dark mode jako jedyny tryb

- Jak showcaller wchodzi w interakcję — dotyk, klawiatura, skróty klawiszowe?
  > **Odp.:** Główna interakcja: **dotyk (tablet) lub mysz/trackpad (laptop)**. Showcaller ma przed sobą urządzenie i klika/tapuje między utworami. Klawiatura fizyczna jest mało prawdopodobna jako główny input — showcaller ma zajęte ręce (radio w jednej, notatki/telefon w drugiej), często stoi lub się przemieszcza. Skróty klawiszowe mogą być bonusem, ale nie jedynym sposobem interakcji — dotyk musi wystarczyć. Na tablecie: duże przyciski, swipe'y, jedno tapnięcie = jedna akcja. Showcaller pracuje jednocześnie z radiem (push-to-talk), więc interakcja z systemem musi być **jednoręczna**. Podsumowanie: **touch-first, mouse/trackpad jako secondary**, skróty klawiszowe jako opcjonalne usprawnienie dla tych, którzy pracują na laptopie.
  > **Dotyczy modułu:** `apps/web/src/features/live-panel/` — interakcje dotykowe, responsywność, opcjonalne keybindings

- Co to są "manualne tagi" — jak szybko muszą być dodane? Jedno kliknięcie? Głos?
  > **Odp.:** Manualne tagi to szybkie oznaczenia kontekstowe, które showcaller dodaje w trakcie koncertu, żeby oznaczyć sytuacje, których system sam nie wykryje. Przykłady: "problem techniczny" (mikrofon padł, timecode się rozjechał), "artysta improwizuje" (gadka z publicznością), "energia spada" (showcaller widzi coś, czego audio nie łapie), "przebudowa trwa dłużej", "świetna reakcja". **Szybkość dodawania: jedno tapnięcie/kliknięcie.** Predefiniowane tagi (6–8 najczęstszych) jako duże przyciski, zawsze dostępne. Nie pisanie tekstu — za wolne i za bardzo angażuje uwagę. **Głos: nie w MVP** — backstage jest głośny (muzyka, radio, rozmowy), rozpoznawanie mowy byłoby zawodne; poza tym showcaller mówi do radia, mikrofon łapałby komendy produkcyjne zamiast tagów. Opcjonalnie: możliwość szybkiej notatki tekstowej (3–5 słów), ale jako secondary — do użycia w spokojniejszym momencie.
  > **Dotyczy modułów:**
  > - `apps/web/src/features/live-panel/` — komponent tagów (predefiniowane przyciski + opcjonalna notatka)
  > - `apps/api/src/shows/` — zapis tagów z timestampem

- Czy system musi działać offline (bez internetu)?
  > **Odp.:** **W MVP (Wariant B): nie.** System działa w chmurze, wymaga połączenia internetowego. Hale koncertowe i stadiony na dużych produkcjach mają infrastrukturę sieciową (dedykowany internet dla produkcji, czasem LTE/5G backup). Na tym poziomie produkcji internet jest dostępny. **W przyszłości (Wariant C i dalej): tak, to będzie wymóg.** Na festiwalach open-air, w mniejszych/starszych obiektach, na trasach zagranicznych — łączność bywa niestabilna. Tryb hybrydowy (edge/offline) jest świadomie zaplanowany na Wariant C.

- Jakie powiadomienia / alerty system powinien wysyłać? Dźwiękowe? Wizualne?
- Czy ktoś inny poza showcallerem patrzy na ten sam panel? (reżyser, producent, artysta?)
  > **Odp.:** **Na początku (MVP): nie. Jeden panel, jeden użytkownik — showcaller.** W praktyce dużych produkcji: showcaller jest głównym operatorem, producent/tour manager czasem zagląda przez ramię, ale nie operuje systemem — komunikacja idzie radiem. Reżyser świateł/wideo ma swoje narzędzia (konsolę, CueLab, itp.) i nie potrzebuje StageBrain. Artysta nie widzi żadnego panelu — informacje dostaje przez in-ear od showcallera lub managera na boku sceny. **W przyszłości** (poza MVP) sensowne byłoby: read-only view dla producenta na drugim urządzeniu, uproszczony dashboard dla tour managera (czas, delta, status, bez detali setlisty). To adresuje Wariant C pod "role użytkowników". Na razie: **jeden panel, jeden operator, zero komplikacji z uprawnieniami.**
  > **Dotyczy modułu:** `apps/web/` — w MVP brak multi-user; w przyszłości (Wariant C) osobne widoki per rola

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
