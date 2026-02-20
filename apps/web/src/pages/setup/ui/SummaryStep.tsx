import { useNavigate } from "react-router";
import type { Setlist, TimelineEntry } from "@/entities/segment";
import type { Show } from "@/entities/show";
import { useSetupStore, useShowStore } from "@/entities/show";
import type { Venue } from "@/entities/venue";
import { ROUTES } from "@/shared/config/navigation";
import { MOCK_CALIBRATION_PRESETS, MOCK_SETLISTS, MOCK_VENUES } from "@/shared/lib/mock-setup-data";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";

const VENUE_TYPE_LABELS: Record<string, string> = {
  hall: "hala",
  stadium: "stadion",
  club: "klub",
  open_air: "open air",
};

function formatDuration(totalSeconds: number): string {
  const abs = Math.abs(totalSeconds);
  const hours = Math.floor(abs / 3600);
  const minutes = Math.floor((abs % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}min`;
  }
  return `${minutes}min`;
}

function formatDurationMmSs(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

interface SummaryRowProps {
  label: string;
  children: React.ReactNode;
}

function SummaryRow({ label, children }: SummaryRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{children}</span>
    </div>
  );
}

export function SummaryStep() {
  const navigate = useNavigate();

  const showName = useSetupStore((s) => s.showName);
  const scheduledStart = useSetupStore((s) => s.scheduledStart);
  const curfew = useSetupStore((s) => s.curfew);
  const selectedVenueId = useSetupStore((s) => s.selectedVenueId);
  const newVenue = useSetupStore((s) => s.newVenue);
  const calibrationPresetId = useSetupStore((s) => s.calibrationPresetId);
  const selectedSetlistId = useSetupStore((s) => s.selectedSetlistId);
  const editableSegments = useSetupStore((s) => s.editableSegments);

  const venue = selectedVenueId
    ? MOCK_VENUES.find((v) => v.id === selectedVenueId)
    : newVenue
      ? { ...newVenue, id: "" }
      : null;

  const setlistMock = selectedSetlistId
    ? MOCK_SETLISTS.find((s) => s.id === selectedSetlistId)
    : null;
  const setlistName = setlistMock?.name ?? "Setlista";

  const totalPlannedSeconds = editableSegments.reduce(
    (sum, seg) =>
      sum + (seg.variants.find((v) => v.variant_type === "full")?.duration_seconds ?? 0),
    0,
  );

  const showWindowSeconds = (() => {
    if (!scheduledStart || !curfew) return 0;
    const [startH, startM] = scheduledStart.split(":").map(Number);
    const [curfewH, curfewM] = curfew.split(":").map(Number);
    return (curfewH * 60 + curfewM - (startH * 60 + startM)) * 60;
  })();

  const bufferSeconds = showWindowSeconds - totalPlannedSeconds;

  const calibrationPresetName =
    MOCK_CALIBRATION_PRESETS.find((p) => p.id === calibrationPresetId)?.name ?? "Domyślna";

  function handleStartShow() {
    const setup = useSetupStore.getState();

    const resolvedVenue: Venue = setup.selectedVenueId
      ? (MOCK_VENUES.find((v) => v.id === setup.selectedVenueId) ?? {
          id: crypto.randomUUID(),
          name: "Nieznane",
          type: "hall" as const,
          capacity: 0,
          city: "",
        })
      : {
          id: crypto.randomUUID(),
          ...(setup.newVenue ?? {
            name: "Nieznane",
            type: "hall" as const,
            capacity: 0,
            city: "",
          }),
        };

    const setlist: Setlist = {
      id: setup.selectedSetlistId ?? crypto.randomUUID(),
      name: setup.selectedSetlistId
        ? (MOCK_SETLISTS.find((s) => s.id === setup.selectedSetlistId)?.name ??
          `${setup.showName} — setlist`)
        : `${setup.showName} — setlist`,
      segments: setup.editableSegments,
      total_planned_duration_seconds: setup.editableSegments.reduce(
        (sum, seg) =>
          sum + (seg.variants.find((v) => v.variant_type === "full")?.duration_seconds ?? 0),
        0,
      ),
    };

    const show: Show = {
      id: crypto.randomUUID(),
      name: setup.showName,
      status: "live",
      scheduled_start: `${setup.showDate}T${setup.scheduledStart}:00`,
      curfew: `${setup.showDate}T${setup.curfew}:00`,
      actual_start: new Date().toISOString(),
      venue: resolvedVenue,
      setlist,
    };

    const timeline: TimelineEntry[] = setup.editableSegments.map((seg) => ({
      segment_id: seg.id,
      status: "planned" as const,
      planned_duration_seconds:
        seg.variants.find((v) => v.variant_type === "full")?.duration_seconds ?? 0,
    }));

    useShowStore.getState().initializeShow(show, timeline);
    navigate(ROUTES.LIVE);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="space-y-0 pt-6">
          <SummaryRow label="Show">{showName || "—"}</SummaryRow>
          <Separator />
          <SummaryRow label="Venue">
            {venue
              ? `${venue.name} (${VENUE_TYPE_LABELS[venue.type] ?? venue.type}, ${venue.capacity.toLocaleString("pl-PL")} osób)`
              : "—"}
          </SummaryRow>
          <Separator />
          <SummaryRow label="Start">{scheduledStart || "—"}</SummaryRow>
          <Separator />
          <SummaryRow label="Curfew">
            <span>
              {curfew || "—"}
              {curfew && scheduledStart && totalPlannedSeconds > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({formatDuration(showWindowSeconds)} show, bufor: ~{formatDuration(bufferSeconds)}{" "}
                  setlista)
                </span>
              )}
            </span>
          </SummaryRow>
          <Separator />
          <SummaryRow label="Setlista">
            {editableSegments.length > 0
              ? `${setlistName} (${editableSegments.length} segmentów, ${formatDurationMmSs(totalPlannedSeconds)})`
              : "—"}
          </SummaryRow>
          <Separator />
          <SummaryRow label="Kalibracja">{calibrationPresetName}</SummaryRow>
        </CardContent>
      </Card>

      <Button
        className="min-h-[60px] w-full bg-green-600 text-lg font-bold text-white hover:bg-green-700"
        onClick={handleStartShow}
      >
        START SHOW
      </Button>
    </div>
  );
}
