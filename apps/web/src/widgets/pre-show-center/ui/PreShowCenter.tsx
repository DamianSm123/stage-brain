import { Play } from "lucide-react";
import { useEffect, useState } from "react";
import { useShowStore } from "@/entities/show";
import {
  type CountdownParts,
  decomposeCountdown,
  formatTime,
  formatTimeFromISO,
} from "@/shared/lib/formatTime";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

function CountdownSegment({
  value,
  label,
  colorClass,
}: {
  value: number;
  label: string;
  colorClass: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "flex h-20 w-20 items-center justify-center rounded-lg border border-border/60 bg-background/60",
          colorClass,
        )}
      >
        <span className="font-mono text-4xl font-bold tabular-nums leading-none">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-1.5 text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}

function CountdownSeparator({ colorClass }: { colorClass: string }) {
  return (
    <span className={cn("mt-1 font-mono text-3xl font-bold leading-[80px]", colorClass)}>:</span>
  );
}

function CountdownDisplay({ parts, colorClass }: { parts: CountdownParts; colorClass: string }) {
  const segments: { value: number; label: string }[] = [];

  if (parts.days > 0) segments.push({ value: parts.days, label: "dni" });
  segments.push({ value: parts.hours, label: "godz" });
  segments.push({ value: parts.minutes, label: "min" });
  segments.push({ value: parts.seconds, label: "sek" });

  return (
    <div className="flex items-start gap-2.5">
      {segments.map((seg, i) => (
        <div key={seg.label} className="flex items-start gap-2.5">
          {i > 0 && <CountdownSeparator colorClass={colorClass} />}
          <CountdownSegment value={seg.value} label={seg.label} colorClass={colorClass} />
        </div>
      ))}
    </div>
  );
}

export function PreShowCenter() {
  const show = useShowStore((s) => s.show);
  const beginPerformance = useShowStore((s) => s.beginPerformance);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const scheduledStartMs = new Date(show.scheduled_start).getTime();
  const diffMs = scheduledStartMs - now;
  const parts = decomposeCountdown(diffMs);

  const isWithin5Min = !parts.isPast && diffMs / 60_000 <= 5;

  const colorClass = parts.isPast
    ? "text-yellow-500"
    : isWithin5Min
      ? "text-green-500 animate-pulse"
      : "text-foreground";

  const label = parts.isPast ? "po planowanym starcie" : "do rozpoczęcia";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8">
      <div className="flex w-full max-w-2xl flex-col items-center gap-5 rounded-xl border border-border bg-card px-10 py-8">
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-col items-center gap-3 flex-1">
            <CountdownDisplay parts={parts} colorClass={colorClass} />
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
          </div>
          <div className="flex flex-col items-end gap-1 pl-6 border-l border-border/40">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Teraz
            </span>
            <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">
              {formatTime(new Date(now))}
            </span>
          </div>
        </div>

        <div className="flex gap-4 text-[13px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500/60" />
            <span>Start {formatTimeFromISO(show.scheduled_start)}</span>
          </div>
          {show.scheduled_end && (
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500/60" />
              <span>Koniec {formatTimeFromISO(show.scheduled_end)}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500/60" />
            <span>Cisza nocna {formatTimeFromISO(show.curfew)}</span>
          </div>
        </div>
      </div>

      <Button
        size="lg"
        className="h-16 w-full max-w-2xl bg-green-600 text-lg font-bold text-white hover:bg-green-700"
        onClick={beginPerformance}
      >
        <Play className="mr-2 size-5" />
        ROZPOCZNIJ KONCERT
      </Button>
    </div>
  );
}
