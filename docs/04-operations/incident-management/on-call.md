# On-Call Policy (Dyżury)

**Status**: Draft
**Ostatni przegląd**: 2026-02-02
**Właściciel**: Michał Lewandowski

---
W fazie MVP stosujemy zasadę **"You Build It, You Run It"**. Cały zespół inżynierski jest odpowiedzialny za stabilność systemu.

## Rotacja
*   Dyżur trwa **1 tydzień** (od poniedziałku 9:00 do kolejnego poniedziałku 9:00).
*   Grafik dyżurów jest dostępny w kalendarzu zespołu.

## Obowiązki osoby On-Call
1.  **Dostępność**: W godzinach biznesowych (9-17) reakcja do 15 minut. Poza godzinami (Best Effort) - reakcja w miarę możliwości, chyba że incydent jest krytyczny (P1).
2.  **Monitorowanie**: Obserwacja kanału `#alerts` na Slacku.
3.  **Zarządzanie Incydentem**:
    *   Potwierdzenie przyjęcia zgłoszenia (reakcja emoji 👀 na Slacku).
    *   Uruchomienie odpowiedniego Runbooka.
    *   Komunikacja postępów co 30-60 minut na kanale `#incidents`.
4.  **Eskalacja**: Jeśli problem przekracza kompetencje dyżurnego, ma on prawo (i obowiązek) wezwać pomoc (innych deweloperów lub CTO).

## Poziomy Incydentów

| Poziom | Opis | SLA Reakcji | Kto reaguje |
| :--- | :--- | :--- | :--- |
| **P1 (Critical)** | System leży, kolejka/worker nie działa, wyciek danych. | < 15 min | On-Call + Tech Lead |
| **P2 (High)** | Część funkcji nie działa, degradacja wydajności. | < 1 h | On-Call |
| **P3 (Medium)** | Błędy u pojedynczych użytkowników, błędy UI. | NBD (Next Business Day) | Zespół w godzinach pracy |
| **P4 (Low)** | Literówki, drobne usterki. | Backlog | Zespół w godzinach pracy |
