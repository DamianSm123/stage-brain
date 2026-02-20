import { useShowStore } from "@/entities/show";

interface CurfewCountdownProps {
  now: Date;
}

function formatCountdown(diffMs: number): string {
  const abs = Math.abs(diffMs);
  const hours = Math.floor(abs / (1000 * 60 * 60));
  const minutes = Math.floor((abs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((abs % (1000 * 60)) / 1000);

  const prefix = diffMs >= 0 ? "-" : "+";
  const hStr = hours.toString().padStart(2, "0");
  const mStr = minutes.toString().padStart(2, "0");
  const sStr = seconds.toString().padStart(2, "0");

  return `${prefix}${hStr}:${mStr}:${sStr}`;
}

function getCountdownColor(diffMs: number): string {
  if (diffMs <= 0) return "text-red-500 animate-pulse";
  const minutes = diffMs / (1000 * 60);
  if (minutes <= 10) return "text-red-500 animate-pulse";
  if (minutes <= 30) return "text-yellow-500";
  return "text-foreground";
}

export function CurfewCountdown({ now }: CurfewCountdownProps) {
  const curfew = useShowStore((s) => s.show.curfew);
  const curfewDate = new Date(curfew);
  const diffMs = curfewDate.getTime() - now.getTime();

  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">Curfew</span>
      <span className={`font-mono text-4xl font-bold tabular-nums ${getCountdownColor(diffMs)}`}>
        {formatCountdown(diffMs)}
      </span>
    </div>
  );
}
