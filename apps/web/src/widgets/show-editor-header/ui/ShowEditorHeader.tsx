import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import type { SaveStatus } from "@/entities/show";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { SaveIndicator } from "./SaveIndicator";
import { Stepper } from "./Stepper";

interface ShowEditorHeaderProps {
  showName: string;
  isDraft: boolean;
  saveStatus: SaveStatus;
  isDirty: boolean;
  currentStep: 1 | 2 | 3;
  completedSteps: number[];
  onStepClick: (step: 1 | 2 | 3) => void;
  onSave: () => void;
}

export function ShowEditorHeader({
  showName,
  isDraft,
  saveStatus,
  isDirty,
  currentStep,
  completedSteps,
  onStepClick,
  onSave,
}: ShowEditorHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="size-4" />
            Koncerty
          </Button>
          <h1 className="text-xl font-bold xl:text-2xl">{showName || "Nowy koncert"}</h1>
          {isDraft ? (
            <Badge variant="secondary" className="text-xs">
              Szkic
            </Badge>
          ) : (
            <Badge className="bg-green-600 text-xs text-white hover:bg-green-700">Gotowy</Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          <SaveIndicator status={saveStatus} />
          <Button size="sm" onClick={onSave} disabled={!isDirty}>
            Zapisz
          </Button>
        </div>
      </div>

      <div className="flex justify-center border-t border-border pt-4">
        <Stepper
          currentStep={currentStep}
          onStepClick={onStepClick}
          completedSteps={completedSteps}
        />
      </div>
    </div>
  );
}
