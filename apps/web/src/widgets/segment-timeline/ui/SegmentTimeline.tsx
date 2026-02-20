import { useState } from "react";
import type { Segment, SegmentStatus, SegmentType } from "@/entities/segment";
import { useShowStore } from "@/entities/show/model/showStore";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";

const TYPE_ICONS: Record<SegmentType, string> = {
  song: "♪",
  intro: "→",
  outro: "■",
  interlude: "⏸",
};

function formatDuration(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

interface SegmentRowProps {
  segment: Segment;
  status: SegmentStatus;
  isExpanded: boolean;
  onToggle: () => void;
}

function SegmentRow({ segment, status, isExpanded, onToggle }: SegmentRowProps) {
  const fullVariant = segment.variants.find((v) => v.variant_type === "full");

  return (
    <div>
      <button
        type="button"
        className={cn(
          "w-full rounded-md px-2 py-2 text-left transition-colors",
          status === "active" && "bg-blue-500/15 ring-1 ring-blue-500/40",
          status === "skipped" && "opacity-50",
          status !== "active" && "hover:bg-muted/50",
        )}
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">
            {segment.position}
          </span>
          <span className="shrink-0 text-sm" title={segment.type}>
            {TYPE_ICONS[segment.type]}
          </span>

          <span
            className={cn(
              "flex-1 truncate text-sm font-medium",
              status === "planned" && "text-gray-400",
              status === "active" && "text-blue-400",
              status === "completed" && "text-green-400",
              status === "skipped" && "text-muted-foreground line-through",
            )}
          >
            {segment.name}
          </span>

          {segment.is_locked && (
            <span className="shrink-0 text-xs" title="Locked">
              🔒
            </span>
          )}

          {status === "completed" && <span className="shrink-0 text-xs text-green-500">✓</span>}

          {fullVariant && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatDuration(fullVariant.duration_seconds)}
            </span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="mb-2 ml-7 mt-1 space-y-1 rounded-md bg-muted/30 p-2 text-xs text-muted-foreground">
          {segment.variants.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="font-medium">Warianty:</span>
              {segment.variants.map((v) => (
                <Badge key={v.id} variant="outline" className="text-[10px]">
                  {v.variant_type} — {formatDuration(v.duration_seconds)}
                </Badge>
              ))}
            </div>
          )}
          {segment.bpm != null && <div>BPM: {segment.bpm}</div>}
          {segment.genre && <div>Gatunek: {segment.genre}</div>}
          <div className="flex flex-wrap gap-1">
            {segment.is_locked && (
              <Badge variant="outline" className="text-[10px]">
                🔒 Locked
              </Badge>
            )}
            {segment.has_pyro && (
              <Badge variant="outline" className="text-[10px]">
                🔥 Pyro
              </Badge>
            )}
            {segment.is_skippable && (
              <Badge variant="outline" className="text-[10px]">
                ↷ Skippable
              </Badge>
            )}
          </div>
          {segment.notes && <div className="italic">{segment.notes}</div>}
        </div>
      )}
    </div>
  );
}

export function SegmentTimeline() {
  const show = useShowStore((s) => s.show);
  const timeline = useShowStore((s) => s.timeline);
  const setSegmentStatus = useShowStore((s) => s.setSegmentStatus);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const segments = show.setlist.segments;

  const getStatus = (segmentId: string): SegmentStatus => {
    const entry = timeline.find((t) => t.segment_id === segmentId);
    return entry?.status ?? "planned";
  };

  const activeEntry = timeline.find((t) => t.status === "active");
  const nextPlanned = timeline.find((t) => t.status === "planned");

  const handleStart = () => {
    if (activeEntry) {
      setSegmentStatus(activeEntry.segment_id, "completed");
    }
    if (nextPlanned) {
      setSegmentStatus(nextPlanned.segment_id, "active");
    }
  };

  const handleEnd = () => {
    if (activeEntry) {
      setSegmentStatus(activeEntry.segment_id, "completed");
    }
  };

  const handleSkip = () => {
    if (nextPlanned) {
      setSegmentStatus(nextPlanned.segment_id, "skipped");
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1">
          {segments.map((segment) => {
            const status = getStatus(segment.id);

            return (
              <SegmentRow
                key={segment.id}
                segment={segment}
                status={status}
                isExpanded={expandedId === segment.id}
                onToggle={() => setExpandedId(expandedId === segment.id ? null : segment.id)}
              />
            );
          })}
        </div>
      </ScrollArea>

      <div className="shrink-0 mt-2 flex gap-1.5 border-t border-border pt-2">
        <Button
          className="min-h-[44px] flex-1 bg-green-600 text-white hover:bg-green-700"
          disabled={!nextPlanned}
          onClick={handleStart}
        >
          START
        </Button>
        <Button
          className="min-h-[44px] flex-1 bg-blue-600 text-white hover:bg-blue-700"
          disabled={!activeEntry}
          onClick={handleEnd}
        >
          END
        </Button>
        <Button
          className="min-h-[44px] flex-1 bg-gray-600 text-white hover:bg-gray-700"
          disabled={!nextPlanned}
          onClick={handleSkip}
        >
          SKIP
        </Button>
      </div>
    </div>
  );
}
