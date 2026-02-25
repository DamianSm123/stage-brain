import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { ScrollArea } from "@/shared/ui/scroll-area";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  onBlur?: () => void;
  icon?: React.ReactNode;
  placeholder?: string;
  error?: boolean;
  className?: string;
}

export function TimePicker({
  value,
  onChange,
  onBlur,
  icon,
  placeholder = "Wybierz godzinę",
  error,
  className,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const hourRef = useRef<HTMLButtonElement | null>(null);
  const minuteRef = useRef<HTMLButtonElement | null>(null);

  const [selectedHour, selectedMinute] = value
    ? value.split(":").map(Number)
    : [-1, -1];

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        hourRef.current?.scrollIntoView({ block: "center" });
        minuteRef.current?.scrollIntoView({ block: "center" });
      });
    }
  }, [open]);

  function handleHour(h: number) {
    const m = selectedMinute >= 0 ? selectedMinute : 0;
    onChange(`${pad(h)}:${pad(m)}`);
  }

  function handleMinute(m: number) {
    const h = selectedHour >= 0 ? selectedHour : 0;
    onChange(`${pad(h)}:${pad(m)}`);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 w-full justify-start font-mono tabular-nums font-normal sm:w-64",
            !value && "text-muted-foreground",
            error && "border-red-500",
            className,
          )}
          onBlur={onBlur}
        >
          <span className="mr-2 flex size-4 shrink-0 items-center justify-center text-muted-foreground">
            {icon ?? <Clock className="size-4" />}
          </span>
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex gap-1">
          {/* Hours column */}
          <ScrollArea className="h-56 w-14">
            <div className="flex flex-col items-center gap-0.5 p-1">
              {HOURS.map((h) => (
                <Button
                  key={h}
                  ref={h === selectedHour ? hourRef : undefined}
                  size="icon"
                  variant={h === selectedHour ? "default" : "ghost"}
                  className="h-8 w-10 shrink-0 text-xs"
                  onClick={() => handleHour(h)}
                >
                  {pad(h)}
                </Button>
              ))}
            </div>
          </ScrollArea>

          <div className="w-px self-stretch bg-border" />

          {/* Minutes column */}
          <ScrollArea className="h-56 w-14">
            <div className="flex flex-col items-center gap-0.5 p-1">
              {MINUTES.map((m) => (
                <Button
                  key={m}
                  ref={m === selectedMinute ? minuteRef : undefined}
                  size="icon"
                  variant={m === selectedMinute ? "default" : "ghost"}
                  className="h-8 w-10 shrink-0 text-xs"
                  onClick={() => handleMinute(m)}
                >
                  {pad(m)}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
