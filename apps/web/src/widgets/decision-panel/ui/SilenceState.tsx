import { selectNextPlannedSegment, useShowStore } from "@/entities/show";
import { formatDuration } from "@/shared/lib/formatTime";

export function SilenceState() {
  const show = useShowStore((s) => s.show);
  const timeline = useShowStore((s) => s.timeline);

  const nextEntry = selectNextPlannedSegment(timeline);
  const segments = show.setlist.segments;
  const nextSegment = nextEntry ? segments.find((s) => s.id === nextEntry.segment_id) : undefined;

  const variantLabel = nextSegment?.variants.find((v) => v.variant_type === "full")
    ? "pełna"
    : (nextSegment?.variants[0]?.variant_type ?? null);

  if (!nextSegment || !nextEntry) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="py-4 text-center text-sm text-muted-foreground">
          Brak kolejnych segmentów
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-[13px] text-muted-foreground">Następny z planu:</div>
      <div className="mt-1 text-[15px] font-medium text-foreground">
        {nextSegment.name}
        {variantLabel && <span className="text-muted-foreground"> [{variantLabel}]</span>}
      </div>
      <div className="mt-0.5 text-[13px] text-muted-foreground">
        {formatDuration(nextEntry.planned_duration_seconds)}
      </div>
      <div className="mt-3 text-xs text-green-500/50">✓ zgodny z planem</div>
    </div>
  );
}
