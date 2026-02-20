"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-02-19
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # --- calibration_presets ---
    op.create_table(
        "calibration_presets",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("venue_type", sa.String(length=50), nullable=True),
        sa.Column("capacity_min", sa.Integer(), nullable=True),
        sa.Column("capacity_max", sa.Integer(), nullable=True),
        sa.Column("genre", sa.String(length=100), nullable=True),
        sa.Column("energy_baseline", sa.Float(), server_default="0.3", nullable=False),
        sa.Column("energy_sensitivity", sa.Float(), server_default="1.0", nullable=False),
        sa.Column("crowd_noise_floor", sa.Float(), server_default="0.1", nullable=False),
        sa.Column("spectral_threshold", sa.Float(), server_default="0.5", nullable=False),
        sa.Column("is_system_preset", sa.Boolean(), server_default="false", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- venues ---
    op.create_table(
        "venues",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=True),
        sa.Column("city", sa.String(length=255), nullable=True),
        sa.Column("country", sa.String(length=100), server_default="PL", nullable=True),
        sa.Column("default_calibration_id", sa.Uuid(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["default_calibration_id"], ["calibration_presets.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- setlists ---
    op.create_table(
        "setlists",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("total_planned_duration_seconds", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # --- shows ---
    op.create_table(
        "shows",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("venue_id", sa.Uuid(), nullable=False),
        sa.Column("setlist_id", sa.Uuid(), nullable=True),
        sa.Column("calibration_id", sa.Uuid(), nullable=True),
        sa.Column("status", sa.String(length=20), server_default="setup", nullable=False),
        sa.Column("scheduled_date", sa.Date(), nullable=False),
        sa.Column("scheduled_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("actual_start", sa.DateTime(timezone=True), nullable=True),
        sa.Column("actual_end", sa.DateTime(timezone=True), nullable=True),
        sa.Column("curfew", sa.DateTime(timezone=True), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "status IN ('setup', 'live', 'paused', 'ended')",
            name="chk_show_status",
        ),
        sa.ForeignKeyConstraint(["calibration_id"], ["calibration_presets.id"]),
        sa.ForeignKeyConstraint(["setlist_id"], ["setlists.id"]),
        sa.ForeignKeyConstraint(["venue_id"], ["venues.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_shows_status", "shows", ["status"])
    op.create_index("idx_shows_venue", "shows", ["venue_id"])

    # --- segments ---
    op.create_table(
        "segments",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("setlist_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("bpm", sa.Integer(), nullable=True),
        sa.Column("genre", sa.String(length=100), nullable=True),
        sa.Column("expected_energy", sa.Float(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["setlist_id"], ["setlists.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("setlist_id", "position", name="uq_segment_position"),
    )
    op.create_index("idx_segments_setlist", "segments", ["setlist_id"])

    # --- segment_variants ---
    op.create_table(
        "segment_variants",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("segment_id", sa.Uuid(), nullable=False),
        sa.Column("variant_type", sa.String(length=20), nullable=False),
        sa.Column("duration_seconds", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "variant_type IN ('full', 'short')",
            name="chk_variant_type",
        ),
        sa.ForeignKeyConstraint(["segment_id"], ["segments.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("segment_id", "variant_type", name="uq_segment_variant"),
    )

    # --- show_timeline ---
    op.create_table(
        "show_timeline",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("show_id", sa.Uuid(), nullable=False),
        sa.Column("segment_id", sa.Uuid(), nullable=False),
        sa.Column("variant_id", sa.Uuid(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("planned_duration_seconds", sa.Integer(), nullable=True),
        sa.Column("actual_duration_seconds", sa.Integer(), nullable=True),
        sa.Column("delta_seconds", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "status IN ('active', 'completed', 'skipped')",
            name="chk_timeline_status",
        ),
        sa.ForeignKeyConstraint(["segment_id"], ["segments.id"]),
        sa.ForeignKeyConstraint(["show_id"], ["shows.id"]),
        sa.ForeignKeyConstraint(["variant_id"], ["segment_variants.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_timeline_show", "show_timeline", ["show_id"])
    op.create_index("idx_timeline_show_segment", "show_timeline", ["show_id", "segment_id"])

    # --- engagement_metrics ---
    op.create_table(
        "engagement_metrics",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("show_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("rms_energy", sa.Float(), nullable=True),
        sa.Column("spectral_centroid", sa.Float(), nullable=True),
        sa.Column("zcr", sa.Float(), nullable=True),
        sa.Column("spectral_rolloff", sa.Float(), nullable=True),
        sa.Column("event_type", sa.String(length=50), nullable=True),
        sa.Column("event_confidence", sa.Float(), nullable=True),
        sa.Column("trend", sa.String(length=10), nullable=True),
        sa.Column("raw_features", postgresql.JSONB(), nullable=True),
        sa.PrimaryKeyConstraint("id", "timestamp"),
    )

    # --- recommendations_log ---
    op.create_table(
        "recommendations_log",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("show_id", sa.Uuid(), nullable=False),
        sa.Column(
            "timestamp", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column("recommended_segments", postgresql.JSONB(), nullable=False),
        sa.Column("model_version", sa.String(length=50), nullable=True),
        sa.Column("model_confidence", sa.Float(), nullable=True),
        sa.Column("fallback_used", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("operator_decision", sa.String(length=20), nullable=True),
        sa.Column("accepted_segment_id", sa.Uuid(), nullable=True),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["accepted_segment_id"], ["segments.id"]),
        sa.ForeignKeyConstraint(["show_id"], ["shows.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_reco_show", "recommendations_log", ["show_id"])

    # --- operator_tags ---
    op.create_table(
        "operator_tags",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("show_id", sa.Uuid(), nullable=False),
        sa.Column(
            "timestamp", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column("tag", sa.String(length=100), nullable=False),
        sa.Column("custom_text", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["show_id"], ["shows.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_tags_show", "operator_tags", ["show_id"])
    op.create_index(
        "idx_tags_show_time",
        "operator_tags",
        ["show_id", sa.text("timestamp DESC")],
    )

    # --- reports ---
    op.create_table(
        "reports",
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("show_id", sa.Uuid(), nullable=False),
        sa.Column("type", sa.String(length=20), server_default="pdf", nullable=False),
        sa.Column("status", sa.String(length=20), server_default="pending", nullable=False),
        sa.Column("file_path", sa.String(length=500), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "status IN ('pending', 'generating', 'generated', 'failed')",
            name="chk_report_status",
        ),
        sa.ForeignKeyConstraint(["show_id"], ["shows.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_reports_show", "reports", ["show_id"])

    # --- TimescaleDB setup ---
    op.execute("CREATE EXTENSION IF NOT EXISTS timescaledb")
    op.execute("SELECT create_hypertable('engagement_metrics', 'timestamp', if_not_exists => TRUE)")
    op.create_index(
        "idx_engagement_show_time",
        "engagement_metrics",
        ["show_id", sa.text("timestamp DESC")],
    )

    # Compression policy
    op.execute("""
        ALTER TABLE engagement_metrics SET (
            timescaledb.compress,
            timescaledb.compress_segmentby = 'show_id',
            timescaledb.compress_orderby = 'timestamp DESC'
        )
    """)
    op.execute("SELECT add_compression_policy('engagement_metrics', INTERVAL '7 days')")

    # Continuous aggregate
    op.execute("""
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
        WITH NO DATA
    """)
    op.execute("""
        SELECT add_continuous_aggregate_policy('engagement_per_minute',
            start_offset => INTERVAL '1 hour',
            end_offset => INTERVAL '1 minute',
            schedule_interval => INTERVAL '1 minute'
        )
    """)

    # --- Seed: system calibration presets ---
    op.execute("""
        INSERT INTO calibration_presets
            (name, venue_type, capacity_min, capacity_max, genre,
             energy_baseline, energy_sensitivity, crowd_noise_floor, spectral_threshold,
             is_system_preset)
        VALUES
            ('Hala 3000-8000 / Pop', 'hall', 3000, 8000, 'pop',
             0.3, 1.0, 0.1, 0.5, true),
            ('Hala 3000-8000 / Hip-hop', 'hall', 3000, 8000, 'hip-hop',
             0.35, 1.2, 0.15, 0.45, true),
            ('Stadion 10000+ / Pop', 'stadium', 10000, NULL, 'pop',
             0.25, 0.8, 0.2, 0.55, true),
            ('Klub 200-1000 / Rock', 'club', 200, 1000, 'rock',
             0.4, 1.3, 0.12, 0.6, true),
            ('Open Air 5000+ / Festival', 'open_air', 5000, NULL, 'electronic',
             0.3, 1.1, 0.25, 0.5, true)
    """)


def downgrade() -> None:
    op.execute("DROP MATERIALIZED VIEW IF EXISTS engagement_per_minute CASCADE")
    op.drop_table("reports")
    op.drop_table("operator_tags")
    op.drop_table("recommendations_log")
    op.drop_table("engagement_metrics")
    op.drop_table("show_timeline")
    op.drop_table("segment_variants")
    op.drop_table("segments")
    op.drop_table("shows")
    op.drop_table("setlists")
    op.drop_table("venues")
    op.drop_table("calibration_presets")
