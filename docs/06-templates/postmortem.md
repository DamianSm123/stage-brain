# Postmortem: [TYTUŁ INCYDENTU]

**Status**: Draft
**Ostatni przegląd**: 2026-02-09
**Właściciel**: Michał Lewandowski
**Data**: YYYY-MM-DD
**Autorzy**: [Lista osób]
**Jira Ticket**: [Link]

---

## 1. Summary (Podsumowanie)
Krótki opis co się stało, jaki miało wpływ na użytkowników i jak długo trwało.
*   **Impact**: X użytkowników nie mogło zrobić Y.
*   **Czas trwania**: Od HH:MM do HH:MM (X godzin).

## 2. Timeline (Oś czasu)
Wszystkie czasy w UTC.
*   **[HH:MM]** - Wykrycie problemu (alert X).
*   **[HH:MM]** - Pierwsza reakcja (kto zaczął działać).
*   **[HH:MM]** - Podjęto próbę naprawy Y (nieudana).
*   **[HH:MM]** - Zidentyfikowano przyczynę źródłową.
*   **[HH:MM]** - Wdrożono poprawkę.
*   **[HH:MM]** - System wrócił do normy.

## 3. Root Cause Analysis (Przyczyna źródłowa)
Dlaczego to się stało? (Technika 5 Why)
1.  Dlaczego system padł? -> Bo baza danych odrzuciła połączenia.
2.  Dlaczego odrzuciła? -> Bo wyczerpał się limit połączeń.
3.  Dlaczego się wyczerpał? -> Bo nowy worker nie zamykał połączeń poprawnie.
...

## 4. Resolution & Recovery (Naprawa)
Co zrobiliśmy, żeby przywrócić system? Czy była to naprawa tymczasowa czy trwała?

## 5. Lessons Learned (Wnioski)
### Co poszło dobrze?
*   Alert zadziałał szybko.
*   Rollback był bezbolesny.

### Co poszło źle?
*   Nikt nie wiedział jak zrestartować usługę X.
*   Brakowało logów w kluczowym miejscu.

## 6. Action Items (Zadania naprawcze)
Zadania, które zapobiegną powtórzeniu się problemu.

| Zadanie | Priorytet | Odpowiedzialny | Ticket |
| :--- | :--- | :--- | :--- |
| Dodać alert na liczbę połączeń DB | P1 | @devops | TICKET-123 |
| Poprawić zarządzanie pulą połączeń | P2 | @backend | TICKET-124 |
| Zaktualizować Runbook | P3 | @user | - |
