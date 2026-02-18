# Uwierzytelnianie i Autoryzacja (AuthN & AuthZ)

**Status**: Draft
**Ostatni przegląd**: 2026-02-05
**Właściciel**: Tomasz Kamiński

---
System wykorzystuje zewnętrznego dostawcę tożsamości (IdP/SSO) oraz wewnętrzne mechanizmy kontroli dostępu oparte na rolach (RBAC) i atrybutach (ABAC).

> Diagramy referencyjne: [Sekwencje Auth](../02-architecture/sequences/auth/README.md).

## 1. Uwierzytelnianie (Authentication)

Za proces logowania i zarządzania tożsamością odpowiada **IdP/SSO**.

*   **Proces**:
    1.  Klient (Web) loguje się przez SDK dostawcy tożsamości.
    2.  Otrzymuje krótkotrwały token JWT.
    3.  Token jest wysyłany w nagłówku `Authorization: Bearer <token>` do API OpsDesk.
*   **Weryfikacja**:
    *   Backend (NestJS) weryfikuje podpis JWT kluczem publicznym IdP (JWKS).
    *   Sprawdzana jest ważność tokena (`exp`) i audytorium (`aud`).
*   **Brak Haseł**: Baza danych OpsDesk nie przechowuje haseł użytkowników. Przechowujemy jedynie `externalIdentityId` mapowany na wewnętrzny `User Entity`.

## 2. Autoryzacja (Authorization)

Decyzja "czy użytkownik może wykonać tę akcję" podejmowana jest na dwóch poziomach.

### Poziom 1: Role-Based Access Control (RBAC)
Wykorzystujemy NestJS Guards (`RolesGuard`) do ograniczenia dostępu do endpointów.

*   **Role**:
    *   `ADMIN`: Pełny dostęp do panelu administracyjnego, operacje ręczne.
    *   `AGENT`: Dostęp do triażu, przypisań i zmian statusu.
    *   `APPROVER`: Dostęp do decyzji akceptacji.
    *   `REQUESTER`: Dostęp do tworzenia i podglądu własnych zgłoszeń.

```typescript
// Przykład użycia dekoratora
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.AGENT)
@Patch('requests/:id')
updateRequest(...) { ... }
```

### Poziom 2: Resource Ownership (Własność Zasobów)
Sama rola nie wystarczy. Użytkownik musi być właścicielem zasobu, na którym operuje (ochrona przed IDOR - Insecure Direct Object References).

*   **Zasada**: Zgłaszający A nie może edytować zgłoszenia Zgłaszającego B.
*   **Implementacja**: Serwis domenowy sprawdza powiązanie `userId` z zasobem przed wykonaniem akcji.

```typescript
// Pseudokod weryfikacji własności
async updateRequest(requestId: string, userId: string, data: UpdateRequestDto) {
  const request = await this.requestRepo.findById(requestId);
  if (request.ownerId !== userId) {
    throw new ForbiddenException('Nie jesteś właścicielem tego zgłoszenia');
  }
  // ... update logic
}
```

## 3. Sesje i Tokeny

*   **Bezstanowość**: API jest bezstanowe (stateless). Każde żądanie musi zawierać token.
*   **Odświeżanie**: Odświeżanie tokenów (Refresh Token rotation) jest obsługiwane przez SDK IdP po stronie klienta.
*   **Wylogowanie**: Unieważnienie sesji po stronie IdP.
