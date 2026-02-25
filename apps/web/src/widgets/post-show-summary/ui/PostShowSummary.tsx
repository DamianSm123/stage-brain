import { TrendingDown, TrendingUp } from "lucide-react";
import type { TimelineEntry } from "@/entities/segment";
import { cn } from "@/shared/lib/utils";
import { Card, CardContent } from "@/shared/ui/card";
import type { SegmentEngagement } from "@/widgets/post-show-chart";

interface PostShowSummaryProps {
  timeline: TimelineEntry[];
  engagement: SegmentEngagement[];
  actualStart: string;
  actualEnd: string;
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}min`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatDelta(totalSeconds: number): string {
  const abs = Math.abs(totalSeconds);
  const minutes = Math.floor(abs / 60);
  const seconds = abs % 60;
  const sign = totalSeconds >= 0 ? "+" : "-";
  return `${sign}${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getDeltaColor(deltaSeconds: number): string {
  // Negative = ahead of schedule (good), positive = behind schedule (bad)
  if (deltaSeconds <= 0) return "text-green-500";
  if (deltaSeconds <= 120) return "text-yellow-500";
  return "text-red-500";
}

export function PostShowSummary({
  timeline,
  engagement,
  actualStart,
  actualEnd,
}: PostShowSummaryProps) {
  // Duration
  const startMs = new Date(actualStart).getTime();
  const endMs = new Date(actualEnd).getTime();
  const actualDurationSeconds = Math.floor((endMs - startMs) / 1000);
  const plannedDurationSeconds = timeline.reduce((sum, e) => sum + e.planned_duration_seconds, 0);

  // Engagement
  const avgEngagement =
    engagement.length > 0
      ? Math.round(engagement.reduce((sum, e) => sum + e.avg_score, 0) / engagement.length)
      : 0;
  const maxPeak = engagement.length > 0 ? Math.max(...engagement.map((e) => e.peak_score)) : 0;

  // Delta (sum of all segment deltas)
  const totalDelta = timeline.reduce((sum, e) => sum + (e.delta_seconds ?? 0), 0);

  // Decisions
  const skips = timeline.filter((e) => e.status === "skipped").length;
  const variantChanges = timeline.filter(
    (e) => e.variant_used && e.variant_used !== "full" && e.status === "completed",
  ).length;

  const deltaIcon =
    totalDelta <= 0 ? (
      <TrendingDown className="inline size-5 text-green-500" />
    ) : (
      <TrendingUp className="inline size-5 text-red-500" />
    );

  const cards = [
    {
      label: "Czas trwania",
      value: formatDuration(actualDurationSeconds),
      sub: `plan: ${formatDuration(plannedDurationSeconds)}`,
    },
    {
      label: "Śr. energia",
      value: String(avgEngagement),
      sub: `szczyt: ${maxPeak}`,
    },
    {
      label: "Delta",
      value: formatDelta(totalDelta),
      sub: totalDelta >= 0 ? "za planem" : "przed planem",
      valueClass: getDeltaColor(totalDelta),
      icon: deltaIcon,
    },
    {
      label: "Decyzje",
      value: `${skips + variantChanges}`,
      sub: `${skips} pominięć, ${variantChanges} zmian`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="py-4">
          <CardContent className="text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {card.label}
            </p>
            <div
              className={cn(
                "flex items-center justify-center gap-2 text-3xl font-bold tabular-nums",
                card.valueClass ?? "text-foreground",
              )}
            >
              {"icon" in card && card.icon}
              <span>{card.value}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
