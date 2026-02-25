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
import { FileDown, GripVertical, ListMusic, Plus, Upload, X } from "lucide-react";
import { useState } from "react";
import type { EditorSegment } from "@/entities/show";
import { Button } from "@/shared/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";
import { DurationInput } from "./DurationInput";
import { ImportDialog } from "./ImportDialog";
import { InlineTextInput } from "./InlineTextInput";
import { LoadTemplateDialog } from "./LoadTemplateDialog";
import { SetlistSummaryBar } from "./SetlistSummaryBar";
import { SetlistTimeBar } from "./SetlistTimeBar";

interface SetlistTableProps {
  segments: EditorSegment[];
  onAddSegment: () => void;
  onRemoveSegment: (id: string) => void;
  onUpdateSegment: (id: string, data: Partial<EditorSegment>) => void;
  onReorderSegments: (fromIndex: number, toIndex: number) => void;
  onLoadTemplate?: (segments: EditorSegment[]) => void;
  onImportCSV?: (segments: EditorSegment[]) => void;
  showTimeBar?: boolean;
  showToolbar?: boolean;
  hideSummary?: boolean;
  startTime?: string;
  endTime?: string;
}

export function SetlistTable({
  segments,
  onAddSegment,
  onRemoveSegment,
  onUpdateSegment,
  onReorderSegments,
  onLoadTemplate,
  onImportCSV,
  showTimeBar = false,
  showToolbar = false,
  hideSummary = false,
  startTime = "",
  endTime = "",
}: SetlistTableProps) {
  const [importOpen, setImportOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const totalDurationFull = segments.reduce((sum, s) => sum + s.durationFull, 0);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = segments.findIndex((s) => s.id === active.id);
    const newIndex = segments.findIndex((s) => s.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorderSegments(oldIndex, newIndex);
    }
  }

  return (
    <div className="space-y-4">
      {showTimeBar && startTime && endTime && (
        <SetlistTimeBar
          totalDurationFull={totalDurationFull}
          startTime={startTime}
          endTime={endTime}
        />
      )}

      {showToolbar && (
        <div className="flex flex-wrap items-center gap-2">
          {onLoadTemplate && (
            <Button variant="outline" size="sm" onClick={() => setTemplateOpen(true)}>
              <FileDown className="size-4" />
              Załaduj szablon
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onAddSegment}>
            <Plus className="size-4" />
            Dodaj segment
          </Button>
          {onImportCSV && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-not-allowed">
                    <Button variant="outline" size="sm" disabled>
                      <Upload className="size-4" />
                      Importuj
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={4}>
                  Niedostępne w prototypie
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}

      {segments.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-12 text-center">
          <ListMusic className="size-8 text-muted-foreground/50" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Brak segmentów</p>
            <p className="text-xs text-muted-foreground/70">
              Dodaj co najmniej jeden utwór, aby kontynuować
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={onAddSegment}>
            <Plus className="size-4" />
            Dodaj pierwszy segment
          </Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={segments.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {/* Header */}
            <div className="flex items-center border-b border-border px-1 py-2 text-sm font-medium text-foreground">
              <div className="w-10 shrink-0" />
              <div className="w-10 shrink-0 text-center">#</div>
              <div className="min-w-0 flex-[3]">Nazwa</div>
              <div className="w-24 shrink-0 text-center">Pełna</div>
              <div className="w-24 shrink-0 text-center">Krótka</div>
              <div className="hidden min-w-0 flex-[2] xl:block">Notatka</div>
              <div className="w-10 shrink-0" />
            </div>

            {/* Rows */}
            {segments.map((segment, index) => (
              <SortableSegmentRow
                key={segment.id}
                segment={segment}
                index={index}
                onUpdate={onUpdateSegment}
                onRemove={onRemoveSegment}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {segments.length > 0 && !hideSummary && (
        <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-border bg-background py-3">
          <SetlistSummaryBar segments={segments} startTime={startTime || undefined} />
          {!showToolbar && (
            <Button variant="outline" size="sm" onClick={onAddSegment} className="shrink-0">
              <Plus className="size-4" />
              Dodaj segment
            </Button>
          )}
        </div>
      )}

      {onImportCSV && (
        <ImportDialog open={importOpen} onOpenChange={setImportOpen} onImport={onImportCSV} />
      )}

      {onLoadTemplate && (
        <LoadTemplateDialog
          open={templateOpen}
          onOpenChange={setTemplateOpen}
          onLoad={onLoadTemplate}
          hasExistingSegments={segments.length > 0}
        />
      )}
    </div>
  );
}

interface SortableSegmentRowProps {
  segment: EditorSegment;
  index: number;
  onUpdate: (id: string, data: Partial<EditorSegment>) => void;
  onRemove: (id: string) => void;
}

function SortableSegmentRow({ segment, index, onUpdate, onRemove }: SortableSegmentRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: segment.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center border-b border-border px-1 py-1 transition-colors hover:bg-muted/50"
    >
      <div className="w-10 shrink-0 px-1">
        <button
          type="button"
          className="flex cursor-grab items-center justify-center rounded p-1 text-muted-foreground transition-colors hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </div>

      <div className="w-10 shrink-0 text-center font-mono text-sm tabular-nums text-muted-foreground">
        {index + 1}
      </div>

      <div className="min-w-0 flex-[3] px-1">
        <InlineTextInput
          value={segment.name}
          onChange={(name) => onUpdate(segment.id, { name })}
          placeholder="Nazwa segmentu"
        />
      </div>

      <div className="w-24 shrink-0 px-1">
        <DurationInput
          value={segment.durationFull}
          onChange={(seconds) => onUpdate(segment.id, { durationFull: seconds ?? 0 })}
        />
      </div>

      <div className="w-24 shrink-0 px-1">
        <DurationInput
          value={segment.durationShort}
          onChange={(seconds) => onUpdate(segment.id, { durationShort: seconds })}
          optional
        />
      </div>

      <div className="hidden min-w-0 flex-[2] px-1 xl:block">
        <InlineTextInput
          value={segment.note}
          onChange={(note) => onUpdate(segment.id, { note })}
          placeholder="Notatka..."
          textClassName="text-[13px] text-muted-foreground"
        />
      </div>

      <div className="w-10 shrink-0 px-1">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onRemove(segment.id)}
          className="text-muted-foreground opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
