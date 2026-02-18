# Checklista Bezpiecznego Kodu (Secure Coding Checklist)

**Status**: Draft
**Ostatni przegląd**: 2026-02-05
**Właściciel**: Tomasz Kamiński

---
Lista kontrolna do wykorzystania przez programistów (Self-Review) oraz podczas Code Review (PR).

## Ogólne

- [ ] **Brak Sekretów**: Czy w kodzie nie ma zaszytych kluczy API, haseł, tokenów? (Sprawdź `const`, komentarze, pliki konfiguracyjne).
- [ ] **Zmienne Środowiskowe**: Czy nowe konfiguracje są dodane do `.env.example` (bez wartości wrażliwych)?
- [ ] **Logowanie**: Czy nie logujemy danych wrażliwych (hasła, PII, tokeny) w `console.log` lub loggerze?

## API i Walidacja (NestJS)

- [ ] **DTO**: Czy każde pole w DTO ma dekoratory walidacyjne (`@IsString`, `@IsInt`, `@Min`, itp.)?
- [ ] **Whitelist**: Czy globalny pipe ma włączone `whitelist: true` (odrzucanie nadmiarowych pól)?
- [ ] **Transformacja**: Czy typy danych są poprawnie transformowane (np. string "10" na number 10)?

## Autoryzacja i Dostęp

- [ ] **Authentication**: Czy endpointy prywatne są zabezpieczone `@UseGuards(JwtAuthGuard)`?
- [ ] **Authorization (Role)**: Czy endpointy specyficzne dla ról mają `@Roles(...)`?
- [ ] **Authorization (Własność)**: Czy w serwisie sprawdzamy, czy `userId` z tokena jest właścicielem zasobu (`resource.ownerId === userId`)? **Krytyczne dla IDOR.**

## Baza Danych

- [ ] **SQL Injection**: Czy używamy metod ORM/Query Buildera zamiast sklejania stringów SQL?
- [ ] **Transakcje**: Czy operacje, które muszą być atomowe (np. zmiana statusu zgłoszenia + zapis audytu), są w transakcji?

## Integracje i Webhooki

- [ ] **Weryfikacja Sygnatury**: Czy weryfikujemy podpis webhooków od zewnętrznych dostawców (IdP, Email Provider)?
- [ ] **Idempotencja**: Czy obsługa webhooków/jobów jest odporna na wielokrotne wywołanie tego samego zdarzenia?
- [ ] **Timeouty i Retry**: Czy mamy kontrolę timeoutów oraz retry/backoff dla zależności zewnętrznych?

## Frontend / Mobile (Kontekst)

- [ ] **XSS**: Czy nie używamy `innerHTML` / `dangerouslySetInnerHTML` bez sanityzacji?
- [ ] **Tokeny**: Czy tokeny są przechowywane bezpiecznie (Secure Storage na mobile, HttpOnly Cookies/Memory na web)?
