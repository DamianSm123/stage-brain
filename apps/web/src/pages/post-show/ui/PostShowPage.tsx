import { ArrowLeft, Calendar, CheckCircle2, Clock, MapPin, XCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { POSTSHOW_DATA } from "@/shared/lib/mock-postshow-data";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { DecisionsLog } from "@/widgets/decisions-log";
import { EngagementChart } from "@/widgets/post-show-chart";
import { PostShowSummary } from "@/widgets/post-show-summary";
import { SegmentResultsTable } from "@/widgets/segment-results-table";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const months = [
    "sty",
    "lut",
    "mar",
    "kwi",
    "maj",
    "cze",
    "lip",
    "sie",
    "wrz",
    "paź",
    "lis",
    "gru",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export function PostShowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const data = id ? POSTSHOW_DATA[id] : undefined;

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg text-muted-foreground">Nie znaleziono raportu dla tego koncertu.</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 size-4" />
          Wróć do listy koncertów
        </Button>
      </div>
    );
  }

  const { show, timeline, engagement, tags, chartTags } = data;

  const lastCompleted = [...timeline].reverse().find((e) => e.status === "completed");
  const actualEnd = lastCompleted?.ended_at ?? show.scheduled_end ?? show.curfew;

  // Curfew compliance
  const curfewMs = new Date(show.curfew).getTime();
  const endMs = new Date(actualEnd).getTime();
  const curfewDiffSeconds = Math.round((curfewMs - endMs) / 1000);
  const curfewOk = curfewDiffSeconds >= 0;
  const curfewMinutes = Math.floor(Math.abs(curfewDiffSeconds) / 60);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="size-8" onClick={() => navigate("/")}>
              <ArrowLeft className="size-4" />
            </Button>
            <h1 className="text-2xl font-bold">{show.name}</h1>
          </div>
          <div className="ml-11 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {show.venue.name}, {show.venue.city}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              {formatDate(show.scheduled_start)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {formatTime(show.actual_start ?? show.scheduled_start)}→{formatTime(actualEnd)}
            </span>
          </div>
        </div>

        {/* Curfew badge */}
        <Card
          className={cn("shrink-0 py-3", curfewOk ? "border-green-500/30" : "border-red-500/30")}
        >
          <CardContent className="flex items-center gap-2 px-4">
            {curfewOk ? (
              <CheckCircle2 className="size-5 text-green-500" />
            ) : (
              <XCircle className="size-5 text-red-500" />
            )}
            <div>
              <p
                className={cn(
                  "text-sm font-semibold",
                  curfewOk ? "text-green-500" : "text-red-500",
                )}
              >
                {curfewOk
                  ? `${curfewMinutes} min przed curfew`
                  : `Curfew przekroczony o ${curfewMinutes} min`}
              </p>
              <p className="text-xs text-muted-foreground">Curfew: {formatTime(show.curfew)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary cards */}
      <PostShowSummary
        timeline={timeline}
        engagement={engagement}
        actualStart={show.actual_start ?? show.scheduled_start}
        actualEnd={actualEnd}
      />

      {/* Engagement chart */}
      <EngagementChart data={engagement} tags={chartTags} />

      {/* Two-column: decisions log + segment results */}
      <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
        <DecisionsLog timeline={timeline} segments={show.setlist.segments} tags={tags} />
        <SegmentResultsTable
          segments={show.setlist.segments}
          timeline={timeline}
          engagement={engagement}
        />
      </div>
    </div>
  );
}
