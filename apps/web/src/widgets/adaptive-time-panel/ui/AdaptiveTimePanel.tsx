import { useEffect, useState } from "react";
import {
  selectBufferToCurfew,
  selectProjectedEnd,
  selectShowTimeState,
  selectTotalDelta,
  useShowStore,
} from "@/entities/show";
import {
  type CountdownParts,
  decomposeCountdown,
  formatCountdown,
  formatDelta,
  formatTime,
  formatTimeFromISO,
} from "@/shared/lib/formatTime";
import { cn } from "@/shared/lib/utils";

function getCountdownColorByTimeToEnd(diffMs: number): string {
  const minutes = diffMs / (1000 * 60);
  if (minutes > 30) return "text-green-500";
  if (minutes > 10) return "text-yellow-500";
  return "text-red-500";
}

function getPanelBorderByTimeToEnd(diffMs: number): string {
  const minutes = diffMs / (1000 * 60);
  if (minutes > 30) return "border-border bg-card";
  if (minutes > 10) return "border-yellow-500/40 bg-yellow-500/5";
  return "border-red-500/40 bg-red-500/5";
}

function getBufferColor(bufferSeconds: number): string {
  const minutes = bufferSeconds / 60;
  if (minutes > 15) return "text-yellow-500";
  if (minutes >= 5) return "text-orange-500";
  return "text-red-500";
}

export function AdaptiveTimePanel() {
  const show = useShowStore((s) => s.show);
  const timeline = useShowStore((s) => s.timeline);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeState = selectShowTimeState(show, timeline, now);

  if (timeState === "pre-show") {
    return <PreShowState now={now} />;
  }

  if (timeState === "ended") {
    return <EndedState now={now} />;
  }

  if (timeState === "buffer-eaten") {
    return <BufferEatenState now={now} />;
  }

  if (timeState === "delayed") {
    return <DelayedState now={now} />;
  }

  return <OnTimeState now={now} />;
}

interface StateProps {
  now: number;
}

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
          "flex h-[72px] w-[72px] items-center justify-center rounded-lg border border-border/60 bg-background/60",
          colorClass,
        )}
      >
        <span className="font-mono text-3xl font-bold tabular-nums leading-none">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function CountdownSeparator({ colorClass }: { colorClass: string }) {
  return (
    <span className={cn("mt-1 font-mono text-2xl font-bold leading-[72px]", colorClass)}>:</span>
  );
}

function CountdownDisplay({ parts, colorClass }: { parts: CountdownParts; colorClass: string }) {
  const segments: { value: number; label: string }[] = [];

  if (parts.days > 0) segments.push({ value: parts.days, label: "dni" });
  segments.push({ value: parts.hours, label: "godz" });
  segments.push({ value: parts.minutes, label: "min" });
  segments.push({ value: parts.seconds, label: "sek" });

  return (
    <div className="flex items-start gap-2">
      {segments.map((seg, i) => (
        <div key={seg.label} className="flex items-start gap-2">
          {i > 0 && <CountdownSeparator colorClass={colorClass} />}
          <CountdownSegment value={seg.value} label={seg.label} colorClass={colorClass} />
        </div>
      ))}
    </div>
  );
}

function PreShowState({ now }: StateProps) {
  const show = useShowStore((s) => s.show);
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
    <div className="rounded-xl border border-border bg-card px-8 py-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-center gap-3 flex-1">
          <CountdownDisplay parts={parts} colorClass={colorClass} />
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        <div className="flex flex-col items-end gap-1 pl-6 border-l border-border/40">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Teraz</span>
          <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">
            {formatTime(new Date(now))}
          </span>
        </div>
      </div>

      <div className="mt-5 flex justify-center gap-4 text-[13px] text-muted-foreground">
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
  );
}

function OnTimeState({ now }: StateProps) {
  const show = useShowStore((s) => s.show);
  const timeline = useShowStore((s) => s.timeline);

  const endMs = show.scheduled_end ? new Date(show.scheduled_end).getTime() : 0;
  const diffToEnd = endMs - now;
  const totalDelta = selectTotalDelta(show, timeline, now);

  const countdownColor = getCountdownColorByTimeToEnd(diffToEnd);
  const panelBorder = getPanelBorderByTimeToEnd(diffToEnd);

  return (
    <div className={cn("rounded-lg border p-4 text-center", panelBorder)}>
      <div className="flex items-end justify-between">
        <div className="flex flex-1 flex-col items-center">
          <div className={cn("font-mono text-4xl font-bold tabular-nums", countdownColor)}>
            {formatCountdown(diffToEnd)}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">do zakończenia</div>
        </div>
        <span className="font-mono text-xl text-foreground">{formatTime(new Date(now))}</span>
      </div>

      <div className="mt-2 flex items-center justify-center gap-2 text-sm">
        <span className="text-green-500 font-medium">Δ {formatDelta(totalDelta)} przed planem</span>
        <span className="text-muted-foreground/50">·</span>
        <span className="text-green-500">OK</span>
      </div>
      <div className="mt-1 text-right text-xs text-muted-foreground/50">
        Curfew {formatTimeFromISO(show.curfew)}
      </div>
    </div>
  );
}

function DelayedState({ now }: StateProps) {
  const show = useShowStore((s) => s.show);
  const timeline = useShowStore((s) => s.timeline);

  const endMs = show.scheduled_end ? new Date(show.scheduled_end).getTime() : 0;
  const diffToEnd = endMs - now;
  const totalDelta = selectTotalDelta(show, timeline, now);
  const bufferSeconds = selectBufferToCurfew(show, timeline, now);

  const bufferColor = getBufferColor(bufferSeconds);
  const bufferStr = formatDelta(bufferSeconds);

  return (
    <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/5 p-4 text-center">
      <div className="flex items-end justify-between">
        <div className="flex flex-1 flex-col items-center">
          <div className="font-mono text-4xl font-bold tabular-nums text-yellow-500">
            {formatCountdown(diffToEnd)}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">do zakończenia</div>
        </div>
        <span className="font-mono text-xl text-foreground">{formatTime(new Date(now))}</span>
      </div>

      <div className="mt-2 flex items-center justify-center gap-2 text-sm">
        <span className="text-red-500 font-medium">Δ {formatDelta(totalDelta)} za planem</span>
        <span className="text-muted-foreground/50">·</span>
        <span className={cn("font-medium", bufferColor)}>Bufor {bufferStr}</span>
        <span className="text-muted-foreground/50">·</span>
        <span className="text-yellow-500">⚠</span>
      </div>
      <div className="mt-1 text-right text-[13px] text-muted-foreground">
        Curfew {formatTimeFromISO(show.curfew)}
      </div>
    </div>
  );
}

function BufferEatenState({ now }: StateProps) {
  const show = useShowStore((s) => s.show);
  const timeline = useShowStore((s) => s.timeline);

  const curfewMs = new Date(show.curfew).getTime();
  const diffToCurfew = curfewMs - now;
  const totalDelta = selectTotalDelta(show, timeline, now);
  const projectedEnd = selectProjectedEnd(timeline, now);
  const overBySeconds = Math.floor((projectedEnd.getTime() - curfewMs) / 1000);

  return (
    <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-4 text-center animate-pulse">
      <div className="flex items-end justify-between">
        <div className="flex flex-1 flex-col items-center">
          <div className="font-mono text-[40px] font-bold tabular-nums leading-tight text-red-500 animate-pulse">
            {formatCountdown(diffToCurfew)}
          </div>
          <div className="mt-1 text-base font-bold text-red-500">⚠ DO CURFEW ⚠</div>
        </div>
        <span className="font-mono text-xl text-foreground">{formatTime(new Date(now))}</span>
      </div>

      <div className="mt-2 flex items-center justify-center gap-2 text-sm text-red-500">
        <span className="font-medium">Δ {formatDelta(totalDelta)}</span>
        <span className="text-red-500/50">·</span>
        <span className="font-medium">PRZEKROCZENIE {formatDelta(overBySeconds)}</span>
      </div>
    </div>
  );
}

function EndedState({ now }: StateProps) {
  const show = useShowStore((s) => s.show);
  const timeline = useShowStore((s) => s.timeline);

  const totalDelta = selectTotalDelta(show, timeline, now);
  const bufferToCurfew = selectBufferToCurfew(show, timeline, now);

  const endedColor =
    totalDelta <= 0 ? "text-green-500" : bufferToCurfew >= 0 ? "text-yellow-500" : "text-red-500";

  return (
    <div className="rounded-lg border border-border bg-card p-4 text-center">
      <div className="flex items-end justify-between">
        <div className="flex flex-1 flex-col items-center">
          <div className={cn("text-2xl font-bold", endedColor)}>KONCERT ZAKOŃCZONY</div>
          <div className="mt-1 text-base text-muted-foreground">
            {formatTime(new Date(now))} · Δ {formatDelta(totalDelta)}
          </div>
        </div>
        <span className="font-mono text-xl text-foreground">{formatTime(new Date(now))}</span>
      </div>
    </div>
  );
}
