# Przegląd Bezpieczeństwa (Security Overview)

**Status**: Draft
**Ostatni przegląd**: 2026-02-05
**Właściciel**: Tomasz Kamiński

---
## Model Ochrony (Defense in Depth)

Stosujemy wielowarstwowe podejście do bezpieczeństwa, aby zminimalizować ryzyko w przypadku przełamania jednej z barier.

### 1. Warstwa Infrastruktury
*   **HTTPS/TLS**: Cała komunikacja (Web <-> API, API <-> DB, API <-> IdP/SSO, Worker <-> Email Provider) jest szyfrowana.
*   **Zmienne Środowiskowe**: Sekrety (klucze API, hasła DB) przechowywane w `.env` i wstrzykiwane w czasie deployu. Nigdy nie są commitowane do repozytorium.
*   **CORS**: Ścisła polityka CORS pozwalająca na zapytania tylko z zaufanych domen (np. `app.example`, `admin.example`).

### 2. Warstwa Aplikacji (NestJS)
*   **Walidacja Globalna**: Wykorzystanie `ValidationPipe` z `class-validator` oraz `whitelist: true`. Odrzucamy każde pole, które nie jest zdefiniowane w DTO.
*   **Security Headers**: Użycie biblioteki `helmet` do ustawienia nagłówków HTTP (HSTS, X-Frame-Options, etc.).
*   **Rate Limiting**: Ochrona endpointów publicznych (logowanie, rejestracja) przed Brute Force/DDoS.

### 3. Warstwa Danych
*   **Parametryzacja Zapytań**: Wykorzystanie ORM (Prisma/TypeORM) do ochrony przed SQL Injection.
*   **Szyfrowanie Spoczynkowe**: Baza danych na środowisku produkcyjnym korzysta z szyfrowania dysków (Encryption at Rest).

## Integracje Zewnętrzne i Webhooki

OpsDesk integruje się z usługami zewnętrznymi (IdP/SSO, Email Provider). Krytyczne zdarzenia (np. statusy dostarczenia email) mogą docierać asynchronicznie w formie webhooków.

*   **Webhooks**: Weryfikacja sygnatury każdego webhooka zgodnie z dokumentacją dostawcy.
*   **Idempotencja**: Obsługa webhooków jest odporna na duplikaty i retry.
*   **Least Privilege**: Klucze API i sekrety mają minimalny zakres uprawnień.

> Powiązane: [Kontrakty API i Integracje](../02-architecture/integrations/api-contracts.md).

## Logowanie i Audyt

*   **Logi Aplikacyjne**: Rejestrujemy błędy i kluczowe zdarzenia biznesowe (np. `RequestSubmitted`, `ApprovalDecided`, `NotificationFailed`).
*   **Sanityzacja**: Logi są automatycznie czyszczone z danych wrażliwych (hasła, tokeny, PII) przed zapisem.
*   **Ślad Rewizyjny (Audit Trail)**: Zmiany statusów zgłoszeń, przypisań i akceptacji są zapisywane w historii, umożliwiając odtworzenie przebiegu procesu.
