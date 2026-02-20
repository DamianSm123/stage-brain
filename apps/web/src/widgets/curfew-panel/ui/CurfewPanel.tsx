import { useEffect, useState } from "react";
import { useShowStore } from "@/entities/show";
import { cn } from "@/shared/lib/utils";

function formatCountdown(diffMs: number): string {
  const abs = Math.abs(diffMs);
  const hours = Math.floor(abs / (1000 * 60 * 60));
  const minutes = Math.floor((abs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((abs % (1000 * 60)) / 1000);

  const prefix = diffMs >= 0 ? "-" : "+";
  const hStr = hours.toString().padStart(2, "0");
  const mStr = minutes.toString().padStart(2, "0");
  const sStr = seconds.toString().padStart(2, "0");

  return `${prefix}${hStr}:${mStr}:${sStr}`;
}

function formatDelta(totalSeconds: number): string {
  const abs = Math.abs(totalSeconds);
  const minutes = Math.floor(abs / 60);
  const seconds = abs % 60;
  const sign = totalSeconds >= 0 ? "+" : "-";
  return `${sign}${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getUrgencyLevel(diffMs: number): "ok" | "warning" | "critical" {
  if (diffMs <= 0) return "critical";
  const minutes = diffMs / (1000 * 60);
  if (minutes <= 10) return "critical";
  if (minutes <= 30) return "warning";
  return "ok";
}

function getCardClasses(urgency: "ok" | "warning" | "critical"): string {
  switch (urgency) {
    case "ok":
      return "border-border bg-card";
    case "warning":
      return "border-yellow-500/40 bg-yellow-500/5";
    case "critical":
      return "border-red-500/40 bg-red-500/5";
  }
}

function getCountdownColor(urgency: "ok" | "warning" | "critical"): string {
  switch (urgency) {
    case "ok":
      return "text-green-500";
    case "warning":
      return "text-yellow-500";
    case "critical":
      return "text-red-500 animate-pulse";
  }
}

export function CurfewPanel() {
  const curfew = useShowStore((s) => s.show.curfew);
  const timeline = useShowStore((s) => s.timeline);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const curfewDate = new Date(curfew);
  const diffMs = curfewDate.getTime() - now;
  const urgency = getUrgencyLevel(diffMs);

  // Live delta: sum of completed/skipped deltas + current segment overtime
  const activeEntry = timeline.find((e) => e.status === "active");

  const pastDelta = timeline.reduce((sum, entry) => {
    if (entry.status === "completed" || entry.status === "skipped") {
      return sum + (entry.delta_seconds ?? 0);
    }
    return sum;
  }, 0);

  let currentOvertime = 0;
  if (activeEntry?.started_at) {
    const elapsed = Math.floor((now - new Date(activeEntry.started_at).getTime()) / 1000);
    currentOvertime = Math.max(0, elapsed - activeEntry.planned_duration_seconds);
  }

  const liveDelta = pastDelta + currentOvertime;

  // Projection: remaining planned time + now = projected end
  let remainingSeconds = 0;
  if (activeEntry?.started_at) {
    const elapsed = Math.floor((now - new Date(activeEntry.started_at).getTime()) / 1000);
    remainingSeconds += Math.max(0, activeEntry.planned_duration_seconds - elapsed);
  }
  for (const entry of timeline) {
    if (entry.status === "planned") {
      remainingSeconds += entry.planned_duration_seconds;
    }
  }

  const projectedEnd = new Date(now + remainingSeconds * 1000);
  const overBySeconds = Math.floor((projectedEnd.getTime() - curfewDate.getTime()) / 1000);

  return (
    <div className={cn("rounded-lg border p-4 text-center", getCardClasses(urgency))}>
      <div
        className={cn(
          "font-mono text-5xl font-bold tabular-nums leading-tight",
          getCountdownColor(urgency),
        )}
      >
        {formatCountdown(diffMs)}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Curfew</div>
      <div className="mt-2 flex items-center justify-center gap-2 text-sm tabular-nums text-muted-foreground">
        <span className={cn(liveDelta > 0 ? "text-red-500" : "text-green-500")}>
          {"\u0394"} {formatDelta(liveDelta)}
        </span>
        <span className="text-muted-foreground/50">·</span>
        <span>
          Ends {formatTime(projectedEnd)}
          {" · "}
          {overBySeconds <= 0 ? (
            <span className="text-green-500">OK</span>
          ) : (
            <span className="text-red-500">OVER {formatDelta(overBySeconds)}</span>
          )}
        </span>
      </div>
    </div>
  );
}
