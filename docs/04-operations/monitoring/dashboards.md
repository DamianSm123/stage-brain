# Dashboards

**Status**: Draft
**Ostatni przegląd**: 2026-02-02
**Właściciel**: Michał Lewandowski

---
Opis kluczowych widoków monitoringu dostępnych dla operatorów systemu.

## 1. PaaS / Hosting Platform Overview
Główny dashboard zdrowia aplikacji.

### Wykresy:
*   **CPU Usage**: Średnie zużycie CPU przez wszystkie instancje. Ostrzeżenie przy > 70%.
*   **Memory Usage**: Zużycie RAM. Ostrzeżenie przy > 80%.
*   **Restart Count**: Liczba restartów kontenera. Powinna wynosić 0. Każdy skok oznacza crash aplikacji (OOM lub błąd krytyczny).
*   **Bandwidth**: Ruch sieciowy przychodzący/wychodzący.

## 2. Database Insights (PostgreSQL)
Stan bazy danych.

### Wykresy:
*   **Connection Count**: Liczba aktywnych połączeń. Nie może przekroczyć limitu planu (np. 100).
*   **CPU / Memory**: Obciążenie serwera bazy.
*   **Disk I/O**: Operacje zapisu/odczytu. Wysokie użycie może sugerować brak indeksów.
*   **Disk Usage**: Zajętość dysku.

## 3. Queue / Worker Dashboard
Do monitorowania zadań asynchronicznych.

*   **Backlog Size**: Liczba jobów oczekujących.
*   **Oldest Job Age**: Wiek najstarszego joba.
*   **Job Failure Rate**: Procent jobów zakończonych błędem.

## 4. Email Provider Dashboard (Zewnętrzny)
Do monitorowania dostarczalności maili.

*   **Delivery / Bounce Rate**: Skuteczność dostarczania.
*   **Webhook Success Rate**: Skuteczność eventów dostarczenia (jeśli używamy webhooków).
