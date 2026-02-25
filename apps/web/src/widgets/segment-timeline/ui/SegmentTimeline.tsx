import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RotateCcw, X } from "lucide-react";
import { useState } from "react";
import type { Segment, TimelineEntry } from "@/entities/segment";
import { selectCompletedCount, useShowStore } from "@/entities/show";
import { formatDuration } from "@/shared/lib/formatTime";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { SegmentControls } from "./SegmentControls";

interface SegmentRowProps {
  segment: Segment;
  entry: TimelineEntry;
  isExpanded: boolean;
  onToggle: () => void;
  isDraggable: boolean;
}

const VARIANT_LABELS: Record<string, string> = {
  full: "PEŁNY",
  short: "SKRÓT",
  extended: "ROZSZ.",
  acoustic: "AKUST.",
};

function SortableSegmentRow({
  segment,
  entry,
  isExpanded,
  onToggle,
  isDraggable,
}: SegmentRowProps) {
  const setVariant = useShowStore((s) => s.setVariant);
  const replaySegment = useShowStore((s) => s.replaySegment);
  const setSegmentStatus = useShowStore((s) => s.setSegmentStatus);
  const [replayVariant, setReplayVariant] = useState<string>("full");

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
    disabled: !isDraggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const status = entry.status;
  const currentVariant = entry.variant_used ?? "full";
  const currentVariantObj =
    segment.variants.find((v) => v.variant_type === currentVariant) ?? segment.variants[0];
  const canChangeVariant = status === "planned";
  const hasMultipleVariants = segment.variants.length > 1;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("overflow-hidden", isDraggable && "cursor-grab active:cursor-grabbing")}
      {...attributes}
      {...listeners}
    >
      <button
        type="button"
        className={cn(
          "w-full rounded-md px-2 py-2 text-left transition-colors group",
          status === "active" && "bg-blue-500/15 ring-1 ring-blue-500/40",
          status === "skipped" && "opacity-50",
          status !== "active" && "hover:bg-muted/50",
        )}
        onClick={onToggle}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="w-5 shrink-0 text-center text-xs text-muted-foreground">
            {segment.position}
          </span>

          <span
            className={cn(
              "flex-1 truncate text-sm font-medium",
              status === "planned" && "text-gray-400",
              status === "active" && "text-blue-400",
              status === "completed" && "text-muted-foreground",
              status === "skipped" && "text-muted-foreground line-through",
            )}
          >
            {segment.name}
          </span>

          {entry.is_replay && (
            <Badge variant="outline" className="text-[10px] border-purple-500/50 text-purple-400">
              ↻
            </Badge>
          )}

          {status === "completed" && (
            <span className="shrink-0 text-xs text-muted-foreground">✓</span>
          )}

          {currentVariantObj && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatDuration(currentVariantObj.duration_seconds)}
            </span>
          )}
        </div>
      </button>

      {/* Accordion detail panel — shown only when expanded */}
      {isExpanded && (
        <div className="mb-2 mt-1 space-y-2 rounded-md bg-muted/30 p-2 text-xs text-muted-foreground">
          {segment.notes && <div className="italic">{segment.notes}</div>}

          {/* Variant toggle for planned with multiple variants */}
          {canChangeVariant && hasMultipleVariants && (
            <VariantToggle
              segment={segment}
              entry={entry}
              currentVariant={currentVariant}
              onSelect={(variantType) => setVariant(entry.id, variantType)}
            />
          )}

          {/* Planned: show variant info if single variant */}
          {canChangeVariant && !hasMultipleVariants && segment.variants.length === 1 && (
            <div>
              Wariant: {segment.variants[0].variant_type} —{" "}
              {formatDuration(segment.variants[0].duration_seconds)}
            </div>
          )}

          {/* Delete (skip) button for planned segments */}
          {status === "planned" && (
            <Button
              variant="outline"
              className="min-h-[36px] w-full text-xs font-semibold text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
              onClick={(e) => {
                e.stopPropagation();
                setSegmentStatus(entry.id, "skipped");
              }}
            >
              <X className="mr-1.5 size-3.5" />
              USUŃ Z SETLISTY
            </Button>
          )}

          {/* Completed segment info */}
          {status === "completed" && (
            <>
              <div>
                {VARIANT_LABELS[currentVariant] ?? currentVariant} —{" "}
                {currentVariantObj ? formatDuration(currentVariantObj.duration_seconds) : "?"} →
                rzeczyw.{" "}
                {entry.actual_duration_seconds != null
                  ? formatDuration(entry.actual_duration_seconds)
                  : "—"}
                {entry.delta_seconds != null && (
                  <span
                    className={cn(
                      "ml-1 font-medium",
                      entry.delta_seconds > 0 && "text-red-400",
                      entry.delta_seconds < 0 && "text-green-400",
                      entry.delta_seconds === 0 && "text-muted-foreground",
                    )}
                  >
                    ({entry.delta_seconds > 0 ? "+" : ""}
                    {entry.delta_seconds}s)
                  </span>
                )}
              </div>

              {/* Replay variant selector + button */}
              {hasMultipleVariants && (
                <div className="flex overflow-hidden rounded-md border border-purple-500/30">
                  {segment.variants.map((v) => {
                    const isSelected = v.variant_type === replayVariant;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        className={cn(
                          "flex flex-1 flex-col items-center justify-center py-1.5 text-xs transition-colors",
                          isSelected
                            ? "bg-purple-600 text-white font-semibold"
                            : "bg-muted/30 text-muted-foreground hover:bg-muted/60 cursor-pointer",
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          setReplayVariant(v.variant_type);
                        }}
                      >
                        <span className="leading-tight">
                          {VARIANT_LABELS[v.variant_type] ?? v.variant_type}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] leading-tight",
                            isSelected ? "text-purple-200" : "text-muted-foreground/70",
                          )}
                        >
                          {formatDuration(v.duration_seconds)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              <Button
                variant="outline"
                className="min-h-[44px] w-full overflow-hidden text-xs font-semibold text-purple-400 border-purple-500/30 hover:bg-purple-500/10 hover:text-purple-300"
                onClick={(e) => {
                  e.stopPropagation();
                  replaySegment(segment.id, hasMultipleVariants ? replayVariant : undefined);
                }}
              >
                <RotateCcw className="mr-1.5 size-3.5" />
                POWTÓRZ
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** Segmented toggle for variant selection — rendered inline (no accordion needed) */
function VariantToggle({
  segment,
  entry,
  currentVariant,
  onSelect,
}: {
  segment: Segment;
  entry: TimelineEntry;
  currentVariant: string;
  onSelect: (variantType: string) => void;
}) {
  return (
    <div className="mb-1 mx-1">
      <div className="flex overflow-hidden rounded-md border border-border">
        {segment.variants.map((v) => {
          const isSelected = v.variant_type === currentVariant;
          return (
            <button
              key={v.id}
              type="button"
              className={cn(
                "flex flex-1 flex-col items-center justify-center py-1.5 text-xs transition-colors",
                isSelected
                  ? "bg-blue-600 text-white font-semibold"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/60 cursor-pointer",
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (!isSelected) onSelect(v.variant_type);
              }}
            >
              <span className="leading-tight">
                {VARIANT_LABELS[v.variant_type] ?? v.variant_type}
              </span>
              <span
                className={cn(
                  "text-[10px] leading-tight",
                  isSelected ? "text-blue-200" : "text-muted-foreground/70",
                )}
              >
                {formatDuration(v.duration_seconds)}
              </span>
            </button>
          );
        })}
      </div>
      {/* Delta indicator — show when non-default variant is selected */}
      {entry.variant_used && entry.variant_used !== "full" && (
        <DeltaIndicator segment={segment} currentVariant={currentVariant} />
      )}
    </div>
  );
}

/** Shows time delta vs full variant */
function DeltaIndicator({ segment, currentVariant }: { segment: Segment; currentVariant: string }) {
  const fullDuration =
    segment.variants.find((v) => v.variant_type === "full")?.duration_seconds ?? 0;
  const currentDuration =
    segment.variants.find((v) => v.variant_type === currentVariant)?.duration_seconds ?? 0;
  const delta = currentDuration - fullDuration;
  if (delta === 0) return null;

  return (
    <div
      className={cn(
        "mt-0.5 text-right text-[10px] font-medium tabular-nums",
        delta < 0 ? "text-green-400" : "text-red-400",
      )}
    >
      Δ {delta > 0 ? "+" : ""}
      {formatDuration(Math.abs(delta))}
    </div>
  );
}

export function SegmentTimeline() {
  const show = useShowStore((s) => s.show);
  const timeline = useShowStore((s) => s.timeline);
  const reorderSegments = useShowStore((s) => s.reorderSegments);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const segments = show.setlist.segments;
  const completedCount = selectCompletedCount(timeline);
  const totalCount = segments.length;

  // Build entry+segment pairs from timeline order
  const orderedEntries = timeline
    .map((entry) => {
      const segment = segments.find((s) => s.id === entry.segment_id);
      return segment ? { entry, segment } : null;
    })
    .filter((pair): pair is { entry: TimelineEntry; segment: Segment } => pair != null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Block dropping onto non-planned segments (completed/active/skipped stay frozen)
    const overEntry = timeline.find((e) => e.id === over.id);
    if (!overEntry || overEntry.status !== "planned") return;

    reorderSegments(active.id as string, over.id as string);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        SETLISTA {completedCount}/{totalCount}
      </div>

      <ScrollArea className="min-h-0 flex-1 [&>[data-slot=scroll-area-viewport]]:!overflow-x-hidden">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={orderedEntries.map((pair) => pair.entry.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-0.5">
              {orderedEntries.map(({ entry, segment }) => {
                const isDraggable = entry.status === "planned";

                return (
                  <SortableSegmentRow
                    key={entry.id}
                    segment={segment}
                    entry={entry}
                    isExpanded={expandedId === entry.id}
                    onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    isDraggable={isDraggable}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </ScrollArea>

      <SegmentControls />
    </div>
  );
}
