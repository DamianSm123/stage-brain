# Alerty (Alerting Policy)

**Status**: Draft
**Ostatni przegląd**: 2026-02-02
**Właściciel**: Michał Lewandowski

---
Zasady powiadamiania o problemach w systemie.

## Kanały komunikacji
1.  **E-mail**: Dla alertów o niższym priorytecie (Warning).
2.  **Slack (`#alerts`)**: Dla wszystkich powiadomień.

## Definicje Alertów

### 1. Krytyczne (P1) - Reakcja natychmiastowa
*   **High Error Rate**: > 5% błędów HTTP 5xx przez 5 minut.
    *   *Akcja*: Sprawdź logi, rozważ Rollback.
*   **Database Down**: Brak łączności z bazą danych lub CPU bazy > 95%.
    *   *Akcja*: Sprawdź status dostawcy, skaluj bazę w górę.
*   **Container Restarts Loop**: Kontener restartuje się > 5 razy w ciągu godziny.
    *   *Akcja*: Prawdopodobny błąd w kodzie startowym lub brak pamięci (OOM).

### 2. Ostrzegawcze (P2) - Reakcja w godzinach pracy
*   **High Latency**: p95 > 1s przez 10 minut.
    *   *Akcja*: Analiza wydajności, optymalizacja zapytań.
*   **Resource Saturation**: Użycie CPU/RAM > 80% przez 15 minut.
    *   *Akcja*: Planowanie skalowania horyzontalnego.
*   **Storage Warning**: Zajętość dysku bazy > 80%.
*   **Worker Down**: Brak heartbeat / brak przetwarzania jobów przez X minut.
    *   *Akcja*: Sprawdź worker, zrestartuj lub rollback.
*   **Queue Backlog**: Wiek najstarszego joba > X minut.
    *   *Akcja*: Sprawdź Redis/Worker, rozważ skalowanie.

## Konfiguracja
Alerty są konfigurowane w panelu dostawcy chmury / PaaS ("Monitoring" -> "Alert Policies").
