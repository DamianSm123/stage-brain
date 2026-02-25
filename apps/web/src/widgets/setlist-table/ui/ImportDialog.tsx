import { Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { EditorSegment } from "@/entities/show";
import { parseDuration } from "@/shared/lib/format-duration";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (segments: EditorSegment[]) => void;
}

let importSegId = 1;

function parseCSV(text: string): EditorSegment[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const segments: EditorSegment[] = [];

  for (const line of lines) {
    const parts = line.split(",").map((p) => p.trim());
    if (parts.length < 1 || !parts[0]) continue;

    const name = parts[0].replace(/^["']|["']$/g, "");
    const durationFull = parts[1] ? parseDuration(parts[1]) : 0;
    const durationShort = parts[2] ? parseDuration(parts[2]) : null;

    segments.push({
      id: `import-${importSegId++}`,
      name,
      durationFull,
      durationShort: durationShort === 0 ? null : durationShort,
      note: "",
    });
  }

  return segments;
}

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
        setError("Obsługiwany format: CSV");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text !== "string") return;

        const segments = parseCSV(text);
        if (segments.length === 0) {
          setError("Nie znaleziono segmentów w pliku");
          return;
        }

        onImport(segments);
        onOpenChange(false);
      };
      reader.readAsText(file);
    },
    [onImport, onOpenChange],
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importuj setlistę</DialogTitle>
          <DialogDescription className="sr-only">Zaimportuj segmenty z pliku CSV</DialogDescription>
        </DialogHeader>

        <button
          type="button"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            isDragOver
              ? "border-primary/50 bg-primary/5"
              : "border-border hover:border-muted-foreground/30"
          }`}
        >
          <Upload className="size-12 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Upuść plik CSV tutaj</p>
            <p className="text-xs text-muted-foreground">lub kliknij, żeby wybrać</p>
          </div>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <p className="text-xs text-muted-foreground">
          Oczekiwany format: nazwa, czas_pełny, czas_krótki
        </p>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
