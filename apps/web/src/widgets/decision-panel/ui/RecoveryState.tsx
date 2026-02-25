import { useEffect, useState } from "react";
import type { RiskLevel } from "@/entities/recommendation";
import { selectTotalDelta, useShowStore } from "@/entities/show";
import { formatDelta } from "@/shared/lib/formatTime";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

function getRiskDot(risk: RiskLevel): string {
  switch (risk) {
    case "low":
      return "bg-green-500";
    case "medium":
      return "bg-yellow-500";
    case "high":
      return "bg-red-500";
  }
}

function getRiskButtonStyle(risk: RiskLevel): string {
  switch (risk) {
    case "low":
      return "border-green-500/40 text-green-400 hover:bg-green-500/10 hover:text-green-300";
    case "medium":
      return "border-amber-500/40 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300";
    case "high":
      return "border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300";
  }
}

export function RecoveryState() {
  const show = useShowStore((s) => s.show);
  const timeline = useShowStore((s) => s.timeline);
  const recoveryScenarios = useShowStore((s) => s.recoveryScenarios);
  const applyRecoveryScenario = useShowStore((s) => s.applyRecoveryScenario);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const totalDelta = selectTotalDelta(show, timeline, now);

  const animationKey = recoveryScenarios.map((s) => s.id).join(",");

  return (
    <div
      key={animationKey}
      className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4 animate-in fade-in-0 slide-in-from-top-2 duration-300"
    >
      <div className="mb-1 text-xs font-medium uppercase text-amber-400">RECOVERY</div>
      <div className="mb-3 text-sm font-bold text-amber-500">
        ⚠ Opóźnienie {formatDelta(totalDelta)}
      </div>

      <div className="flex flex-col gap-2">
        {recoveryScenarios.map((scenario, index) => (
          <div key={scenario.id}>
            {index > 0 && <div className="mb-2 border-t border-amber-500/20" />}
            <div className="mb-1.5 flex items-center gap-2">
              <span className={cn("size-2 shrink-0 rounded-full", getRiskDot(scenario.risk))} />
              <span className="text-sm font-medium text-foreground">{scenario.description}</span>
            </div>
            <div className="mb-1.5 flex items-center gap-2 pl-4 text-[12px] text-muted-foreground">
              <span className="text-green-500 tabular-nums font-medium">
                -{formatDelta(scenario.time_saved_seconds).slice(1)}
              </span>
              <span>· {scenario.impact}</span>
            </div>
            <Button
              variant="outline"
              className={cn("min-h-[36px] w-full font-semibold", getRiskButtonStyle(scenario.risk))}
              size="sm"
              onClick={() => applyRecoveryScenario(scenario.id)}
            >
              ZASTOSUJ
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
