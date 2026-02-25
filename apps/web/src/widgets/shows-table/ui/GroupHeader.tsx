import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface GroupHeaderProps {
  label: string;
  count: number;
  isCollapsed: boolean;
  onToggle: () => void;
  colSpan: number;
}

export function GroupHeader({ label, count, isCollapsed, onToggle, colSpan }: GroupHeaderProps) {
  return (
    <tr
      className="cursor-pointer select-none bg-zinc-900/50 hover:bg-zinc-900/70 transition-colors border-b"
      onClick={onToggle}
    >
      <td colSpan={colSpan} className="px-2 py-2">
        <div className="flex items-center gap-2">
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200",
              isCollapsed && "-rotate-90",
            )}
          />
          <span className="text-[13px] font-semibold text-foreground">
            {label} ({count})
          </span>
        </div>
      </td>
    </tr>
  );
}
