import type { RiskLevel } from "@/entities/recommendation";
import { selectNextPlannedSegment, useShowStore } from "@/entities/show";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

function getRiskBorder(risk: RiskLevel): string {
  switch (risk) {
    case "low":
      return "border-green-500/40 bg-green-500/5";
    case "medium":
      return "border-yellow-500/40 bg-yellow-500/5";
    case "high":
      return "border-red-500/40 bg-red-500/5";
  }
}

function getRiskButtonStyle(risk: RiskLevel): string {
  switch (risk) {
    case "low":
      return "border-green-500/40 text-green-400 hover:bg-green-500/10 hover:text-green-300";
    case "medium":
      return "border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10 hover:text-yellow-300";
    case "high":
      return "border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300";
  }
}

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

function getContextTag(reason: string): string {
  if (reason.includes("energy")) return "↗ Wzrost energii";
  if (reason.includes("contrast")) return "↘ Kontrast";
  if (reason.includes("pyro") || reason.includes("setup")) return "⏱ Wymaga przygotowania";
  if (reason.includes("match")) return "↗ Wzrost energii";
  return `↗ ${reason}`;
}

export function SuggestionState() {
  const recommendations = useShowStore((s) => s.recommendations);
  const show = useShowStore((s) => s.show);
  const timeline = useShowStore((s) => s.timeline);
  const acceptRecommendation = useShowStore((s) => s.acceptRecommendation);

  const nextEntry = selectNextPlannedSegment(timeline);
  const segments = show.setlist.segments;
  const nextSegment = nextEntry ? segments.find((s) => s.id === nextEntry.segment_id) : undefined;

  const allRecs = recommendations.slice(0, 3);

  if (allRecs.length === 0) return null;

  const replacesName = nextSegment?.name ?? "plan";
  const animationKey = allRecs.map((r) => r.segment_id).join(",");

  return (
    <div
      key={animationKey}
      className={cn(
        "rounded-lg border p-4 animate-in fade-in-0 slide-in-from-top-2 duration-300",
        getRiskBorder(allRecs[0].risk),
      )}
    >
      <div className="mb-1 text-xs font-medium uppercase text-blue-400">SUGESTIA</div>
      <div className="mb-3 text-[13px] text-muted-foreground">zamiast {replacesName}</div>

      <div className="flex flex-col gap-2">
        {allRecs.map((rec, index) => (
          <div key={rec.segment_id}>
            {index > 0 && <div className="mb-2 border-t border-border/50" />}
            <div className="mb-1.5 flex items-center gap-2">
              <span className={cn("size-2 shrink-0 rounded-full", getRiskDot(rec.risk))} />
              <span className="text-sm font-medium text-foreground">{rec.segment_name}</span>
            </div>
            <div className="mb-1.5 pl-4 text-[12px] text-muted-foreground">
              {getContextTag(rec.reason)}
            </div>
            <Button
              variant="outline"
              className={cn("min-h-[36px] w-full font-semibold", getRiskButtonStyle(rec.risk))}
              size="sm"
              onClick={() => acceptRecommendation(rec.segment_id)}
            >
              ZATWIERDŹ
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
