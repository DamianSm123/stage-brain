# Wymagania Niefunkcjonalne (NFR)

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Deweloper / AI

---

## 1. Real-time i Latencja

- **Okna analizy audio**: 5-10 sekund. System przetwarza audio w buforowanych oknach i produkuje [engagement score](../00-start-here/glossary.md#engagement-score) co ~5 sekund.
- **End-to-end latencja**: Akceptowalna do ~10-15 sekund (od momentu reakcji publiczności do wyświetlenia metryki na panelu). System jest analityczny, nie muzyczny.
- **WebSocket reconnect**: < 10 sekund po utracie połączenia.
- **Aktualizacja panelu**: Dane na panelu operatora odświeżane w czasie rzeczywistym przez [WebSocket](../00-start-here/glossary.md#websocket).

## 2. Niezawodność i Fail-safe

- **[Fail-safe](../00-start-here/glossary.md#fail-safe)**: Awaria systemu nie może blokować realizacji koncertu. Gdy backend niedostępny → panel pokazuje ostatni znany stan + badge "OFFLINE" → koncert idzie dalej klasycznie.
- **System nie jest single point of failure**: Żaden element techniczny StageBrain nie jest krytyczny dla przebiegu koncertu.
- **Auto-recovery**: Docker `restart: always` podnosi serwis w 2-5 sekund. Frontend trzyma ostatnie dane w pamięci i wyświetla je do momentu reconnectu.
- **Stabilność**: System musi działać stabilnie przez minimum 90 minut bez restartu (typowy czas koncertu).
- **Stan w Redis**: Po reconnect klient dostaje aktualny snapshot stanu z Redis.

## 3. Wydajność

- **Skala MVP**: Jeden koncert na raz, jeden operator. System nie musi obsługiwać wielu równoległych show.
- **Audio bandwidth**: ~32-64 kbps (PCM 16kHz mono lub Opus). Minimalny wymagany bandwidth na venue.
- **API response time**: < 500ms dla standardowych operacji REST.
- **ML inference**: ~1ms (LightGBM na danych tabelarycznych).
- **Audio processing**: Przetwarzanie okna 5-10s audio (librosa + YAMNet) musi zakończyć się przed nadejściem następnego okna.

## 4. UX Panelu Operatora

> Panel musi być zaprojektowany pod warunki backstage — ciemno, głośno, stres, rękawiczki.

- **Ciemny motyw** (domyślny) — jasny ekran oślepia w backstage.
- **Duże elementy dotykowe** — minimum 48px, obsługa na tablecie w rękawiczkach.
- **Wysoki kontrast** — kolory statusowe (zielony/żółty/czerwony) jasno czytelne.
- **Minimalna ilość kliknięć** do decyzji — 1-2 tapy max.
- **Stabilny layout** — żadnych przesunięć elementów przy aktualizacji danych real-time.
- **Urządzenia**: Tablet lub laptop z przeglądarką Chrome. Bez aplikacji mobilnej.

## 5. Bezpieczeństwo (MVP)

- **Autentykacja**: Prosty mechanizm (API key lub JWT z jednym kontem operatora). System uprawnień i role — poza zakresem MVP (Wariant C).
- **Dane audio**: System nie przechowuje nagrań audio długoterminowo — przetwarza w oknach i zapisuje tylko metryki.
- **Brak danych osobowych**: System nie przetwarza PII. Nie rozpoznaje twarzy, nie identyfikuje osób, nie analizuje emocji jednostek.
- **Prywatność**: Audio publiczności jest przetwarzane wyłącznie do obliczenia metryk zagregowanych.

## 6. Infrastruktura i Koszty

- **Budżet infrastruktury**: 200-800 PLN/miesiąc (pilot / testy).
- **Koszt pojedynczego eventu** (1,5h): Pojedyncze PLN do kilkunastu PLN.
- **Hosting**: Docker Compose na VPS (Hetzner Cloud lub DigitalOcean). Bez PaaS, bez Kubernetes.
- **Sieć na venue**: Stabilne połączenie internetowe (Wi-Fi lub LTE hotspot). Latencja do ~2s akceptowalna.

## 7. Ograniczenia MVP Plus

- **Język UI**: Angielski.
- **Jedno show na raz**: Brak trybu multi-venue / multi-tour.
- **Jeden operator**: Brak systemu ról i uprawnień.
- **Tylko chmura**: Brak trybu offline/edge (Wariant C).
- **Tylko audio**: Brak modułu wideo (opcja po MVP Plus).
- **Import setlisty**: CSV na start. Format rozszerzamy po warsztacie z TINAP.
