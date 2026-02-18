# ADR-0004: TimescaleDB dla Engagement Metrics

**Status**: Accepted
**Data**: 2026-02-18
**Autorzy**: Zespół architektury (sesja architektoniczna)

---

## Kontekst

StageBrain generuje metryki engagement co 5-10 sekund podczas koncertu. Dla 90-minutowego show to ~540-1080 rekordów per show. Dane te muszą być:

- **Zapisywane w real-time** (nie mogą blokować pipeline audio).
- **Queryowane efektywnie** po zakresie czasowym (post-show analytics: "pokaż engagement od minuty 30 do 45").
- **Agregowane** (średnia per segment, peak per show, trend w oknie N minut).
- **Archiwizowane** z kompresją (dane z poprzednich koncertów zajmują coraz mniej miejsca).

## Rozważane Alternatywy

### 1. Czysty PostgreSQL (bez rozszerzeń)

- Standardowe tabele z indeksem na timestamp.
- **Problem**: Brak natywnego partycjonowania po czasie. Zapytania temporalne (range queries, moving averages) wymagają custom SQL. Brak continuous aggregates — post-show analytics wymaga pełnego skanowania.
- **Verdict**: Wystarczający na MVP, ale ogranicza post-show analytics.

### 2. PostgreSQL + InfluxDB

- Dane relacyjne w PostgreSQL, time-series w InfluxDB.
- **Problem**: Druga baza danych = drugi serwis w Docker Compose, druga konfiguracja, backup, monitoring. Dwukrotny koszt operacyjny przy minimalnym zysku na skali MVP.

### 3. PostgreSQL + TimescaleDB extension (wybrana)

- Jedna baza danych. TimescaleDB to extension PostgreSQL — instalowane jak `CREATE EXTENSION`.
- Hypertable na metryki engagement. Standardowe tabele na resztę.

## Decyzja

Wybieramy **PostgreSQL 16 z rozszerzeniem TimescaleDB** jako jedyną bazę danych.

### Podział danych

| Typ danych | Mechanizm | Przykład |
|:---|:---|:---|
| **Relacyjne** | Standardowe tabele PostgreSQL | `venues`, `shows`, `setlists`, `segments`, `calibration_presets` |
| **Time-series** | TimescaleDB hypertable | `engagement_metrics` (score, trend, event_type co 5-10s) |
| **Logi** | Standardowe tabele | `recommendations_log`, `operator_tags`, `show_timeline` |

### Konfiguracja hypertable

```sql
CREATE TABLE engagement_metrics (
    id          BIGSERIAL,
    show_id     UUID NOT NULL REFERENCES shows(id),
    timestamp   TIMESTAMPTZ NOT NULL,
    score       FLOAT NOT NULL,          -- 0.0-1.0
    rms_energy  FLOAT,
    spectral_centroid FLOAT,
    zcr         FLOAT,
    event_type  VARCHAR(50),             -- 'applause', 'cheering', 'silence', ...
    event_confidence FLOAT,
    trend       VARCHAR(10),             -- 'rising', 'falling', 'stable'
    raw_features JSONB                   -- dodatkowe features do analizy
);

SELECT create_hypertable('engagement_metrics', 'timestamp');
```

### Continuous Aggregates (post-show analytics)

```sql
-- Pre-obliczona średnia engagement per minutę
CREATE MATERIALIZED VIEW engagement_per_minute
WITH (timescaledb.continuous) AS
SELECT
    show_id,
    time_bucket('1 minute', timestamp) AS minute,
    AVG(score) AS avg_score,
    MAX(score) AS peak_score,
    MIN(score) AS min_score,
    mode() WITHIN GROUP (ORDER BY event_type) AS dominant_event
FROM engagement_metrics
GROUP BY show_id, minute;
```

## Uzasadnienie

1. **Zero dodatkowego kosztu operacyjnego**: Extension, nie osobna baza. Jeden backup, jeden connection string, jedno narzędzie.
2. **Automatyczne partycjonowanie**: Hypertable partycjonuje po czasie — query "daj mi dane z ostatnich 10 minut" jest szybki bez ręcznych optymalizacji.
3. **Continuous aggregates**: Post-show analytics bez pełnego skanowania tabeli — pre-obliczone średnie per minuta/segment.
4. **Kompresja**: Dane starsze niż N dni automatycznie kompresowane (90%+ redukcja storage).
5. **Pełna kompatybilność z PostgreSQL**: SQLAlchemy, Alembic, asyncpg — wszystko działa jak z czystym PostgreSQL. Hypertable to po prostu tabela z "supermocami".

## Konsekwencje

- (+) Szybkie zapytania temporalne od razu (bez optymalizacji).
- (+) Post-show analytics efektywne dzięki continuous aggregates.
- (+) Kompresja starych danych — skalowalność storage.
- (+) Jedno narzędzie do backupu, monitoringu, migracji.
- (-) TimescaleDB extension musi być zainstalowany w obrazie Docker PostgreSQL (oficjalny obraz `timescale/timescaledb` dostępny).
- (-) Hypertable ma ograniczenia: brak UPDATE na skompresowanych chunkach, unikalne indexy muszą zawierać kolumnę partycjonowania.
- (-) Na skali MVP (~1000 rekordów per show) zwykły PostgreSQL byłby wystarczający — TimescaleDB to inwestycja w przyszłość.

## Rewizja

Ta decyzja powinna zostać zrewidowana, jeśli:
- TimescaleDB extension powoduje problemy z kompatybilnością (mało prawdopodobne).
- Skala danych rośnie do milionów rekordów/dziennie (multi-venue) → rozważyć dedykowaną bazę time-series.
