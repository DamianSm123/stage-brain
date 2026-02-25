import { useEffect, useState } from "react";
import { selectTotalDelta, useShowStore } from "@/entities/show";
import { RecoveryState } from "./RecoveryState";
import { SilenceState } from "./SilenceState";
import { SuggestionState } from "./SuggestionState";

export function DecisionPanel() {
  const show = useShowStore((s) => s.show);
  const timeline = useShowStore((s) => s.timeline);
  const recommendations = useShowStore((s) => s.recommendations);
  const recoveryScenarios = useShowStore((s) => s.recoveryScenarios);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const totalDelta = selectTotalDelta(show, timeline, now);

  // Recovery takes priority when behind schedule
  if (totalDelta > 0 && recoveryScenarios.length > 0) {
    return <RecoveryState />;
  }

  // Suggestion when system has recommendations
  if (recommendations.length > 0) {
    return <SuggestionState />;
  }

  // Default: silence (plan is OK)
  return <SilenceState />;
}
