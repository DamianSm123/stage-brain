import { useState } from "react";
import { cn } from "@/shared/lib/utils";

interface InlineTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  textClassName?: string;
}

export function InlineTextInput({
  value,
  onChange,
  placeholder,
  className,
  textClassName,
}: InlineTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      placeholder={placeholder}
      className={cn(
        "h-8 w-full rounded-md bg-transparent px-2 text-sm outline-none transition-colors",
        isFocused ? "border border-zinc-700" : "border border-transparent",
        textClassName,
        className,
      )}
    />
  );
}
