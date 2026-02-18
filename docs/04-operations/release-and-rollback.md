# Procedury Release i Rollback

**Status**: Draft
**Ostatni przegląd**: 2026-02-02
**Właściciel**: Michał Lewandowski

---
Dokument opisuje proces wdrażania nowych wersji aplikacji oraz procedury awaryjnego cofania zmian.

## 1. Release Process (Wdrożenie)

Wdrożenia są zautomatyzowane za pomocą **GitHub Actions** i zintegrowane z **platformą hostingową (PaaS) / dostawcą chmury**.

### Cykl wydawniczy
1.  **Merge do `main`**: Kod jest mergowany do głównej gałęzi po przejściu Code Review i testów automatycznych.
2.  **Tagowanie**: Utworzenie taga w repozytorium (np. `v1.2.0`) uruchamia pipeline produkcyjny.
    ```bash
    git tag v1.2.0
    git push origin v1.2.0
    ```
3.  **Build & Push**: GitHub Action buduje obraz Dockera i wypycha go do rejestru kontenerów (Container Registry).
4.  **Deploy**: Platforma hostingowa wykrywa nowy obraz i rozpoczyna proces wdrożenia (zero-downtime, jeśli wspierane).

### Checklist przedwdrożeniowa (Manual)
Zanim utworzysz tag produkcyjny:
- [ ] Upewnij się, że wszystkie testy na UAT przeszły pomyślnie.
- [ ] Sprawdź, czy migracje bazy danych są bezpieczne (nie blokują tabel, są kompatybilne wstecznie).
- [ ] Zweryfikuj, czy zmienne środowiskowe na PROD są zaktualizowane (w tym ewentualne Feature Flags).
- [ ] Sprawdź status zewnętrznych zależności (np. Email Provider, IdP/SSO, Redis).
- [ ] Upewnij się, że zmiany w API są kompatybilne wstecznie (obsługują starszy Frontend).

## 2. Strategia Wstecznej Kompatybilności (Rollback Safety)

Aby Rollback backendu nie powodował awarii Frontendu (Mobile/Web), stosujemy następujące zasady:

### Wersjonowanie API (Preferowane)
Dla zmian łamiących kontrakt (breaking changes), tworzymy nową wersję endpointu zamiast modyfikować istniejący.
*   Istniejący: `GET /api/v1/requests` (używany przez obecny frontend).
*   Nowy: `GET /api/v2/requests` (używany przez nowy frontend).
*   **Zaleta**: Rollback backendu do poprzedniej wersji nie psuje starego frontendu, bo endpoint `v1` pozostaje bez zmian (lub frontend po prostu korzysta z dostępnego v1).

### Feature Flags (Mechanizm Awaryjny)
Dla krytycznych, ryzykownych funkcjonalności (np. nowy workflow SLA lub zmiana routingu) używamy zmiennych środowiskowych jako prostych Feature Flags.
*   Przykład: `ENABLE_NEW_CHECKOUT=true`.
*   Kod aplikacji musi obsługiwać obie ścieżki (if flag is true/false).
*   **Ważne**: Flagi dodają złożoność kodu. Należy je traktować jako **dług technologiczny** i usuwać niezwłocznie po ustabilizowaniu funkcjonalności.
*   **Krytyczne**: Jeśli rollback polega na wyłączeniu flagi, upewnij się, czy zmiana zmiennej środowiskowej na PROD nie wymaga pełnego redeployu (w wielu PaaS zmiana env var powoduje automatyczny redeploy).

## 3. Rollback Process (Cofanie zmian)

W przypadku wykrycia krytycznego błędu po wdrożeniu (np. błędy 500, awaria kolejki/worker), należy natychmiast wykonać rollback.

### Procedura Rollback (PaaS / Cloud Provider)

To jest preferowana i najszybsza metoda.

1.  Zaloguj się do panelu dostawcy chmury / PaaS.
2.  Przejdź do listy aplikacji/usług i wybierz aplikację (np. **OpsDesk API**).
3.  Przejdź do historii wdrożeń (Deployments/Activity).
4.  Znajdź ostatni udany deployment (sprzed awaryjnego wdrożenia).
5.  Kliknij **"..."** obok deploymentu i wybierz **Redeploy** (lub Rollback jeśli dostępne jako bezpośrednia opcja).
    *   *Uwaga: Platforma przywróci poprzedni obraz kontenera.*

### Rollback Bazy Danych (Jeśli konieczny)

Automatyczny rollback aplikacji **NIE cofa zmian w bazie danych**. Jeśli migracja uszkodziła dane lub jest niekompatybilna ze starą wersją kodu:

1.  Uruchom tunel do bazy danych PROD (dostęp tylko dla uprawnionych administratorów).
2.  Wykonaj skrypt cofający migrację (down migration).
    ```bash
    # Przykład (zależy od narzędzia ORM, np. TypeORM/Prisma)
    npm run migration:revert
    ```
3.  **Ważne**: Jeśli migracja była destrukcyjna (np. usunięcie kolumny), konieczne może być przywrócenie bazy z backupu (Point-in-time recovery w usłudze Managed Database). To procedura ostateczna (RTO ~30-60 min).

## 4. Komunikacja

Podczas awaryjnego rollbacku:
1.  Poinformuj zespół na kanale `#dev-ops` / `#incidents`.
2.  Jeśli awaria dotknęła użytkowników, przygotuj komunikat (Status Page / Email).
3.  Po ustabilizowaniu sytuacji, rozpocznij procedurę [Postmortem](./incident-management/postmortems/README.md).
