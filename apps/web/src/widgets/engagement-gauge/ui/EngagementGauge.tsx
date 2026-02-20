import type { EngagementTrend } from "@/entities/engagement-metric";
import { useShowStore } from "@/entities/show";
import { cn } from "@/shared/lib/utils";
import { Progress } from "@/shared/ui/progress";

function getIndicatorClass(score: number): string {
  if (score < 30) return "[&_[data-slot=progress-indicator]]:bg-[#ef4444]";
  if (score < 60) return "[&_[data-slot=progress-indicator]]:bg-[#eab308]";
  return "[&_[data-slot=progress-indicator]]:bg-[#22c55e]";
}

function getScoreColor(score: number): string {
  if (score < 30) return "text-[#ef4444]";
  if (score < 60) return "text-[#eab308]";
  return "text-[#22c55e]";
}

function getTrendArrow(trend: EngagementTrend): string {
  switch (trend) {
    case "rising":
      return "↑";
    case "stable":
      return "→";
    case "falling":
      return "↓";
  }
}

function getTrendClass(trend: EngagementTrend): string {
  switch (trend) {
    case "rising":
      return "text-[#22c55e]";
    case "stable":
      return "text-[#eab308]";
    case "falling":
      return "text-[#ef4444]";
  }
}

export function EngagementGauge() {
  const engagement = useShowStore((state) => state.engagement);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Engagement
        </span>
        <div className="flex items-center gap-2">
          {engagement.event_type && (
            <span className="text-xs text-muted-foreground">{engagement.event_type}</span>
          )}
          <span className={cn("text-lg font-bold", getTrendClass(engagement.trend))}>
            {getTrendArrow(engagement.trend)}
          </span>
        </div>
      </div>

      <Progress
        value={engagement.score}
        className={cn("mb-1 h-3", getIndicatorClass(engagement.score))}
      />

      <div className="flex items-center justify-between text-sm">
        <span className={cn("tabular-nums font-semibold", getScoreColor(engagement.score))}>
          {engagement.score}
        </span>
        <span className="text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}
