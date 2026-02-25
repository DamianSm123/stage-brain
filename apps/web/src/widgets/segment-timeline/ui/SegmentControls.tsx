import { Pause, Play, SkipForward, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { selectActiveSegment, selectNextPlannedSegment, useShowStore } from "@/entities/show";
import { Button } from "@/shared/ui/button";

export function SegmentControls() {
  const show = useShowStore((s) => s.show);
  const timeline = useShowStore((s) => s.timeline);
  const setSegmentStatus = useShowStore((s) => s.setSegmentStatus);
  const holdShow = useShowStore((s) => s.holdShow);
  const resumeShow = useShowStore((s) => s.resumeShow);
  const holdStartedAt = useShowStore((s) => s.holdStartedAt);

  const activeEntry = selectActiveSegment(timeline);
  const nextPlanned = selectNextPlannedSegment(timeline);
  const segments = show.setlist.segments;

  const activeSegment = activeEntry
    ? segments.find((s) => s.id === activeEntry.segment_id)
    : undefined;
  const nextSegment = nextPlanned
    ? segments.find((s) => s.id === nextPlanned.segment_id)
    : undefined;

  // Setup or ended — no controls
  if (show.status === "setup" || show.status === "ended") return null;

  // Paused (HOLD) state
  if (show.status === "paused") {
    return <HoldControls holdStartedAt={holdStartedAt} onResume={resumeShow} />;
  }

  // Between segments (no active, has next planned)
  if (!activeEntry && nextPlanned && nextSegment) {
    return (
      <div className="shrink-0 mt-2 border-t border-border pt-2">
        <Button
          className="min-h-[44px] w-full bg-green-600 text-white hover:bg-green-700 text-sm font-semibold"
          onClick={() => setSegmentStatus(nextPlanned.id, "active")}
        >
          <Play className="size-4 fill-current" />
          ROZPOCZNIJ {nextSegment.name}
        </Button>
      </div>
    );
  }

  // Active segment
  if (activeEntry && activeSegment) {
    return (
      <div className="shrink-0 mt-2 flex flex-col gap-1.5 border-t border-border pt-2">
        <Button
          className="min-h-[44px] w-full bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold"
          onClick={() => {
            setSegmentStatus(activeEntry.id, "completed");
            if (nextPlanned) {
              setSegmentStatus(nextPlanned.id, "active");
            }
          }}
        >
          <Square className="size-3.5 fill-current" />
          ZAKOŃCZ {activeSegment.name}
        </Button>
        <div className="flex gap-1.5">
          <Button
            className="min-h-[44px] flex-1 bg-gray-600 text-white hover:bg-gray-700 text-sm"
            disabled={!nextPlanned}
            onClick={() => {
              if (nextPlanned) {
                setSegmentStatus(nextPlanned.id, "skipped");
              }
            }}
          >
            <SkipForward className="size-4 fill-current" />
            POMIŃ
          </Button>
          <Button
            className="min-h-[44px] flex-1 bg-amber-600 text-white hover:bg-amber-700 text-sm"
            onClick={holdShow}
          >
            <Pause className="size-4 fill-current" />
            WSTRZYM.
          </Button>
        </div>
      </div>
    );
  }

  return null;
}

interface HoldControlsProps {
  holdStartedAt: string | null;
  onResume: () => void;
}

function HoldControls({ holdStartedAt, onResume }: HoldControlsProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!holdStartedAt) return;
    const start = new Date(holdStartedAt).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [holdStartedAt]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timerStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  return (
    <div className="shrink-0 mt-2 flex flex-col gap-1.5 border-t border-border pt-2">
      <div className="flex items-center justify-between rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-500">
        <span className="flex items-center gap-1.5 font-medium">
          <Pause className="size-3.5 fill-amber-500" />
          WSTRZYMANO
        </span>
        <span className="font-mono tabular-nums">{timerStr}</span>
      </div>
      <Button
        className="min-h-[44px] w-full bg-green-600 text-white hover:bg-green-700 text-sm font-semibold"
        onClick={onResume}
      >
        <Play className="size-4 fill-current" />
        WZNÓW
      </Button>
    </div>
  );
}
