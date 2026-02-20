import type { RiskLevel } from "@/entities/recommendation";
import { useShowStore } from "@/entities/show";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

function getRiskColor(risk: RiskLevel): string {
  switch (risk) {
    case "low":
      return "bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30";
    case "medium":
      return "bg-[#eab308]/20 text-[#eab308] border-[#eab308]/30";
    case "high":
      return "bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30";
  }
}

function getRiskLabel(risk: RiskLevel): string {
  switch (risk) {
    case "low":
      return "LOW";
    case "medium":
      return "MED";
    case "high":
      return "HIGH";
  }
}

function formatTimeSaved(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function RecoveryScenarios() {
  const timeline = useShowStore((state) => state.timeline);
  const recoveryScenarios = useShowStore((state) => state.recoveryScenarios);

  // Sum of delta_seconds from completed segments — positive means behind schedule
  const totalDelta = timeline.reduce((sum, entry) => {
    if (entry.delta_seconds != null && entry.delta_seconds > 0) {
      return sum + entry.delta_seconds;
    }
    return sum;
  }, 0);

  // Only visible when show is behind schedule (delta > 0)
  if (totalDelta <= 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Recovery Scenarios
      </div>

      <div className="mb-3 text-xs text-muted-foreground">
        Behind schedule by{" "}
        <span className="font-semibold text-[#ef4444]">{formatTimeSaved(totalDelta)}</span>
      </div>

      <div className="flex flex-col gap-2">
        {recoveryScenarios.map((scenario) => (
          <div
            key={scenario.id}
            className={cn(
              "rounded-lg border px-3 py-3",
              scenario.is_compound
                ? "border-[#eab308]/40 bg-[#eab308]/5"
                : "border-border bg-muted/20",
            )}
          >
            <div className="mb-1 flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {scenario.description}
                  </span>
                  {scenario.is_compound && <span className="text-xs text-[#eab308]">COMBO</span>}
                </div>
                <span className="text-xs text-muted-foreground">{scenario.impact}</span>
              </div>
              <Badge
                variant="outline"
                className={cn("shrink-0 border text-xs", getRiskColor(scenario.risk))}
              >
                {getRiskLabel(scenario.risk)}
              </Badge>
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm font-semibold tabular-nums text-[#22c55e]">
                -{formatTimeSaved(scenario.time_saved_seconds)}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="min-h-[44px] min-w-[100px] font-semibold"
              >
                ZASTOSUJ
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
