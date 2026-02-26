import { CircleStop } from "lucide-react";
import { useEffect, useState } from "react";
import { selectCompletedCount, selectTotalDelta, useShowStore } from "@/entities/show";
import { formatDelta, formatDuration } from "@/shared/lib/formatTime";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

export function PostShowCenter() {
  const show = useShowStore((s) => s.show);
  const timeline = useShowStore((s) => s.timeline);
  const endShow = useShowStore((s) => s.endShow);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const actualStartMs = show.actual_start ? new Date(show.actual_start).getTime() : now;
  const elapsedSeconds = Math.floor((now - actualStartMs) / 1000);

  const completedCount = selectCompletedCount(timeline);
  const totalDelta = selectTotalDelta(show, timeline, now);
  const deltaPositive = totalDelta > 0;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8">
      <div className="flex w-full max-w-2xl flex-col items-center gap-5 rounded-xl border border-border bg-card px-10 py-8">
        <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Koncert zakończony
        </span>

        <div className="flex w-full justify-center gap-10">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Czas trwania
            </span>
            <span className="font-mono text-3xl font-bold tabular-nums text-foreground">
              {formatDuration(elapsedSeconds)}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Segmenty</span>
            <span className="font-mono text-3xl font-bold tabular-nums text-foreground">
              {completedCount}/{timeline.length}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Delta końcowa
            </span>
            <span
              className={cn(
                "font-mono text-3xl font-bold tabular-nums",
                deltaPositive ? "text-red-500" : "text-green-500",
              )}
            >
              {formatDelta(totalDelta)}
            </span>
          </div>
        </div>
      </div>

      <Button
        size="lg"
        className="h-16 w-full max-w-2xl bg-red-600 text-lg font-bold text-white hover:bg-red-700"
        onClick={endShow}
      >
        <CircleStop className="mr-2 size-5" />
        ZAKOŃCZ KONCERT
      </Button>
    </div>
  );
}
