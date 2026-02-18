# Schemat Bazy Danych

**Status**: Active
**Ostatni przegląd**: 2026-02-18
**Właściciel**: Zespół architektury

---

StageBrain używa **PostgreSQL 16** z rozszerzeniem **TimescaleDB** jako jedynej bazy danych. Dane relacyjne w standardowych tabelach, metryki engagement w hypertable TimescaleDB.

## Schemat Tabel

### Venues & Calibration

```sql
-- Obiekty koncertowe
CREATE TABLE venues (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    type            VARCHAR(50) NOT NULL,       -- 'hall', 'stadium', 'club', 'open_air'
    capacity        INTEGER,
    city            VARCHAR(255),
    country         VARCHAR(100) DEFAULT 'PL',
    default_calibration_id UUID,                -- FK → calibration_presets (nullable)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Presety kalibracji audio
CREATE TABLE calibration_presets (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(255) NOT NULL,      -- 'Hala 5000+ / Pop'
    venue_type          VARCHAR(50),                -- 'hall', 'stadium', 'club', 'open_air'
    capacity_min        INTEGER,
    capacity_max        INTEGER,
    genre               VARCHAR(100),               -- 'pop', 'rock', 'hip-hop', 'electronic'
    energy_baseline     FLOAT NOT NULL DEFAULT 0.3, -- bazowy próg energii
    energy_sensitivity  FLOAT NOT NULL DEFAULT 1.0, -- mnożnik czułości
    crowd_noise_floor   FLOAT NOT NULL DEFAULT 0.1, -- próg szumu
    spectral_threshold  FLOAT NOT NULL DEFAULT 0.5, -- próg jasności dźwięku
    is_system_preset    BOOLEAN NOT NULL DEFAULT FALSE,  -- systemowy vs user-created
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE venues
    ADD CONSTRAINT fk_venues_calibration
    FOREIGN KEY (default_calibration_id) REFERENCES calibration_presets(id);
```

### Shows

```sql
-- Koncerty / wydarzenia
CREATE TABLE shows (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,          -- 'Quebonafide - Warszawa 15.05'
    venue_id        UUID NOT NULL REFERENCES venues(id),
    setlist_id      UUID,                           -- FK → setlists (nullable, ustalany po imporcie)
    calibration_id  UUID REFERENCES calibration_presets(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'setup',  -- setup, live, paused, ended
    scheduled_date  DATE NOT NULL,
    scheduled_start TIMESTAMPTZ,                    -- planowany start show
    actual_start    TIMESTAMPTZ,                    -- faktyczny start
    actual_end      TIMESTAMPTZ,                    -- faktyczny koniec
    curfew          TIMESTAMPTZ NOT NULL,           -- twardy limit zakończenia
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_show_status CHECK (status IN ('setup', 'live', 'paused', 'ended'))
);

CREATE INDEX idx_shows_status ON shows(status);
CREATE INDEX idx_shows_venue ON shows(venue_id);
```

### Setlists & Segments

```sql
-- Setlisty
CREATE TABLE setlists (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    total_planned_duration_seconds INTEGER,       -- łączny planowany czas (kalkulowany)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE shows
    ADD CONSTRAINT fk_shows_setlist
    FOREIGN KEY (setlist_id) REFERENCES setlists(id);

-- Segmenty w setliście
CREATE TABLE segments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setlist_id      UUID NOT NULL REFERENCES setlists(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,          -- 'Tatuaż', 'Candy', 'Bubbletea'
    position        INTEGER NOT NULL,               -- kolejność w setliście (1-based)
    bpm             INTEGER,
    genre           VARCHAR(100),
    expected_energy FLOAT,                          -- 0-1, oczekiwana energia (metadata)
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_segment_position UNIQUE (setlist_id, position)
);

CREATE INDEX idx_segments_setlist ON segments(setlist_id);

-- Warianty segmentu (full, short)
CREATE TABLE segment_variants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    segment_id      UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
    variant_type    VARCHAR(20) NOT NULL,            -- 'full', 'short'
    duration_seconds INTEGER NOT NULL,               -- planowany czas trwania
    description     TEXT,                            -- np. 'Bez drugiego refrenu'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_segment_variant UNIQUE (segment_id, variant_type),
    CONSTRAINT chk_variant_type CHECK (variant_type IN ('full', 'short'))
);
```

### Show Timeline (Faktyczny przebieg)

```sql
-- Faktyczny przebieg koncertu
CREATE TABLE show_timeline (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    show_id         UUID NOT NULL REFERENCES shows(id),
    segment_id      UUID NOT NULL REFERENCES segments(id),
    variant_id      UUID REFERENCES segment_variants(id),  -- który wariant zagrany
    status          VARCHAR(20) NOT NULL,                   -- 'completed', 'skipped'
    started_at      TIMESTAMPTZ,
    ended_at        TIMESTAMPTZ,
    planned_duration_seconds INTEGER,
    actual_duration_seconds INTEGER,                        -- kalkulowane (ended - started)
    delta_seconds   INTEGER,                                -- actual - planned (+ = dłużej, - = krócej)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_timeline_status CHECK (status IN ('active', 'completed', 'skipped'))
);

CREATE INDEX idx_timeline_show ON show_timeline(show_id);
CREATE INDEX idx_timeline_show_segment ON show_timeline(show_id, segment_id);
```

### Engagement Metrics (TimescaleDB Hypertable)

```sql
-- Metryki engagement — time-series (hypertable)
CREATE TABLE engagement_metrics (
    id                  BIGSERIAL,
    show_id             UUID NOT NULL,              -- nie FK (hypertable limitation)
    timestamp           TIMESTAMPTZ NOT NULL,
    score               FLOAT NOT NULL,             -- 0.0 - 1.0
    rms_energy          FLOAT,
    spectral_centroid   FLOAT,
    zcr                 FLOAT,
    spectral_rolloff    FLOAT,
    event_type          VARCHAR(50),                -- 'applause', 'cheering', 'silence', ...
    event_confidence    FLOAT,
    trend               VARCHAR(10),                -- 'rising', 'falling', 'stable'
    raw_features        JSONB,                      -- dodatkowe features do analizy
    PRIMARY KEY (id, timestamp)                     -- required for hypertable
);

-- Utworzenie hypertable (partycjonowanie po timestamp)
SELECT create_hypertable('engagement_metrics', 'timestamp');

-- Indeks na show_id + timestamp (najczęstszy query pattern)
CREATE INDEX idx_engagement_show_time ON engagement_metrics(show_id, timestamp DESC);

-- Kompresja danych starszych niż 7 dni
ALTER TABLE engagement_metrics SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'show_id',
    timescaledb.compress_orderby = 'timestamp DESC'
);
SELECT add_compression_policy('engagement_metrics', INTERVAL '7 days');

-- Continuous aggregate: średnia per minutę (post-show analytics)
CREATE MATERIALIZED VIEW engagement_per_minute
WITH (timescaledb.continuous) AS
SELECT
    show_id,
    time_bucket('1 minute', timestamp) AS minute,
    AVG(score) AS avg_score,
    MAX(score) AS peak_score,
    MIN(score) AS min_score,
    COUNT(*) AS sample_count
FROM engagement_metrics
GROUP BY show_id, minute
WITH NO DATA;

SELECT add_continuous_aggregate_policy('engagement_per_minute',
    start_offset => INTERVAL '1 hour',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '1 minute'
);
```

### Recommendations & Tags

```sql
-- Log rekomendacji ML
CREATE TABLE recommendations_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    show_id         UUID NOT NULL REFERENCES shows(id),
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recommended_segments JSONB NOT NULL,             -- [{segment_id, score, reason}, ...]
    model_version   VARCHAR(50),                     -- wersja modelu ML
    model_confidence FLOAT,                          -- pewność modelu (0-1)
    fallback_used   BOOLEAN NOT NULL DEFAULT FALSE,  -- czy użyto fallbacku regułowego
    operator_decision VARCHAR(20),                   -- 'accept', 'reject', 'ignore'
    accepted_segment_id UUID REFERENCES segments(id),
    decided_at      TIMESTAMPTZ
);

CREATE INDEX idx_reco_show ON recommendations_log(show_id);

-- Tagi operatora
CREATE TABLE operator_tags (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    show_id         UUID NOT NULL REFERENCES shows(id),
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tag             VARCHAR(100) NOT NULL,           -- preset: 'tech_problem', 'energy_drop', ...
    custom_text     TEXT,                            -- opcjonalny opis custom
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tags_show ON operator_tags(show_id);
CREATE INDEX idx_tags_show_time ON operator_tags(show_id, timestamp DESC);
```

### Reports

```sql
-- Raporty post-show
CREATE TABLE reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    show_id         UUID NOT NULL REFERENCES shows(id),
    type            VARCHAR(20) NOT NULL DEFAULT 'pdf',  -- 'pdf', 'html'
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',  -- 'pending', 'generating', 'generated', 'failed'
    file_path       VARCHAR(500),                    -- ścieżka do wygenerowanego pliku
    error_message   TEXT,                            -- w razie błędu generowania
    generated_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_report_status CHECK (status IN ('pending', 'generating', 'generated', 'failed'))
);

CREATE INDEX idx_reports_show ON reports(show_id);
```

---

## Zarządzanie Schematem

### ORM i Migracje

- **ORM**: SQLAlchemy 2.0 (async, deklaratywne modele).
- **Migracje**: Alembic — wszystkie zmiany w schemacie jako pliki migracji wersjonowane w Git.
- **Lokalizacja**: `apps/api/migrations/versions/`.
- **Nazewnictwo**: `{revision_id}_{description}.py` (np. `001_create_venues_and_shows.py`).

### Zasady migracji

1. Nie wolno modyfikować schematu ręcznie na produkcji.
2. Migracje uruchamiane automatycznie przy deploy (`alembic upgrade head`).
3. Każda migracja musi mieć `downgrade()` (rollback).
4. TimescaleDB hypertable i continuous aggregates tworzone w dedykowanych migracjach.

### Retencja Danych

| Typ danych | Retencja | Mechanizm |
|:---|:---|:---|
| **Engagement metrics (raw)** | 90 dni (nieskompresowane) + archiwum (skompresowane) | TimescaleDB compression policy |
| **Engagement per minute (aggregate)** | Bez limitu | Continuous aggregate |
| **Show timeline, tags, reco log** | Bez limitu | Standardowe tabele PostgreSQL |
| **Raporty PDF** | 1 rok | Object Storage + cleanup job |
| **Dane show (setup, setlists)** | Bez limitu | Standardowe tabele PostgreSQL |

---

## Seed Data (Dane początkowe)

Migracja inicjalna powinna załadować:

1. **Systemowe presety kalibracji** (`is_system_preset = true`):
   - "Hala 3000-8000 / Pop"
   - "Hala 3000-8000 / Hip-hop"
   - "Stadion 10000+ / Pop"
   - "Klub 200-1000 / Rock"
   - "Open Air 5000+ / Festival"

2. **Predefiniowane tagi operatora**:
   - `tech_problem` — "Problem techniczny"
   - `energy_drop` — "Energia spada"
   - `energy_peak` — "Publiczność szaleje"
   - `plan_change` — "Zmiana planu"
   - `extra` — "Extra/bis"
