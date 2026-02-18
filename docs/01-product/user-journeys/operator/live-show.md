# Live Show (Operator)

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Deweloper / AI

---

## Cel

Operator/showcaller korzysta z panelu StageBrain w trakcie koncertu: monitoruje [engagement](../../features/engagement-scoring.md), zarządza segmentami, przegląda rekomendacje ML, kontroluje czas, dodaje tagi kontekstowe. Wszystkie decyzje podejmuje człowiek — system rekomenduje.

## Aktorzy

- [Showcaller / Reżyser / Producent](../../personas.md#1-showcaller--reżyser--producent) — podejmuje decyzje
- [Operator](../../personas.md#2-operator) — obsługuje panel (w MVP ta sama osoba)
- System StageBrain

## Warunki Wstępne

- Show wystartował (setup zakończony, panel w trybie Live).
- Audio napływa z venue przez WebSocket.
- Setlista załadowana, curfew ustawiony.

## Kroki — Typowy Przebieg

### 1. Monitoring Engagement
1. Panel wyświetla [engagement score](../../features/engagement-scoring.md) w czasie rzeczywistym (gauge 0-1).
2. Trend arrow (↑↓→) wskazuje kierunek zmian.
3. Etykieta klasyfikacji (np. "Applause", "Cheering", "Crowd") daje kontekst.
4. Operator na bieżąco obserwuje metryki — reaguje na spadki.

### 2. Zarządzanie Segmentami
1. Aktualny segment wyświetlany z czasem elapsed i planowanym.
2. Po zakończeniu segmentu operator tapuje **"End Segment"**.
3. Operator tapuje **"Start Next"** — następny segment z setlisty staje się aktywny.
4. Opcjonalnie: **"Skip"** — pominięcie segmentu (segment → `skipped`).

### 3. Przegląd Rekomendacji ML
1. System generuje ranking następnych segmentów ([ml-recommendations.md](../../features/ml-recommendations.md)).
2. Panel pokazuje top 3-5 z % dopasowania i uzasadnieniem.
3. Showcaller ocenia rekomendacje i podejmuje decyzję:
   - **Accept** → operator tapuje → wybrany segment staje się następny.
   - **Reject / Ignore** → operator wybiera inny segment lub kontynuuje z setlistą.
4. System loguje decyzję (dla treningu ML i post-show analytics).

### 4. Kontrola Czasu
1. Status bar pokazuje: show elapsed, curfew countdown, delta (opóźnienie/wyprzedzenie).
2. Kolor alertu: zielony (OK) / żółty (warning) / czerwony (critical).
3. Przy opóźnieniu → panel wyświetla [scenariusze odzysku czasu](../../features/time-control.md).
4. Showcaller wybiera scenariusz → operator tapuje **"Zastosuj"** → system zmienia warianty segmentów.

### 5. Dodawanie Tagów
1. Operator tapuje [quick tag](../../features/operator-tags.md) (1 tap): "Tech Issue", "Energy ↓", "Energy ↑", etc.
2. Lub dodaje custom tag (pole tekstowe, max 200 znaków).
3. Tag zapisywany z timestampem i segmentem.

## Scenariusze Decyzyjne

### Spadek Energii
1. Engagement trend: malejący przez 3+ okna.
2. Panel podświetla alert: "Energia spada ↓".
3. System wyświetla rekomendacje faworyzujące energetyczne segmenty.
4. Showcaller: "Dajmy Song X — system mówi 92% match".
5. Operator: Accept → Start Segment.

### Narastające Opóźnienie
1. Delta kumulatywna: +3:20. Panel zmienia kolor na żółty.
2. System generuje scenariusze odzysku:
   - A: Skróć Song D do short (-2:00) + Skróć Encore do short (-2:00)
   - B: Pomiń Interlude (-3:30)
3. Showcaller: "Zastosujmy A, nie chcę pomijać Interlude".
4. Operator: tapuje "Zastosuj A" → segmenty Song D i Encore zmienione na wariant short.

### Problem Techniczny
1. Awaria sprzętu na scenie — pauza.
2. Operator dodaje tag: `tech_issue`.
3. Jeśli pauza się przedłuża — delta rośnie → scenariusze odzysku.
4. Po naprawie — kontynuacja show.

### Utrata Połączenia
1. WebSocket disconnected (np. Wi-Fi na venue padł).
2. Panel: "OFFLINE" badge. Ostatnie dane widoczne.
3. Auto-reconnect w tle (exponential backoff).
4. Po reconnect → panel pobiera snapshot stanu z serwera.
5. Showcaller kontynuuje klasycznie (fail-safe).

## Kryteria Akceptacji

- Każda akcja operatora (start/end/skip segment, accept/reject rekomendacji, tag, zastosuj scenariusz) wymaga max 1-2 tapów.
- Dane na panelu aktualizują się co ~5 sekund (engagement) i co 1 sekundę (zegar).
- Panel nie mruga, nie przeskakuje, nie przeładowuje się — stabilny layout.
- Wszystkie akcje operatora są logowane z timestampem (dla post-show).

## Linki

- Poprzedni krok: [Pre-show Setup](./pre-show-setup.md)
- Następny krok: [Post-show Review](./post-show-review.md)
- Features: [operator-panel.md](../../features/operator-panel.md), [engagement-scoring.md](../../features/engagement-scoring.md), [time-control.md](../../features/time-control.md), [ml-recommendations.md](../../features/ml-recommendations.md), [operator-tags.md](../../features/operator-tags.md)
