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

export function RecommendationPanel() {
  const recommendations = useShowStore((state) => state.recommendations);
  const show = useShowStore((state) => state.show);
  const acceptRecommendation = useShowStore((state) => state.acceptRecommendation);

  const segments = show.setlist.segments;

  // Filter: locked segments are never suggested for skipping,
  // but can appear in recommendations. We limit to max 4 items.
  const visibleRecommendations = recommendations.slice(0, 4);

  const topRec = visibleRecommendations[0];
  const alternatives = visibleRecommendations.slice(1);

  // Empty state
  if (visibleRecommendations.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Recommended Next
        </div>
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <span className="text-sm font-medium text-[#eab308]">
            Brak opcji bez wysokiego ryzyka
          </span>
          <span className="text-xs text-muted-foreground">Rozważ eskalację do producenta</span>
        </div>
      </div>
    );
  }

  const topSegment = segments.find((s) => s.id === topRec.segment_id);

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Recommended Next
      </div>

      {/* Top recommendation — large card */}
      <div className="mb-3 rounded-lg border border-border bg-muted/30 p-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">{topRec.segment_name}</span>
          {topSegment?.is_locked && (
            <span className="text-xs text-muted-foreground" title="Locked">
              🔒
            </span>
          )}
        </div>

        <div className="mb-2 flex items-center gap-2">
          <Badge variant="outline" className={cn("border text-xs", getRiskColor(topRec.risk))}>
            Risk: {getRiskLabel(topRec.risk)}
          </Badge>
        </div>

        <p className="mb-3 text-sm text-muted-foreground">&ldquo;{topRec.reason}&rdquo;</p>

        <Button
          className="min-h-[44px] w-full font-semibold"
          size="lg"
          onClick={() => acceptRecommendation(topRec.segment_id)}
        >
          ACCEPT
        </Button>
      </div>

      {/* Alternatives — smaller cards */}
      {alternatives.length > 0 && (
        <div className="flex flex-col gap-2">
          {alternatives.map((rec, index) => {
            const segment = segments.find((s) => s.id === rec.segment_id);
            return (
              <div
                key={rec.segment_id}
                className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-3 py-2"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">#{index + 2}</span>
                    <span className="text-sm font-medium text-foreground">{rec.segment_name}</span>
                    {segment?.is_locked && (
                      <span className="text-xs text-muted-foreground" title="Locked">
                        🔒
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">&ldquo;{rec.reason}&rdquo;</span>
                </div>
                <Badge
                  variant="outline"
                  className={cn("shrink-0 border text-xs", getRiskColor(rec.risk))}
                >
                  {getRiskLabel(rec.risk)}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
