# Pre-show Setup (Operator)

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Deweloper / AI

---

## Cel

Operator przygotowuje system StageBrain do koncertu: konfiguruje show, importuje setlistę, ustawia venue i kalibrację, testuje audio. Po zakończeniu setup'u system jest gotowy do startu show.

## Aktorzy

- [Operator](../../personas.md#2-operator)
- System StageBrain

## Warunki Wstępne

- Operator ma dostęp do panelu StageBrain (URL + autentykacja).
- Setlista jest przygotowana (CSV lub dane do ręcznego wpisania).
- Znany jest curfew i venue.
- Mikrofon/laptop przy FOH jest podłączony i ma dostęp do internetu.

## Kroki

### 1. Tworzenie Show
1. Operator otwiera panel StageBrain w przeglądarce.
2. Wybiera "New Show" (lub kontynuuje draft).
3. Wypełnia: nazwa show, data, venue (wybór z listy lub tworzenie nowego), curfew.

### 2. Import / Konfiguracja Setlisty
1. Operator importuje setlistę z CSV (drag & drop lub file picker).
2. System parsuje CSV → tworzy segmenty z wariantami (full/short).
3. Operator weryfikuje: kolejność, czasy, warianty, nazwy.
4. Opcjonalnie: drag & drop do zmiany kolejności, edycja czasów, dodanie notatek.

### 3. Konfiguracja Venue i Kalibracja
1. Operator wybiera venue (istniejące lub tworzy nowe → typ, pojemność).
2. System ładuje preset kalibracji (lub ostatnią kalibrację dla tego venue).
3. Operator weryfikuje parametry kalibracji (energy baseline, sensitivity, noise floor).
4. Opcjonalnie: koryguje parametry (sliders).

### 4. Test Audio
1. Operator otwiera stronę Audio Source na laptopie przy FOH (oddzielna karta/urządzenie).
2. Przeglądarka prosi o dostęp do mikrofonu → operator akceptuje.
3. System rozpoczyna przechwytywanie audio i pokazuje na panelu:
   - Wizualizacja poziomu dźwięku (baseline energy).
   - Status połączenia WebSocket.
   - Klasyfikacja YAMNet (co słyszy: cisza / szum / muzyka).
4. Operator weryfikuje, że dane napływają i wyglądają sensownie.
5. Opcjonalnie: koryguje kalibrację na podstawie testu.

### 5. Start Show
1. Operator widzi checklist gotowości:
   - ✅ Setlista: X segmentów, czas łączny: Y min
   - ✅ Venue: [nazwa], kalibracja: [preset]
   - ✅ Curfew: HH:MM
   - ✅ Audio: Connected, baseline OK
2. Operator tapuje "Start Show".
3. Panel przechodzi do trybu Live.

## Kryteria Akceptacji

- Show nie może wystartować bez: setlisty (min. 1 segment), venue, curfew, połączenia audio.
- Import CSV obsługuje UTF-8 i polskie znaki.
- Kalibracja jest snapshottowana przy starcie show (późniejsze zmiany presetu nie wpływają na trwający show).
- Test audio daje feedback w < 10 sekund od uruchomienia mikrofonu.
- Cały setup (od otwarcia panelu do Start Show) powinien być możliwy w < 10 minut przy przygotowanej setliście.

## Edge Cases

- **Brak połączenia audio**: System pozwala wystartować z ostrzeżeniem — show może działać bez audio (tylko time tracking + ręczne tagi).
- **Setlista pusta**: Button "Start Show" nieaktywny.
- **Venue bez kalibracji**: System ładuje domyślny preset i pokazuje ostrzeżenie.

## Linki

- Następny krok: [Live Show](./live-show.md)
- Features: [dynamic-setlist.md](../../features/dynamic-setlist.md), [venue-calibration.md](../../features/venue-calibration.md), [audio-analysis.md](../../features/audio-analysis.md)
