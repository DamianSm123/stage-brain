import { useEffect, useState } from "react";
import { useShowStore } from "@/entities/show";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Progress } from "@/shared/ui/progress";

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function NowPlaying() {
  const show = useShowStore((state) => state.show);
  const timeline = useShowStore((state) => state.timeline);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const segments = show.setlist.segments;

  const activeEntry = timeline.find((e) => e.status === "active");
  const activeSegment = activeEntry
    ? segments.find((s) => s.id === activeEntry.segment_id)
    : undefined;

  const nextEntry = timeline.find((e) => e.status === "planned");
  const nextSegment = nextEntry ? segments.find((s) => s.id === nextEntry.segment_id) : undefined;

  if (!activeEntry || !activeSegment) {
    const allDone =
      timeline.length > 0 &&
      timeline.every((e) => e.status === "completed" || e.status === "skipped");
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <span className="text-lg font-semibold text-muted-foreground">
          {allDone ? "Show ended" : "Show not started"}
        </span>
      </div>
    );
  }

  const startedAt = activeEntry.started_at ? new Date(activeEntry.started_at).getTime() : now;
  const elapsedSeconds = Math.max(0, Math.floor((now - startedAt) / 1000));
  const totalSeconds = activeEntry.planned_duration_seconds;
  const progressPercent = Math.min(100, (elapsedSeconds / totalSeconds) * 100);
  const isOvertime = elapsedSeconds > totalSeconds;
  const overtimeSeconds = isOvertime ? elapsedSeconds - totalSeconds : 0;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        ▶ Now Playing
      </div>

      <div className="mb-3 flex items-center gap-3">
        <span className="text-2xl font-bold text-foreground">{activeSegment.name}</span>
        {activeEntry.variant_used && (
          <Badge variant="outline" className="text-xs">
            {activeEntry.variant_used}
          </Badge>
        )}
      </div>

      <Progress
        value={progressPercent}
        className={cn("mb-1 h-3", isOvertime && "[&_[data-slot=progress-indicator]]:bg-red-500")}
      />

      <div
        className={cn(
          "flex justify-between text-sm tabular-nums text-muted-foreground",
          isOvertime ? "mb-1 text-red-500" : "mb-4",
        )}
      >
        <span>{formatTime(elapsedSeconds)}</span>
        <span>/ {formatTime(totalSeconds)}</span>
      </div>

      {isOvertime && (
        <div className="mb-3 text-center text-lg font-bold text-red-500 animate-pulse">
          OVERTIME +{formatTime(overtimeSeconds)}
        </div>
      )}

      {nextSegment && nextEntry && (
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">NEXT: </span>
          {nextSegment.name}
          {nextSegment.variants.length > 0 && (
            <span> ({nextSegment.variants[0].variant_type})</span>
          )}
          <span className="ml-2 tabular-nums">
            {formatTime(nextEntry.planned_duration_seconds)}
          </span>
        </div>
      )}
    </div>
  );
}
