# Monitoring i Obserwowalność

Ta sekcja opisuje strategię monitorowania systemu OpsDesk, zdefiniowane cele jakości usług (SLO) oraz konfigurację alertów.

## Podejście

Opieramy się na "Złotych Sygnałach" (Golden Signals) Google SRE:
1.  **Latency** (Opóźnienie) - Jak długo trwa obsługa żądania.
2.  **Traffic** (Ruch) - Ile żądań obsługujemy.
3.  **Errors** (Błędy) - Jaki procent żądań kończy się błędem.
4.  **Saturation** (Nasycenie) - Jak bardzo obciążone są zasoby (CPU/RAM).

## Narzędzia

W fazie MVP korzystamy głównie z wbudowanych narzędzi dostawcy chmury / PaaS:
*   **PaaS Insights**: Monitoring kontenerów (CPU, RAM, Restart Count).
*   **Managed Databases Insights**: Monitoring bazy danych.
*   **Logi Aplikacji**: Dostępne w runtime (stdout/stderr).

## Dokumenty szczegółowe
*   [SLO & SLI](./slo-sli.md) - Cele, do których dążymy.
*   [Dashboards](./dashboards.md) - Co obserwujemy na co dzień.
*   [Alerty](./alerts.md) - Kiedy system nas budzi.
