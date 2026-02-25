import { useEffect, useRef, useState } from "react";
import {
  selectActiveSegment,
  selectIsInDecisionWindow,
  selectNextPlannedSegment,
  useShowStore,
} from "@/entities/show";
import { formatDuration } from "@/shared/lib/formatTime";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Slider } from "@/shared/ui/slider";

const VARIANT_LABELS: Record<string, string> = {
  full: "pełna",
  short: "krótka",
  extended: "rozszerzona",
  acoustic: "akustyczna",
};

export function NowPlaying() {
  const show = useShowStore((state) => state.show);
  const timeline = useShowStore((state) => state.timeline);
  const seekSegment = useShowStore((state) => state.seekSegment);
  const seekSegmentCommit = useShowStore((state) => state.seekSegmentCommit);
  const setSegmentStatus = useShowStore((state) => state.setSegmentStatus);
  const [now, setNow] = useState(Date.now());
  const autoAdvancedRef = useRef<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const segments = show.setlist.segments;
  const activeEntry = selectActiveSegment(timeline);
  const activeSegment = activeEntry
    ? segments.find((s) => s.id === activeEntry.segment_id)
    : undefined;

  const nextEntry = selectNextPlannedSegment(timeline);
  const nextSegment = nextEntry ? segments.find((s) => s.id === nextEntry.segment_id) : undefined;

  const isInDecisionWindow = selectIsInDecisionWindow(timeline, now);

  // Auto-advance: when elapsed >= planned duration, auto-complete and start next
  const startedAtMs = activeEntry?.started_at ? new Date(activeEntry.started_at).getTime() : null;
  const currentElapsed = startedAtMs ? Math.max(0, Math.floor((now - startedAtMs) / 1000)) : 0;

  useEffect(() => {
    if (!activeEntry) return;
    if (currentElapsed < activeEntry.planned_duration_seconds) {
      // Reset ref when a new segment starts or time is below threshold
      if (autoAdvancedRef.current !== activeEntry.id) {
        autoAdvancedRef.current = null;
      }
      return;
    }
    // Prevent double-trigger
    if (autoAdvancedRef.current === activeEntry.id) return;
    autoAdvancedRef.current = activeEntry.id;

    setSegmentStatus(activeEntry.id, "completed");
    if (nextEntry) {
      setSegmentStatus(nextEntry.id, "active");
    }
  }, [activeEntry, currentElapsed, nextEntry, setSegmentStatus]);

  if (!activeEntry || !activeSegment) {
    const allDone =
      timeline.length > 0 &&
      timeline.every((e) => e.status === "completed" || e.status === "skipped");
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <span className="text-lg font-semibold text-muted-foreground">
          {allDone ? "Koncert zakończony" : "Oczekiwanie na start"}
        </span>
      </div>
    );
  }

  const elapsedSeconds = Math.max(0, Math.floor((now - (startedAtMs ?? now)) / 1000));
  const totalSeconds = activeEntry.planned_duration_seconds;

  const handleSeek = (value: number[]) => {
    if (value[0] != null) {
      seekSegment(activeEntry.segment_id, value[0]);
    }
  };

  const handleSeekCommit = (value: number[]) => {
    if (value[0] != null) {
      seekSegmentCommit(activeEntry.segment_id, value[0]);
    }
  };

  const variantLabel = activeEntry.variant_used
    ? (VARIANT_LABELS[activeEntry.variant_used] ?? activeEntry.variant_used)
    : null;

  const nextVariant =
    nextSegment?.variants.find((v) => v.variant_type === "full") ?? nextSegment?.variants[0];
  const nextVariantLabel = nextVariant
    ? (VARIANT_LABELS[nextVariant.variant_type] ?? nextVariant.variant_type)
    : null;

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4",
        isInDecisionWindow && "ring-1 ring-amber-500/60 animate-pulse",
      )}
    >
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        ▶ Teraz gra
      </div>

      <div className="mb-3 flex items-center gap-3">
        <span className="text-2xl font-bold text-foreground">{activeSegment.name}</span>
        {variantLabel && (
          <Badge variant="outline" className="text-xs">
            {variantLabel}
          </Badge>
        )}
      </div>

      {/* Seekable progress bar */}
      <Slider
        value={[Math.min(elapsedSeconds, totalSeconds)]}
        min={0}
        max={totalSeconds}
        step={1}
        onValueChange={handleSeek}
        onValueCommit={handleSeekCommit}
        className="mb-1 [&_[data-slot=slider-track]]:h-2.5 [&_[data-slot=slider-thumb]]:size-3"
      />

      <div className="mb-4 flex justify-between text-sm tabular-nums text-muted-foreground">
        <span>{formatDuration(elapsedSeconds)}</span>
        <span>/ {formatDuration(totalSeconds)}</span>
      </div>

      {nextSegment && nextEntry && (
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">⏭ NASTĘPNY: </span>
          {nextSegment.name}
          {nextVariantLabel && <span> ({nextVariantLabel})</span>}
          <span className="ml-2 tabular-nums">
            {formatDuration(nextEntry.planned_duration_seconds)}
          </span>
        </div>
      )}
    </div>
  );
}
