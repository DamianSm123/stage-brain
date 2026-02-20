import { useSetupStore } from "@/entities/show";
import { Button } from "@/shared/ui/button";
import { SetlistStep } from "./SetlistStep";
import { ShowInfoStep } from "./ShowInfoStep";
import { SummaryStep } from "./SummaryStep";
import { VenueCalibrationStep } from "./VenueCalibrationStep";

const STEPS = [
  { number: 1, label: "Show info" },
  { number: 2, label: "Venue" },
  { number: 3, label: "Setlista" },
  { number: 4, label: "Podsumowanie" },
] as const;

function isStep1Valid(state: {
  showName: string;
  showDate: string;
  scheduledStart: string;
  curfew: string;
}) {
  return (
    state.showName.trim() !== "" &&
    state.showDate !== "" &&
    state.scheduledStart !== "" &&
    state.curfew !== ""
  );
}

function isStep2Valid(state: {
  selectedVenueId: string | null;
  newVenue: { name: string; type: string; capacity: number; city: string } | null;
}) {
  if (state.selectedVenueId) return true;
  if (state.newVenue) {
    return (
      state.newVenue.name.trim() !== "" &&
      state.newVenue.capacity > 0 &&
      state.newVenue.city.trim() !== ""
    );
  }
  return false;
}

export function SetupPage() {
  const store = useSetupStore();
  const { currentStep, setCurrentStep } = store;

  const canGoNext = (): boolean => {
    if (currentStep === 1) return isStep1Valid(store);
    if (currentStep === 2) return isStep2Valid(store);
    if (currentStep === 3) {
      return (
        store.editableSegments.length > 0 &&
        store.editableSegments.every(
          (seg) => seg.name.trim() !== "" && seg.variants.some((v) => v.duration_seconds > 0),
        )
      );
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < 4 && canGoNext()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <button
              type="button"
              className="flex items-center gap-2"
              onClick={() => {
                if (step.number < currentStep) setCurrentStep(step.number);
              }}
              disabled={step.number > currentStep}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  step.number < currentStep
                    ? "bg-primary text-primary-foreground"
                    : step.number === currentStep
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step.number < currentStep ? "\u2713" : step.number}
              </div>
              <span
                className={`text-sm font-medium ${
                  step.number <= currentStep ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </button>
            {index < STEPS.length - 1 && (
              <div
                className={`mx-3 h-px w-12 ${
                  step.number < currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div>
        {currentStep === 1 && <ShowInfoStep />}
        {currentStep === 2 && <VenueCalibrationStep />}
        {currentStep === 3 && <SetlistStep />}
        {currentStep === 4 && <SummaryStep />}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        {currentStep > 1 ? (
          <Button variant="outline" onClick={handleBack}>
            &larr; Wstecz
          </Button>
        ) : (
          <div />
        )}
        {currentStep < 4 && (
          <Button onClick={handleNext} disabled={!canGoNext()}>
            Dalej &rarr;
          </Button>
        )}
      </div>
    </div>
  );
}
