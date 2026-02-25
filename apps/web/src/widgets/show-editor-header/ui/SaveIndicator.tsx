import { Check, Loader2, X } from "lucide-react";
import type { SaveStatus } from "@/entities/show";

interface SaveIndicatorProps {
  status: SaveStatus;
}

export function SaveIndicator({ status }: SaveIndicatorProps) {
  return (
    <div className="transition-opacity duration-200">
      {status === "saved" && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Check className="size-3.5" />
          Zapisano
        </span>
      )}
      {status === "saving" && (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Zapisywanie...
        </span>
      )}
      {status === "unsaved" && (
        <span className="flex items-center gap-1.5 text-xs text-yellow-500">
          <span className="size-1.5 rounded-full bg-yellow-500" />
          Niezapisane zmiany
        </span>
      )}
      {status === "error" && (
        <span className="flex items-center gap-1.5 text-xs text-red-500">
          <X className="size-3.5" />
          Błąd zapisu
        </span>
      )}
    </div>
  );
}
