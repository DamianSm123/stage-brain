# Service Level Objectives (SLO) & Indicators (SLI)

**Status**: Draft
**Ostatni przegląd**: 2026-02-02
**Właściciel**: Michał Lewandowski

---
Definiujemy, co oznacza "zdrowy" system dla naszych użytkowników.

## Definicje
*   **SLI (Service Level Indicator)**: Metryka, którą mierzymy (np. czas odpowiedzi HTTP).
*   **SLO (Service Level Objective)**: Cel, który chcemy osiągnąć (np. 99% zapytań < 500ms).
*   **SLA (Service Level Agreement)**: Kontrakt z klientem (w MVP: brak formalnych kar finansowych, ale celujemy w wysokie standardy).

## Cele dla OpsDesk (MVP)

### 1. Dostępność (Availability)
System jest dostępny, gdy API odpowiada kodem innym niż 5xx.

*   **SLI**: `(Liczba udanych requestów / Całkowita liczba requestów) * 100%`
*   **SLO**: **99.9%** w skali miesiąca.
    *   *Error Budget*: ~43 minuty niedostępności miesięcznie.

### 2. Wydajność (Latency)
System jest szybki, gdy odpowiada w czasie akceptowalnym dla użytkownika.

*   **SLI**: Czas odpowiedzi mierzony na Load Balancerze.
*   **SLO**:
    *   **p95 < 500ms** dla standardowych operacji API.
    *   **p99 < 2000ms** dla ciężkich operacji (np. wyszukiwanie, raporty).

### 3. Niezawodność Kolejki (Queue Integrity)
Krytyczny proces operacyjny.

*   **SLI**: Procent poprawnie przetworzonych jobów (bez błędów końcowych po naszej stronie).
*   **SLO**: **99.9%**
    *   Każdy trwały wzrost fail rate lub backlog wymaga interwencji (patrz Runbooki).

## Monitoring SLO
Weryfikacja SLO odbywa się poprzez analizę metryk miesięcznych w panelu monitoringu. Przekroczenie Error Budget powinno skutkować wstrzymaniem nowych feature'ów na rzecz stabilizacji (tzw. "Freeze").
