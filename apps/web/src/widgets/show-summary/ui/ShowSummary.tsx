import { isDetailsStepValid, useShowEditorStore } from "@/entities/show";
import { MOCK_VENUES } from "@/shared/lib/mock-setup-data";
import { ScheduleSummaryCard } from "./ScheduleSummaryCard";
import { SetlistSummaryCard } from "./SetlistSummaryCard";
import { ShowInfoSummaryCard } from "./ShowInfoSummaryCard";
import { VenueSummaryCard } from "./VenueSummaryCard";

function isSetlistValid(segments: { name: string; durationFull: number }[]): boolean {
  return segments.some((s) => s.name.trim() !== "" && s.durationFull > 0);
}

export function ShowSummary() {
  const state = useShowEditorStore();

  const resolvedVenueName = state.selectedVenueId
    ? (MOCK_VENUES.find((v) => v.id === state.selectedVenueId)?.name ?? "")
    : state.newVenueName;

  const detailsValid = isDetailsStepValid(state);
  const setlistValid = isSetlistValid(state.segments);
  const isReady = detailsValid && setlistValid;

  const totalDurationFull = state.segments.reduce((sum, s) => sum + s.durationFull, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:gap-6">
        <ShowInfoSummaryCard
          showName={state.showName}
          artists={state.artists}
          genre={state.genre}
        />
        <VenueSummaryCard
          name={resolvedVenueName}
          type={state.venueType}
          capacity={state.venueCapacity}
          city={state.venueCity}
        />
        <ScheduleSummaryCard
          date={state.date}
          startTime={state.startTime}
          endTime={state.endTime}
          curfew={state.curfew}
          totalDurationFull={totalDurationFull}
        />
        <SetlistSummaryCard segments={state.segments} startTime={state.startTime || undefined} />
      </div>

      {!isReady && (
        <p className="text-center text-sm text-yellow-500">
          Uzupełnij brakujące dane w poprzednich krokach, aby oznaczyć show jako gotowy.
        </p>
      )}
    </div>
  );
}
