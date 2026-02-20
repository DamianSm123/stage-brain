import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, Upload } from "lucide-react";
import { useState } from "react";

import type { Segment, SegmentType, SegmentVariant } from "@/entities/segment";
import { useSetupStore } from "@/entities/show";
import { formatDuration, parseDuration } from "@/shared/lib/format-duration";
import { MOCK_SETLISTS } from "@/shared/lib/mock-setup-data";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Separator } from "@/shared/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

// --- Sub-components ---

interface DurationInputProps {
  value: number;
  onCommit: (seconds: number) => void;
  placeholder?: string;
}

function DurationInput({ value, onCommit, placeholder = "0:00" }: DurationInputProps) {
  const [localText, setLocalText] = useState<string | null>(null);

  const displayValue = localText !== null ? localText : value > 0 ? formatDuration(value) : "";

  return (
    <Input
      value={displayValue}
      onChange={(e) => setLocalText(e.target.value)}
      onFocus={() => setLocalText(value > 0 ? formatDuration(value) : "")}
      onBlur={() => {
        onCommit(parseDuration(localText ?? ""));
        setLocalText(null);
      }}
      placeholder={placeholder}
      className="min-h-[44px] w-20"
    />
  );
}

interface FlagBadgeProps {
  active: boolean;
  label: string;
  title: string;
  onClick: () => void;
}

function FlagBadge({ active, label, title, onClick }: FlagBadgeProps) {
  return (
    <button type="button" title={title} onClick={onClick} className="inline-flex">
      <Badge
        variant={active ? "default" : "outline"}
        className="min-h-[32px] min-w-[32px] cursor-pointer select-none"
      >
        {label}
      </Badge>
    </button>
  );
}

function updateVariantDuration(
  variants: SegmentVariant[],
  type: "full" | "short",
  seconds: number,
): SegmentVariant[] {
  const existing = variants.find((v) => v.variant_type === type);
  if (existing) {
    return variants.map((v) => (v.variant_type === type ? { ...v, duration_seconds: seconds } : v));
  }
  if (seconds > 0) {
    return [
      ...variants,
      {
        id: crypto.randomUUID(),
        variant_type: type,
        duration_seconds: seconds,
      },
    ];
  }
  return variants;
}

// --- Sortable Row ---

interface SortableSegmentRowProps {
  segment: Segment;
  index: number;
  onUpdate: (id: string, updates: Partial<Segment>) => void;
  onDelete: (id: string) => void;
}

function SortableSegmentRow({ segment, index, onUpdate, onDelete }: SortableSegmentRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: segment.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const fullVariant = segment.variants.find((v) => v.variant_type === "full");
  const shortVariant = segment.variants.find((v) => v.variant_type === "short");

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-12">
        <button
          type="button"
          className="flex h-11 w-11 cursor-grab items-center justify-center touch-none"
          aria-label="Przeciągnij aby zmienić kolejność"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-5 text-muted-foreground" />
        </button>
      </TableCell>

      <TableCell className="w-12 text-center text-muted-foreground">{index + 1}</TableCell>

      <TableCell>
        <Input
          value={segment.name}
          onChange={(e) => onUpdate(segment.id, { name: e.target.value })}
          placeholder="Nazwa segmentu"
          className="min-h-[44px] min-w-[140px]"
        />
      </TableCell>

      <TableCell>
        <Select
          value={segment.type}
          onValueChange={(val) => onUpdate(segment.id, { type: val as SegmentType })}
        >
          <SelectTrigger className="min-h-[44px] w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="song">song</SelectItem>
            <SelectItem value="intro">intro</SelectItem>
            <SelectItem value="outro">outro</SelectItem>
            <SelectItem value="interlude">interlude</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell>
        <DurationInput
          value={fullVariant?.duration_seconds ?? 0}
          onCommit={(seconds) =>
            onUpdate(segment.id, {
              variants: updateVariantDuration(segment.variants, "full", seconds),
            })
          }
        />
      </TableCell>

      <TableCell>
        <DurationInput
          value={shortVariant?.duration_seconds ?? 0}
          onCommit={(seconds) => {
            if (seconds === 0) {
              onUpdate(segment.id, {
                variants: segment.variants.filter((v) => v.variant_type !== "short"),
              });
            } else {
              onUpdate(segment.id, {
                variants: updateVariantDuration(segment.variants, "short", seconds),
              });
            }
          }}
          placeholder="—"
        />
      </TableCell>

      <TableCell>
        <Input
          type="number"
          value={segment.bpm ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            onUpdate(segment.id, {
              bpm: val === "" ? undefined : Number(val),
            });
          }}
          className="min-h-[44px] w-20"
          min={0}
          max={300}
        />
      </TableCell>

      <TableCell>
        <div className="flex gap-1">
          <FlagBadge
            active={segment.is_locked}
            label="🔒"
            title="Locked"
            onClick={() =>
              onUpdate(segment.id, {
                is_locked: !segment.is_locked,
              })
            }
          />
          <FlagBadge
            active={segment.is_skippable}
            label="↷"
            title="Skippable"
            onClick={() =>
              onUpdate(segment.id, {
                is_skippable: !segment.is_skippable,
              })
            }
          />
          <FlagBadge
            active={segment.has_pyro}
            label="🔥"
            title="Pyro"
            onClick={() =>
              onUpdate(segment.id, {
                has_pyro: !segment.has_pyro,
              })
            }
          />
        </div>
      </TableCell>

      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          className="min-h-[44px] min-w-[44px] text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(segment.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

// --- Main Component ---

export function SetlistStep() {
  const { selectedSetlistId, editableSegments, selectSetlist, setEditableSegments } =
    useSetupStore();

  const [csvDialogOpen, setCsvDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  // --- Stats ---
  const totalSeconds = editableSegments.reduce((sum, seg) => {
    const full = seg.variants.find((v) => v.variant_type === "full");
    return sum + (full?.duration_seconds ?? 0);
  }, 0);

  const withVariantsCount = editableSegments.filter((seg) => seg.variants.length > 1).length;

  // --- Handlers ---
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = editableSegments.findIndex((s) => s.id === active.id);
    const newIndex = editableSegments.findIndex((s) => s.id === over.id);

    const reordered = arrayMove(editableSegments, oldIndex, newIndex).map((seg, i) => ({
      ...seg,
      position: i + 1,
    }));

    setEditableSegments(reordered);
  }

  function handleUpdateSegment(segmentId: string, updates: Partial<Segment>) {
    const updated = editableSegments.map((seg) =>
      seg.id === segmentId ? { ...seg, ...updates } : seg,
    );
    setEditableSegments(updated);
  }

  function handleDeleteSegment(segmentId: string) {
    const filtered = editableSegments
      .filter((seg) => seg.id !== segmentId)
      .map((seg, i) => ({ ...seg, position: i + 1 }));
    setEditableSegments(filtered);
  }

  function handleAddSegment() {
    const newSegment: Segment = {
      id: crypto.randomUUID(),
      name: "",
      position: editableSegments.length + 1,
      type: "song",
      expected_energy: 0.5,
      is_locked: false,
      is_skippable: false,
      has_pyro: false,
      variants: [
        {
          id: crypto.randomUUID(),
          variant_type: "full",
          duration_seconds: 0,
        },
      ],
    };
    setEditableSegments([...editableSegments, newSegment]);
  }

  function handleNewSetlist() {
    useSetupStore.setState({
      selectedSetlistId: null,
      editableSegments: [],
    });
  }

  return (
    <div className="space-y-4">
      {/* Header: setlist select + action buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          key={selectedSetlistId ?? "empty"}
          value={selectedSetlistId ?? undefined}
          onValueChange={selectSetlist}
        >
          <SelectTrigger className="min-h-[44px] w-72">
            <SelectValue placeholder="Wybierz setlistę..." />
          </SelectTrigger>
          <SelectContent>
            {MOCK_SETLISTS.map((sl) => (
              <SelectItem key={sl.id} value={sl.id}>
                {sl.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" className="min-h-[44px]" onClick={() => setCsvDialogOpen(true)}>
          <Upload className="size-4" />
          IMPORT CSV
        </Button>

        <Button variant="outline" className="min-h-[44px]" onClick={handleNewSetlist}>
          <Plus className="size-4" />
          Nowa
        </Button>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-4 py-2 text-sm">
        <span className="text-muted-foreground">
          Łączny czas:{" "}
          <span className="font-medium text-foreground">{formatDuration(totalSeconds)}</span>
        </span>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-muted-foreground">
          Segmentów: <span className="font-medium text-foreground">{editableSegments.length}</span>
        </span>
        <Separator orientation="vertical" className="h-4" />
        <span className="text-muted-foreground">
          Z wariantami: <span className="font-medium text-foreground">{withVariantsCount}</span>
        </span>
      </div>

      {/* Segment table */}
      {editableSegments.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={editableSegments.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="min-w-[160px]">Nazwa</TableHead>
                  <TableHead className="w-28">Typ</TableHead>
                  <TableHead className="w-20">Full</TableHead>
                  <TableHead className="w-20">Short</TableHead>
                  <TableHead className="w-20">BPM</TableHead>
                  <TableHead className="min-w-[130px]">Flagi</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {editableSegments.map((segment, index) => (
                  <SortableSegmentRow
                    key={segment.id}
                    segment={segment}
                    index={index}
                    onUpdate={handleUpdateSegment}
                    onDelete={handleDeleteSegment}
                  />
                ))}
              </TableBody>
            </Table>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
          Wybierz setlistę lub dodaj segmenty ręcznie
        </div>
      )}

      {/* Add segment */}
      <Button variant="outline" className="min-h-[44px] w-full" onClick={handleAddSegment}>
        <Plus className="size-4" />
        Dodaj segment
      </Button>

      {/* CSV Import Dialog (placeholder) */}
      <Dialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import CSV</DialogTitle>
            <DialogDescription>Import setlisty z pliku CSV — coming soon.</DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </div>
  );
}
