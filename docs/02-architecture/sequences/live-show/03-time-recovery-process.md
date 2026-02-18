# Time Recovery — Przepływ

**Status**: Active
**Ostatni przegląd**: 2026-02-18

---

## Opis

Kontrola czasu podczas koncertu: monitoring opóźnień, prognoza curfew, automatyczne generowanie scenariuszy odzysku czasu. System proaktywnie informuje operatora o zagrożeniu przekroczenia curfew.

## Diagram — Monitoring i Scenariusze

```mermaid
sequenceDiagram
    participant TM as Time Tracking Engine
    participant DB as PostgreSQL
    participant R as Redis
    participant WS as WebSocket Handler
    participant O as Operator (Panel)

    Note over TM,O: Continuous: co 10s lub przy zmianie segmentu

    TM->>DB: Query: show_timeline (faktyczne czasy) + segments (planowane)
    DB-->>TM: Timeline data

    TM->>TM: Calculate elapsed time (NOW - actual_start)
    TM->>TM: Calculate planned remaining (suma planowanych czasów remaining segments)
    TM->>TM: Calculate delay (suma delt zakończonych segmentów)
    TM->>TM: Project end time (NOW + planned_remaining + estimated_delay)
    TM->>TM: Compare with curfew

    alt Projected end > curfew (opóźnienie zagraża)
        TM->>TM: Generate recovery scenarios

        Note over TM: Scenariusz A: Skróć segmenty
        TM->>TM: Dla każdego planned segmentu z wariantem short:<br/>time_saved = full_duration - short_duration

        Note over TM: Scenariusz B: Pomiń segmenty
        TM->>TM: Dla każdego planned segmentu:<br/>time_saved = full_duration (lub short jeśli już zmieniony)

        Note over TM: Scenariusz C: Hybryd
        TM->>TM: Kombinacja: skróć N + pomiń M → minimalizuj impact na setlistę

        TM->>R: PUBLISH {type: "time_status", delay, projected_end, curfew_delta}
        TM->>R: PUBLISH {type: "recovery_scenarios", scenarios: [...]}
    else Projected end <= curfew (OK)
        TM->>R: PUBLISH {type: "time_status", delay, projected_end, status: "on_track"}
    end

    R->>WS: Subscriber receives
    WS->>O: WebSocket JSON: time_status + recovery_scenarios
    O->>O: Wyświetl: zegar, opóźnienie, prognoza, scenariusze
```

## Diagram — Zastosowanie Scenariusza

```mermaid
sequenceDiagram
    participant O as Operator
    participant API as FastAPI Backend
    participant DB as PostgreSQL
    participant R as Redis

    O->>API: POST /shows/{id}/apply-scenario {scenario_id: "scenario_c"}
    API->>API: Validate scenario (segmenty still planned, warianty exist)

    loop Dla każdego affected segment w scenariuszu
        alt Zmiana wariantu (full → short)
            API->>DB: UPDATE show_timeline SET variant = short
        else Pominięcie segmentu
            API->>DB: UPDATE segment SET status = 'skipped'
            API->>DB: INSERT show_timeline (status: skipped)
        end
    end

    API->>API: Recalculate time projections
    API->>R: PUBLISH {type: "time_status", updated projections}
    API->>R: PUBLISH {type: "segment_update", affected segments}
    API-->>O: OK {time_saved: 660, new_projected_end: "22:28", curfew_delta: "-2 min"}
```

## Logika generowania scenariuszy

### Algorytm

```python
def generate_recovery_scenarios(show, remaining_segments, delay_seconds):
    scenarios = []

    # Scenariusz A: Skróć segmenty (greedy — od największego oszczędzenia)
    shortable = [s for s in remaining_segments if s.has_variant("short") and s.current_variant == "full"]
    shortable.sort(key=lambda s: s.full_duration - s.short_duration, reverse=True)
    scenario_a = build_shorten_scenario(shortable, delay_seconds)
    if scenario_a.time_saved > 0:
        scenarios.append(scenario_a)

    # Scenariusz B: Pomiń segmenty (od najniższego expected_energy / najkrótszego)
    skippable = [s for s in remaining_segments if s.status == "planned"]
    skippable.sort(key=lambda s: s.expected_energy)  # pomiń najmniej energetyczne
    scenario_b = build_skip_scenario(skippable, delay_seconds)
    if scenario_b.time_saved > 0:
        scenarios.append(scenario_b)

    # Scenariusz C: Hybryd (skróć co się da, potem pomiń)
    scenario_c = build_hybrid_scenario(shortable, skippable, delay_seconds)
    if scenario_c.time_saved > 0:
        scenarios.append(scenario_c)

    return scenarios
```

### Priorytety

1. **Skracanie** (mniejszy impact na show) ma priorytet nad **pomijaniem**.
2. Pomijanie sortowane po `expected_energy` — najpierw pomijamy segmenty o najniższej oczekiwanej energii (najmniej stracona wartość).
3. Scenariusze generowane tylko gdy `projected_end > curfew` (nie spamujemy operatora gdy jest on track).

### Threshold

- Scenariusze generowane od `delay > 60 sekund`.
- Alert (visual cue w panelu) od `delay > 180 sekund` lub `projected_end > curfew`.
