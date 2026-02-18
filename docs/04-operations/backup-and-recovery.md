# Polityka Backupów i Odtwarzania Danych

**Status**: Active
**Ostatni przegląd**: 2026-02-04
**Właściciel**: Michał Lewandowski

---

## Kontekst
Dokument ten definiuje strategię backupów, retencji oraz procedury odzyskiwania danych (Disaster Recovery) dla systemu OpsDesk. Stanowi rozszerzenie wymagań niefunkcjonalnych opisanych w `../01-product/nfr.md`.


## Infrastruktura Danych
Głównym magazynem danych wymagającym ścisłej polityki backupowej jest baza relacyjna:
- **Usługa**: Managed Database (Cloud Provider)
- **Silnik**: PostgreSQL
- **Środowisko**: Production

## Strategia i Retencja

### Automatyczne Backupy
Platforma wykorzystuje wbudowane mechanizmy dostawcy chmury:
1.  **Pełne Backupy (Daily)**: Wykonywane automatycznie raz dziennie.
2.  **WAL (Write-Ahead Logs)**: Archiwizowane w trybie ciągłym, umożliwiające odtwarzanie do punktu w czasie (PITR - Point-in-Time Recovery).

### Polityka Retencji
-   **Okres przechowywania**: 7 dni (placeholder; zależy od dostawcy).
-   **Lokalizacja**: Zaszyfrowane magazyny obiektowe zarządzane przez dostawcę w tym samym regionie co baza danych.

## Parametry Odzyskiwania (SLA)

| Metryka | Wartość | Opis |
| :--- | :--- | :--- |
| **RPO** (Recovery Point Objective) | < 5 min | Maksymalna ilość utraconych danych. Wynika z opóźnienia przesyłu logów WAL. |
| **RTO** (Recovery Time Objective) | 30-60 min | Czas potrzebny na przywrócenie pełnej operacyjności systemu. |

> **Ważne**: Procedura odzyskiwania jest ostatecznością i wiąże się z niedostępnością systemu (Downtime).

## Procedura Odtwarzania (Disaster Recovery)

W przypadku krytycznej awarii lub uszkodzenia danych (np. błędna migracja):

1.  **Inicjacja**: W panelu dostawcy chmury wybierz opcję "Restore from backup".
2.  **Point-in-Time**: Wskaż dokładny znacznik czasu (Timestamp), do którego chcesz przywrócić stan.
3.  **Nowa Instancja**: Przywracanie tworzy **nowy klaster** bazy danych (nie nadpisuje istniejącego).
4.  **Aktualizacja Konfiguracji**:
    -   Pobierz nowy `DATABASE_URL` / Connection String.
    -   Zaktualizuj sekrety aplikacji w środowisku produkcyjnym.
    -   Przeładuj aplikacje (Redeployment).
5.  **Weryfikacja**: Sprawdź spójność danych i działanie kluczowych procesów użytkownika.

## Testowanie (Fire Drills)
Zaleca się przeprowadzanie testów odtwarzania (na środowisko stagingowe) raz na kwartał, aby zweryfikować poprawność backupów i procedur.

## Referencje
-   [Procedury Wdrożeniowe i Rollback](./release-and-rollback.md)
-   [Wymagania Niefunkcjonalne (NFR)](../01-product/nfr.md)
