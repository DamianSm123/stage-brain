import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import type { ShowEditorState } from "@/entities/show";
import { isDetailsStepValid, useShowEditorStore, useShowsStore } from "@/entities/show";
import { useAutoSave } from "@/features/auto-save";
import { MOCK_VENUES } from "@/shared/lib/mock-setup-data";
import { Button } from "@/shared/ui/button";
import { SetlistSummaryBar, SetlistTable } from "@/widgets/setlist-table";
import { ShowDetailsForm } from "@/widgets/show-details-form";
import { ShowEditorHeader } from "@/widgets/show-editor-header";
import { ShowSummary } from "@/widgets/show-summary";

function isSetlistStepValid(segments: { name: string; durationFull: number }[]): boolean {
  return segments.some((s) => s.name.trim() !== "" && s.durationFull > 0);
}

export function ShowEditorPage() {
  const { id } = useParams<{ id: string }>();
  const store = useShowEditorStore();

  const {
    currentStep,
    showName,
    saveStatus,
    isDirty,
    segments,
    startTime,
    endTime,
    setCurrentStep,
    addSegment,
    removeSegment,
    updateSegment,
    reorderSegments,
    loadTemplate,
    importCSV,
    save,
    loadShow,
    resetEditor,
  } = store;

  const shows = useShowsStore((s) => s.shows);

  useEffect(() => {
    if (!id) return;

    const dashboardShow = shows.find((s) => s.id === id);
    if (!dashboardShow) {
      loadShow(id, {});
      return;
    }

    const matchedVenue = dashboardShow.venue
      ? MOCK_VENUES.find((v) => v.name === dashboardShow.venue?.name)
      : null;

    const editorData: Partial<ShowEditorState> = {
      showName: dashboardShow.name,
      artists: dashboardShow.artists,
      genre: dashboardShow.genre ?? "",
      date: dashboardShow.date ? new Date(dashboardShow.date) : undefined,
      startTime: dashboardShow.startTime,
      endTime: dashboardShow.endTime,
      curfew: dashboardShow.curfew,
      selectedVenueId: matchedVenue?.id ?? null,
      isCreatingNewVenue: !matchedVenue && dashboardShow.venue !== null,
      newVenueName: !matchedVenue && dashboardShow.venue ? dashboardShow.venue.name : "",
      venueType: dashboardShow.venue?.type ?? "",
      venueCapacity: dashboardShow.venue ? String(dashboardShow.venue.capacity) : "",
      venueCity: dashboardShow.venue?.city ?? "",
    };

    loadShow(id, editorData);

    return () => {
      resetEditor();
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const { triggerSave } = useAutoSave({ isDirty, save });

  const detailsValid = isDetailsStepValid(store, shows);
  const setlistValid = isSetlistStepValid(segments);

  const completedSteps = useMemo(() => {
    const steps: number[] = [];
    if (detailsValid) steps.push(1);
    if (setlistValid) steps.push(2);
    return steps;
  }, [detailsValid, setlistValid]);

  const handleNext = useCallback(async () => {
    await triggerSave();
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as 1 | 2 | 3);
    }
  }, [currentStep, setCurrentStep, triggerSave]);

  const handleBack = useCallback(async () => {
    await triggerSave();
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as 1 | 2 | 3);
    }
  }, [currentStep, setCurrentStep, triggerSave]);

  const handleStepClick = useCallback(
    async (step: 1 | 2 | 3) => {
      await triggerSave();
      setCurrentStep(step);
    },
    [setCurrentStep, triggerSave],
  );

  const navigate = useNavigate();

  const canGoNext = (currentStep === 1 && detailsValid) || (currentStep === 2 && setlistValid);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <ShowEditorHeader
        showName={showName}
        isDraft={!detailsValid || !setlistValid}
        saveStatus={saveStatus}
        isDirty={isDirty}
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
        onSave={() => save()}
      />

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        {currentStep === 1 && <ShowDetailsForm />}
        {currentStep === 2 && (
          <SetlistTable
            segments={segments}
            onAddSegment={addSegment}
            onRemoveSegment={removeSegment}
            onUpdateSegment={updateSegment}
            onReorderSegments={reorderSegments}
            onLoadTemplate={loadTemplate}
            onImportCSV={importCSV}
            showTimeBar
            showToolbar
            hideSummary
            startTime={startTime}
            endTime={endTime}
          />
        )}
        {currentStep === 3 && <ShowSummary />}
      </div>

      {currentStep < 3 && (
        <div className="flex shrink-0 items-center justify-between border-t border-border pt-4">
          <div className="w-28">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="size-4" />
                Wstecz
              </Button>
            )}
          </div>
          {currentStep === 2 && segments.length > 0 && (
            <SetlistSummaryBar segments={segments} startTime={startTime || undefined} />
          )}
          <div className="flex w-28 justify-end">
            <Button onClick={handleNext} disabled={!canGoNext}>
              Dalej
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="flex shrink-0 items-center justify-between border-t border-border pt-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="size-4" />
            Wstecz
          </Button>
          <Button onClick={() => navigate("/")}>
            <ExternalLink className="size-4" />
            Przejdź do listy koncertów
          </Button>
        </div>
      )}
    </div>
  );
}
