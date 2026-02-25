import { useState } from "react";
import type { SetlistTemplate } from "@/entities/setlist-template";
import { useTemplatesStore } from "@/entities/setlist-template";
import type { EditorSegment } from "@/entities/show";
import { formatDuration } from "@/shared/lib/format-duration";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

interface LoadTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoad: (segments: EditorSegment[]) => void;
  hasExistingSegments: boolean;
}

let templateSegId = 1000;

function templateToEditorSegments(template: SetlistTemplate): EditorSegment[] {
  return template.segments.map((s) => ({
    id: `tpl-load-${templateSegId++}`,
    name: s.name,
    durationFull: s.durationFull,
    durationShort: s.durationShort,
    note: s.note,
  }));
}

export function LoadTemplateDialog({
  open,
  onOpenChange,
  onLoad,
  hasExistingSegments,
}: LoadTemplateDialogProps) {
  const templates = useTemplatesStore((s) => s.templates);
  const [selected, setSelected] = useState<SetlistTemplate | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleSelect(template: SetlistTemplate) {
    if (hasExistingSegments) {
      setSelected(template);
      setConfirmOpen(true);
    } else {
      onLoad(templateToEditorSegments(template));
      onOpenChange(false);
    }
  }

  function handleConfirm() {
    if (!selected) return;
    onLoad(templateToEditorSegments(selected));
    setConfirmOpen(false);
    setSelected(null);
    onOpenChange(false);
  }

  function handleCancel() {
    setConfirmOpen(false);
    setSelected(null);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Załaduj szablon</DialogTitle>
            <DialogDescription className="sr-only">
              Wybierz szablon setlisty do załadowania
            </DialogDescription>
          </DialogHeader>

          <Command className="border-t">
            <CommandInput placeholder="Szukaj szablonu..." />
            <CommandList className="max-h-[400px]">
              <CommandEmpty>Nie znaleziono szablonów</CommandEmpty>
              <CommandGroup>
                {templates.map((tpl) => (
                  <CommandItem
                    key={tpl.id}
                    onSelect={() => handleSelect(tpl)}
                    className="cursor-pointer"
                  >
                    <div className="flex w-full items-center justify-between gap-4">
                      <span className="truncate font-medium">{tpl.name}</span>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                        {tpl.segments.length} segm. &nbsp;
                        {formatDuration(tpl.totalDurationFull)}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>

          <DialogFooter className="px-6 pb-6">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dodać segmenty?</AlertDialogTitle>
            <AlertDialogDescription>
              Szablon &ldquo;{selected?.name}&rdquo; zawiera {selected?.segments.length} segmenty.
              Zostaną dodane na koniec istniejącej setlisty.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Dodaj</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
