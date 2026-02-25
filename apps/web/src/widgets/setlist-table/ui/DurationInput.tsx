import { useState } from "react";
import { formatDuration, parseDuration } from "@/shared/lib/format-duration";
import { cn } from "@/shared/lib/utils";

interface DurationInputProps {
  value: number | null;
  onChange: (seconds: number | null) => void;
  optional?: boolean;
  className?: string;
}

export function DurationInput({ value, onChange, optional, className }: DurationInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [editValue, setEditValue] = useState("");

  function handleFocus() {
    setIsFocused(true);
    if (value != null && value > 0) {
      setEditValue(formatDuration(value));
    } else {
      setEditValue("");
    }
  }

  function handleBlur() {
    setIsFocused(false);
    const trimmed = editValue.trim();
    if (!trimmed && optional) {
      onChange(null);
      return;
    }
    onChange(parseDuration(trimmed));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  }

  const displayValue =
    value != null && value > 0 ? formatDuration(value) : !optional && value === 0 ? "0:00" : "";

  return (
    <input
      type="text"
      value={isFocused ? editValue : displayValue}
      inputMode="numeric"
      onChange={(e) => {
        const filtered = e.target.value.replace(/[^0-9:]/g, "");
        setEditValue(filtered);
      }}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={isFocused ? "M:SS" : optional ? "—" : "0:00"}
      className={cn(
        "h-8 w-full rounded-md bg-transparent px-2 text-center font-mono text-sm tabular-nums outline-none transition-colors",
        isFocused ? "border border-zinc-700" : "border border-transparent",
        className,
      )}
    />
  );
}
