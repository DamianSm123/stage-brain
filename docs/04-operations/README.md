# Operations & Maintenance

**Status**: Active
**Ostatni przegląd**: 2026-02-09
**Właściciel**: Michał Lewandowski

Ten katalog zawiera dokumentację operacyjną systemu OpsDesk. Skupiamy się na utrzymaniu stabilności, monitoringu oraz procedurach reagowania na awarie.

## Zawartość

### 1. Środowiska i Wdrożenia
- [Środowiska (DEV/UAT/PROD)](./environments.md) - Konfiguracja i różnice między środowiskami.
- [Release & Rollback](./release-and-rollback.md) - Procedury wdrażania nowych wersji i cofania zmian.
- [Polityka Backupów i Odtwarzania](./backup-and-recovery.md) - Strategia backupów, retencji i Disaster Recovery.

### 2. Monitoring i Obserwowalność
- [SLO & SLI](./monitoring/slo-sli.md) - Cele poziomu usług i wskaźniki (Service Level Objectives).
- [Dashboards](./monitoring/dashboards.md) - Kluczowe metryki i wizualizacje.
- [Alerty](./monitoring/alerts.md) - Definicje alarmów i progi.

### 3. Runbooki (Procedury Operacyjne)
- [Runbooks](./runbooks/README.md) - Gotowe instrukcje rozwiązywania znanych problemów.
- [Szablon Runbooka](../06-templates/runbook.md)
- [Critical: Queue / Worker Failure](./runbooks/critical-queue-worker-failure.md)

### 4. Zarządzanie Incydentami
- [On-Call](./incident-management/on-call.md) - Zasady dyżurów i ścieżki eskalacji.
- [Postmortems](./incident-management/postmortems/README.md) - Analizy powłamaniowe/poawaryjne.
- [Szablon Postmortem](../06-templates/postmortem.md)

## Kluczowe zasady

1.  **Don't Panic**: W przypadku awarii postępuj zgodnie z runbookami.
2.  **Automatyzacja**: Preferujemy automatyczny rollback i Infrastructure as Code (gdzie możliwe w kontekście PaaS).
3.  **Transparencja**: Każdy incydent kończy się postmortem (bez obwiniania - *blameless*).
