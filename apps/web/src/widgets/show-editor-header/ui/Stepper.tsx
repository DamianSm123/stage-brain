import { Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface StepperProps {
  currentStep: 1 | 2 | 3;
  onStepClick: (step: 1 | 2 | 3) => void;
  completedSteps: number[];
}

const STEPS = [
  { step: 1 as const, label: "Szczegóły" },
  { step: 2 as const, label: "Setlista" },
  { step: 3 as const, label: "Podsumowanie" },
];

export function Stepper({ currentStep, onStepClick, completedSteps }: StepperProps) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map(({ step, label }, index) => {
        const isCompleted = completedSteps.includes(step);
        const isCurrent = step === currentStep;
        const isClickable = isCompleted || step <= currentStep;

        return (
          <div key={step} className="flex items-center gap-2">
            {index > 0 && (
              <div
                className={cn(
                  "h-px w-6 transition-colors duration-300 xl:w-10",
                  isCompleted || isCurrent ? "bg-primary" : "bg-muted",
                )}
              />
            )}
            <button
              type="button"
              onClick={() => isClickable && onStepClick(step)}
              disabled={!isClickable}
              className={cn(
                "flex size-9 items-center justify-center rounded-full text-sm font-medium transition-colors duration-300",
                isCompleted && !isCurrent && "bg-primary text-primary-foreground cursor-pointer",
                isCurrent &&
                  "bg-primary text-primary-foreground ring-2 ring-primary/50 ring-offset-2 ring-offset-background",
                !isCompleted && !isCurrent && "bg-muted text-muted-foreground",
                isClickable && !isCurrent && "cursor-pointer hover:opacity-80",
              )}
            >
              {isCompleted && !isCurrent ? <Check className="size-4" /> : step}
            </button>
            <span
              className={cn(
                "hidden text-sm font-medium sm:inline",
                isCurrent || isCompleted ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
