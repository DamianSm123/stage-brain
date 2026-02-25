import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTemplatesStore } from "@/entities/setlist-template";
import type { EditorSegment, SaveStatus } from "@/entities/show";
import { useAutoSave } from "@/features/auto-save";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { SetlistTable } from "@/widgets/setlist-table";
import { SaveIndicator } from "@/widgets/show-editor-header/ui/SaveIndicator";

let nextSegmentId = 1000;

function generateSegmentId(): string {
  return `tpl-new-${nextSegmentId++}`;
}

export function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { templates, updateTemplate } = useTemplatesStore();

  const template = useMemo(() => templates.find((t) => t.id === id), [templates, id]);

  const [name, setName] = useState("");
  const [segments, setSegments] = useState<EditorSegment[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [isEditingName, setIsEditingName] = useState(false);

  const initializedRef = useRef(false);

  useEffect(() => {
    if (template && !initializedRef.current) {
      initializedRef.current = true;
      setName(template.name);
      setSegments(
        template.segments.map((s) => ({
          id: s.id,
          name: s.name,
          durationFull: s.durationFull,
          durationShort: s.durationShort,
          note: s.note,
        })),
      );
      if (template.name === "Nowy szablon") {
        setIsEditingName(true);
      }
    }
  }, [template]);

  useEffect(() => {
    return () => {
      initializedRef.current = false;
    };
  }, []);

  const markDirty = useCallback(() => {
    setIsDirty(true);
    setSaveStatus("unsaved");
  }, []);

  const save = useCallback(async () => {
    if (!id || !isDirty) return;

    setSaveStatus("saving");
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      updateTemplate(id, {
        name,
        segments: segments.map((s) => ({
          id: s.id,
          name: s.name,
          durationFull: s.durationFull,
          durationShort: s.durationShort,
          note: s.note,
        })),
        updatedAt: new Date().toISOString(),
      });
      setSaveStatus("saved");
      setIsDirty(false);
    } catch {
      setSaveStatus("error");
    }
  }, [id, isDirty, name, segments, updateTemplate]);

  const { triggerSave } = useAutoSave({ isDirty, save });

  const handleNameChange = useCallback(
    (newName: string) => {
      setName(newName);
      markDirty();
    },
    [markDirty],
  );

  const handleAddSegment = useCallback(() => {
    setSegments((prev) => [
      ...prev,
      { id: generateSegmentId(), name: "", durationFull: 0, durationShort: null, note: "" },
    ]);
    markDirty();
  }, [markDirty]);

  const handleRemoveSegment = useCallback(
    (segId: string) => {
      setSegments((prev) => prev.filter((s) => s.id !== segId));
      markDirty();
    },
    [markDirty],
  );

  const handleUpdateSegment = useCallback(
    (segId: string, data: Partial<EditorSegment>) => {
      setSegments((prev) => prev.map((s) => (s.id === segId ? { ...s, ...data } : s)));
      markDirty();
    },
    [markDirty],
  );

  const handleReorderSegments = useCallback(
    (fromIndex: number, toIndex: number) => {
      setSegments((prev) => {
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
      markDirty();
    },
    [markDirty],
  );

  const handleBack = useCallback(async () => {
    await triggerSave();
    navigate("/setlisty");
  }, [triggerSave, navigate]);

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-base text-muted-foreground">Szablon nie został znaleziony.</p>
        <Button variant="outline" onClick={() => navigate("/setlisty")}>
          <ArrowLeft className="size-4" />
          Wróć do szablonów
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <Button variant="ghost" onClick={handleBack} className="shrink-0">
          <ArrowLeft className="size-4" />
          Szablony
        </Button>

        <div className="flex-1 min-w-0">
          {isEditingName ? (
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "Escape") {
                  setIsEditingName(false);
                }
              }}
              onFocus={(e) => e.target.select()}
              className="text-xl xl:text-2xl font-bold h-auto py-1 border-zinc-700"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingName(true)}
              className="text-xl xl:text-2xl font-bold truncate text-left w-full hover:text-muted-foreground transition-colors"
            >
              {name || "Nazwa szablonu..."}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <SaveIndicator status={saveStatus} />
          <Button onClick={() => save()} disabled={!isDirty}>
            Zapisz
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <SetlistTable
          segments={segments}
          onAddSegment={handleAddSegment}
          onRemoveSegment={handleRemoveSegment}
          onUpdateSegment={handleUpdateSegment}
          onReorderSegments={handleReorderSegments}
        />
      </div>
    </div>
  );
}
