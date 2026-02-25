import { useShowStore } from "@/entities/show";

function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function PreShowSidebar() {
  const show = useShowStore((s) => s.show);

  const segments = show.setlist.segments;
  const firstSegment = segments[0];
  const firstVariant =
    firstSegment?.variants.find((v) => v.variant_type === "full") ?? firstSegment?.variants[0];
  const totalDuration = show.setlist.total_planned_duration_seconds;

  return (
    <div className="flex flex-col gap-3">
      {firstSegment && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pierwszy segment
          </h3>
          <p className="text-sm font-medium text-foreground">{firstSegment.name}</p>
          {firstVariant && (
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDuration(firstVariant.duration_seconds)}
            </p>
          )}
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Podsumowanie
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Łączny czas</span>
            <span className="font-medium text-foreground">{formatDuration(totalDuration)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Segmenty</span>
            <span className="font-medium text-foreground">{segments.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
