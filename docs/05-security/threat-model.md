# Model Zagrożeń (Threat Model)

**Status**: Draft
**Ostatni przegląd**: 2026-02-05
**Właściciel**: Tomasz Kamiński

---
Analiza zagrożeń oparta na uproszczonej metodologii STRIDE, dostosowana do architektury OpsDesk (MVP).

> Kontekst architektury: [System Overview](../02-architecture/system-overview.md).

## Zasoby Krytyczne (Assets)
1.  **Dane Osobowe (PII)**: Dane użytkowników (pracowników).
2.  **Integralność Workflow**: Pewność, że statusy i akceptacje są poprawne.
3.  **Niezawodność Powiadomień**: Pewność, że krytyczne powiadomienia są dostarczane.

## Analiza Ryzyka i Mitygacja

### 1. Spoofing (Podszywanie się)
*   **Zagrożenie**: Atakujący wysyła fałszywy webhook dostawcy email, aby oznaczyć niedostarczone powiadomienie jako delivered.
*   **Mitygacja**: Weryfikacja sygnatury webhooków dostawcy w każdym żądaniu. Użycie surowego body (Raw Body) do weryfikacji.
*   **Zagrożenie**: Atakujący podszywa się pod innego użytkownika.
*   **Mitygacja**: Uwierzytelnianie przez IdP/SSO. Walidacja tokena JWT po stronie serwera.

### 2. Tampering (Manipulacja danymi)
*   **Zagrożenie**: Zmiana statusu/priorytetu zgłoszenia przez nieuprawnioną rolę.
*   **Mitygacja**: RBAC + walidacja dozwolonych przejść statusów po stronie backendu. Audyt zmian.
*   **Zagrożenie**: Manipulacja parametrami SLA w requestach.
*   **Mitygacja**: Backend wyznacza SLA deterministycznie na podstawie polityk, nie ufa danym z klienta.

### 3. Repudiation (Zaprzeczalność)
*   **Zagrożenie**: Użytkownik twierdzi, że nie zmienił statusu lub nie podjął decyzji akceptacji.
*   **Mitygacja**: Audit log dla zmian statusów i decyzji akceptacji (`User X changed status to IN_PROGRESS at Timestamp Y`).

### 4. Information Disclosure (Ujawnienie informacji)
*   **Zagrożenie**: IDOR - Zgłaszający A podgląda zgłoszenie Zgłaszającego B zmieniając `requestId` w URL.
*   **Mitygacja**: Ścisła weryfikacja `ownerId`/dostępów kolejki przy każdym odczycie szczegółów zgłoszenia (Guardy i serwisy domenowe).
*   **Zagrożenie**: Wyciek kluczy API.
*   **Mitygacja**: Brak sekretów w kodzie (repozytorium). Skanowanie repozytorium (np. GitGuardian).

### 5. Denial of Service (Odmowa usługi)
*   **Zagrożenie**: Spamowanie API tworzeniem zgłoszeń lub komentarzy.
*   **Mitygacja**: Rate Limiting na endpointach, limity per użytkownik/kategoria, monitoring kolejki.

### 6. Elevation of Privilege (Podniesienie uprawnień)
*   **Zagrożenie**: Zwykły user próbuje uzyskać dostęp do panelu admina.
*   **Mitygacja**: Separacja ról w tokenie JWT (Custom Claims w IdP/SSO). Dekorator `@Roles('ADMIN')` na endpointach administracyjnych.
