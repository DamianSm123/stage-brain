# Prywatność Danych (Data Privacy)

**Status**: Draft
**Ostatni przegląd**: 2026-02-05
**Właściciel**: Tomasz Kamiński

---
Dokument opisuje sposób przetwarzania Danych Osobowych (PII - Personally Identifiable Information) zgodnie z wymogami RODO (GDPR).

> Pojęcia domenowe: [Słownik](../00-start-here/glossary.md).

## 1. Inwentaryzacja Danych (Data Inventory)

W systemie OpsDesk przetwarzamy następujące kategorie danych:

| Kategoria | Przykłady | Miejsce Przechowywania | Cel Przetwarzania |
| :--- | :--- | :--- | :--- |
| **Tożsamość** | Email, identyfikator SSO, rola | IdP/SSO (Master), DB OpsDesk (referencje) | Logowanie, kontrola dostępu |
| **Zgłoszenia** | Tytuł, opis, kategoria, priorytet, status | DB OpsDesk | Realizacja procesu zgłoszeń |
| **Komentarze** | Treść komentarza, autor, timestamp | DB OpsDesk | Komunikacja w obrębie zgłoszenia |
| **Audyt** | Zmiany statusu/przypisań/akceptacji | DB OpsDesk | Zgodność, diagnostyka, bezpieczeństwo |
| **Powiadomienia** | Status wysyłek, metadane dostarczenia | DB OpsDesk + Email Provider (status) | Dostarczanie informacji o zdarzeniach |

## 2. Minimalizacja Danych

*   Nie zbieramy danych, które nie są niezbędne do realizacji procesu (np. nie pytamy o adres zamieszkania, jeśli usługa tego nie wymaga).
*   Nie przechowujemy więcej danych niż potrzebujemy do realizacji workflow (np. brak danych finansowych w MVP).

## 3. Prawa Użytkownika (RODO)

### Prawo do zapomnienia (Right to be Erasure)
*   **Procedura**: Użytkownik zgłasza chęć usunięcia konta.
*   **Akcja Techniczna**:
    1.  Usunięcie (lub dezaktywacja) konta w IdP/SSO (jeśli organizacja to wspiera).
    2.  Anonimizacja danych osobowych w DB OpsDesk (np. email -> hash), z zachowaniem audytu.

### Prawo do dostępu i przenoszenia (Export)
*   Możliwość wygenerowania paczki JSON ze wszystkimi danymi zgromadzonymi o użytkowniku (Zgłoszenia, Komentarze, Historia zmian).

## 4. Retencja Danych

*   **Konta nieaktywne**: Przechowywane do momentu żądania usunięcia.
*   **Logi systemowe**: Rotowane co 30 dni.
*   **Audit log**: Retencja zgodna z wymaganiami organizacji (placeholder: 12-24 mies.).

## 5. Dostęp do Danych

Dostęp do surowych danych produkcyjnych (Baza Danych) jest ściśle ograniczony:
*   Dostęp mają tylko wyznaczeni Administratorzy Systemu (DevOps/Tech Lead).
*   Deweloperzy korzystają z danych zanonimizowanych lub "dummy data" na środowiskach staging/dev.
