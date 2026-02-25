import { Info, X } from "lucide-react";
import { type KeyboardEvent, useState } from "react";
import { Badge } from "@/shared/ui/badge";

interface TagInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder?: string;
}

export function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder = "Dodaj artystę...",
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed && !tags.includes(trimmed)) {
        onAdd(trimmed);
        setInputValue("");
      }
    }
    if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      onRemove(tags[tags.length - 1]);
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-transparent px-3 py-1.5 shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] dark:bg-input/30">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="h-6 gap-1 pr-1">
            {tag}
            <button
              type="button"
              onClick={() => onRemove(tag)}
              className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : "Kolejny artysta..."}
          className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <Info className="size-3 shrink-0" />
        Wpisz nazwę i naciśnij{" "}
        <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
          Enter
        </kbd>
        , aby dodać artystę
      </p>
    </div>
  );
}
