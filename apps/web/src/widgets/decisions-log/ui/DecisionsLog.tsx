import type { OperatorTag } from "@/entities/operator-tag";
import type { Segment, TimelineEntry } from "@/entities/segment";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

interface DecisionsLogProps {
  timeline: TimelineEntry[];
  segments: Segment[];
  tags: OperatorTag[];
}

interface DecisionEntry {
  timestamp: string;
  type: "skip" | "variant_change" | "tag";
  label: string;
  detail?: string;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
}

function getBadgeClass(type: DecisionEntry["type"]): string {
  switch (type) {
    case "skip":
      return "bg-red-500/15 text-red-500 border-red-500/30";
    case "variant_change":
      return "bg-yellow-500/15 text-yellow-500 border-yellow-500/30";
    case "tag":
      return "bg-blue-500/15 text-blue-500 border-blue-500/30";
  }
}

function getBadgeLabel(type: DecisionEntry["type"]): string {
  switch (type) {
    case "skip":
      return "Skip";
    case "variant_change":
      return "Wariant";
    case "tag":
      return "Tag";
  }
}

export function DecisionsLog({ timeline, segments, tags }: DecisionsLogProps) {
  const segmentMap = new Map(segments.map((s) => [s.id, s]));

  const entries: DecisionEntry[] = [];

  // Collect timeline decisions (skips, variant changes)
  for (const entry of timeline) {
    const segment = segmentMap.get(entry.segment_id);
    const name = segment?.name ?? entry.segment_id;

    if (entry.status === "skipped") {
      entries.push({
        timestamp: entry.started_at ?? entry.ended_at ?? "",
        type: "skip",
        label: `Skip: ${name}`,
        detail: `Zaoszczędzono ${Math.floor(entry.planned_duration_seconds / 60)}:${(entry.planned_duration_seconds % 60).toString().padStart(2, "0")}`,
      });
    }

    if (entry.variant_used && entry.variant_used !== "full" && entry.status === "completed") {
      entries.push({
        timestamp: entry.started_at ?? "",
        type: "variant_change",
        label: `Zmiana wariantu: ${name}`,
        detail: `Wariant: ${entry.variant_used}`,
      });
    }
  }

  // Collect operator tags
  for (const tag of tags) {
    entries.push({
      timestamp: tag.timestamp,
      type: "tag",
      label: `Tag: ${tag.tag}`,
      detail: tag.custom_text,
    });
  }

  // Sort by timestamp ascending
  entries.sort((a, b) => {
    if (!a.timestamp) return 1;
    if (!b.timestamp) return -1;
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Decyzje operatora</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Brak decyzji podczas koncertu.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={`${entry.type}-${entry.timestamp}-${entry.label}`}
                className="flex items-start gap-3"
              >
                <span className="mt-0.5 min-w-[48px] font-mono text-sm tabular-nums text-muted-foreground">
                  {entry.timestamp ? formatTimestamp(entry.timestamp) : "—"}
                </span>
                <Badge variant="outline" className={cn("shrink-0", getBadgeClass(entry.type))}>
                  {getBadgeLabel(entry.type)}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{entry.label}</p>
                  {entry.detail && <p className="text-xs text-muted-foreground">{entry.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
