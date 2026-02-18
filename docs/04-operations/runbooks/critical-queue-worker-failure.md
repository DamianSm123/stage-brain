# Runbook: Awaria Kolejki / Workera

**Status**: Draft
**Priorytet**: **P1 (Critical)**
**Właściciel**: Katarzyna Wójcik

---

## 1. Symptomy
*   **Alert**: `QueueBacklogCritical` (np. rosnąca kolejka lub wiek najstarszego joba > X min).
*   **Alert**: `WorkerDown` (brak heartbeat / brak przetworzonych jobów).
*   **Zgłoszenia**: Użytkownicy nie dostają maili (nowe zgłoszenie, akceptacje, SLA reminder), a statusy "automatów" nie postępują.
*   **Logi**: Błędy połączenia z Redis (`ECONNREFUSED`, timeouty) lub powtarzające się wyjątki w jobach.

## 2. Impact
*   Opóźnione lub brakujące powiadomienia.
*   Eskalacje SLA i autozamknięcia nie działają w terminie.
*   Backlog może rosnąć i powodować efekt domina (więcej retry, większe obciążenie).

## 3. Diagnostyka
1.  Sprawdź status infrastruktury (Redis/Worker) w panelu dostawcy chmury / PaaS.
2.  Sprawdź metryki kolejki:
    *   liczba jobów `waiting/active/failed`
    *   wiek najstarszego joba
    *   tempo przetwarzania (jobs/min)
3.  Sprawdź logi Workera i API pod kątem błędów Redis i błędów przetwarzania.

## 4. Rozwiązanie

### Scenariusz A: Worker nie działa / crash loop
1.  Zrestartuj proces Workera.
2.  Jeśli restart nie pomaga, wykonaj rollback do poprzedniej wersji (patrz: [Release & Rollback](../release-and-rollback.md)).

### Scenariusz B: Redis niedostępny
1.  Sprawdź status usługi Redis (Managed Redis) i ewentualny maintenance.
2.  Jeśli to problem z limitami (połączenia/CPU/RAM), rozważ skalowanie.
3.  Po przywróceniu Redis zweryfikuj, czy joby są pobierane i przetwarzane.

### Scenariusz C: Joby failują (wysoki fail rate)
1.  Zidentyfikuj dominujący typ joba i powód (np. błąd dostawcy email, błąd walidacji payload).
2.  Jeśli błąd wynika z ostatniego deploymentu -> rollback.
3.  Jeśli błąd wynika z zależności zewnętrznej (Email Provider) -> zastosuj retry/backoff i rozważ tymczasowe ograniczenie wolumenu.

## 5. Weryfikacja
1.  Backlog kolejki maleje, a tempo przetwarzania wraca do normy.
2.  Nowe joby są przetwarzane bez błędów.
3.  Powiadomienia zaczynają wychodzić (test: utwórz zgłoszenie na DEV/UAT).

## 6. Eskalacja
Jeśli problemu nie da się rozwiązać w ciągu 30 minut:
1.  Powiadom Tech Leada.
2.  Ogranicz generowanie jobów (tymczasowy feature flag dla wybranych powiadomień), jeśli system zaczyna się destabilizować.
3.  Rozpocznij procedurę incydentu i przygotuj postmortem.
