# Bezpieczeństwo (Security)

**Status**: Active
**Ostatni przegląd**: 2026-02-09
**Właściciel**: Tomasz Kamiński

Dokumentacja standardów, procesów i mechanizmów bezpieczeństwa w systemie OpsDesk.

## Spis Treści

1.  [Przegląd Bezpieczeństwa (Security Overview)](./security-overview.md)
    *   Ogólne podejście, model "Defense in Depth", integracje zewnętrzne i webhooks.
2.  [Uwierzytelnianie i Autoryzacja (AuthN & AuthZ)](./authn-authz.md)
    *   Integracja z dostawcą tożsamości (SSO), zarządzanie rolami (RBAC), dostępy do zasobów.
3.  [Prywatność Danych (Data Privacy)](./data-privacy.md)
    *   Obsługa danych osobowych (PII), zgodność z RODO (GDPR), retencja danych.
4.  [Model Zagrożeń (Threat Model)](./threat-model.md)
    *   Identyfikacja kluczowych wektorów ataku i strategie mitygacji (STRIDE).
5.  [Checklista Bezpiecznego Kodu](./secure-coding-checklist.md)
    *   Lista kontrolna dla programistów do wykorzystania podczas Code Review i przed wdrożeniem.

## Odpowiedzialność

*   **Właściciel Sekcji**: Tech Lead / Security Champion.
*   **Wsparcie**: DevOps (Infrastruktura), Product Owner (Zgodność prawna/RODO).

## Kluczowe Zasady

> **Security by Design**: Bezpieczeństwo nie jest "dodatkiem" na koniec projektu. Jest wbudowane w architekturę (np. walidacja webhooków dostawców zewnętrznych, separacja ról).

1.  **Zero Trust**: Nie ufamy danym przychodzącym z Frontendu.
2.  **Least Privilege**: Użytkownik i serwis ma dostęp tylko do tego, co niezbędne.
3.  **Audytowalność**: Kluczowe akcje (zmiany statusów, przypisania, akceptacje) zostawiają ślad.
