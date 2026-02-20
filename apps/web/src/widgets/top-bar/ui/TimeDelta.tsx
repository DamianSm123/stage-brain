import { useShowStore } from "@/entities/show";

function formatDelta(totalSeconds: number): string {
  const abs = Math.abs(totalSeconds);
  const minutes = Math.floor(abs / 60);
  const seconds = abs % 60;
  const sign = totalSeconds >= 0 ? "+" : "-";
  return `${sign}${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getDeltaColor(totalSeconds: number): string {
  if (totalSeconds <= 0) return "text-green-500";
  if (totalSeconds <= 300) return "text-yellow-500";
  return "text-red-500 animate-pulse";
}

export function TimeDelta() {
  const timeline = useShowStore((s) => s.timeline);

  const totalDelta = timeline.reduce((sum, entry) => sum + (entry.delta_seconds ?? 0), 0);

  return (
    <div className="flex items-baseline gap-1">
      <span className="text-xs text-muted-foreground">Δ</span>
      <span
        className={`font-mono text-2xl font-semibold tabular-nums ${getDeltaColor(totalDelta)}`}
      >
        {formatDelta(totalDelta)}
      </span>
    </div>
  );
}
