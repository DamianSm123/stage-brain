# Środowiska (Environments)

**Status**: Draft
**Ostatni przegląd**: 2026-02-02
**Właściciel**: Michał Lewandowski

---
System OpsDesk działa na trzech głównych środowiskach hostowanych w **Cloud Provider / PaaS**.

## Przegląd Środowisk

| Cecha | DEV (Development) | UAT (Staging) | PROD (Production) |
| :--- | :--- | :--- | :--- |
| **Cel** | Ciągła integracja, testy deweloperskie | Testy akceptacyjne, demo dla klienta | Środowisko produkcyjne, żywy ruch |
| **Trigger Wdrożenia** | Push do `develop` | Tag `v*-rc` lub ręcznie z `main` | Tag `v*` (Release) |
| **Baza Danych** | Managed PostgreSQL (Dev Plan) | Managed PostgreSQL (Dev Plan) | Managed PostgreSQL (Prod Plan + HA) |
| **Dane** | Dane testowe, anonimowe | Kopia prod (zanonimizowana) lub syntetyczne | Dane rzeczywiste, wrażliwe |
| **Dostępność** | "Best effort" (może być niestabilne) | Wysoka (musi działać dla testerów) | Krytyczna (SLA 99.9%) |
| **Debug Mode** | Włączony | Wyłączony | Wyłączony |

## Zarządzanie Konfiguracją

Konfiguracja aplikacji odbywa się poprzez **Zmienne Środowiskowe (Environment Variables)**.
W platformie hostingowej (PaaS) są one zarządzane w ustawieniach aplikacji jako **Secrets/Env Vars**.

**Nie przechowujemy sekretów w repozytorium!** Pliki `.env` służą tylko do lokalnego developmentu.

### Kluczowe Zmienne

| Zmienna | Opis | Przykład (Wartość) |
| :--- | :--- | :--- |
| `NODE_ENV` | Tryb działania Node.js | `production` / `development` |
| `DATABASE_URL` | String połączeniowy do bazy | `postgresql://user:pass@host:port/db` |
| `REDIS_URL` | String połączeniowy do Redisa | `redis://user:pass@host:port` |
| `JWT_SECRET` | Klucz do podpisywania tokenów | *(Secret)* |
| `IDP_JWKS_URL` | Adres JWKS dostawcy tożsamości | `https://idp.example/.well-known/jwks.json` |
| `EMAIL_PROVIDER_API_KEY` | Klucz API dostawcy email | *(Secret)* |
| `EMAIL_WEBHOOK_SECRET` | Sekret do weryfikacji webhooków email | *(Secret)* |
| `ENABLE_FEATURE_X` | Feature Flag (opcjonalnie) | `true` / `false` |

### Feature Flags w Konfiguracji
Używamy zmiennych środowiskowych jako prostego mechanizmu przełączania funkcji (Feature Toggles).
*   **Zasada**: Każda flaga musi mieć domyślną wartość w kodzie (fallback).
*   **Ostrzeżenie**: Zmiana flagi w PaaS często wymusza redeploy aplikacji. Nie nadaje się do przełączania w czasie rzeczywistym co sekundę, ale wystarcza do włączania/wyłączania dużych modułów.
*   **Porządek**: Nieużywane flagi należy usuwać z panelu, aby nie wprowadzać chaosu konfiguracyjnego.

## Dostęp i Uprawnienia

*   **Dostęp do infrastruktury (Cloud Provider)**: Ograniczony do zespołu DevOps i Tech Leadów.
*   **Dostęp do baz danych**:
    *   **PROD**: Brak bezpośredniego dostępu z zewnątrz. Dostęp tylko przez tunelowanie lub z poziomu aplikacji (tzw. Trusted Sources).
    *   **DEV/UAT**: Dostęp możliwy dla deweloperów (VPN/IP Whitelist) w celu debugowania.
*   **Logi**: Dostępne w panelu hostingu (Runtime Logs) oraz przekazywane do zewnętrznego systemu (jeśli skonfigurowano).

## Zasoby i Limity

*   **Skalowanie**:
    *   **API**: Autoskalowanie włączone na PROD (min. 2 instancje).
    *   **Worker**: Pojedyncza instancja na start, skalowanie ręczne w razie potrzeb.
*   **Storage**:
    *   Pliki statyczne i uploady użytkowników lądują w **Object Storage (S3-compatible)**. Lokalne systemy plików kontenerów są ulotne (ephemeral).
