import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ROUTES } from "@/shared/config/navigation";
import { ShowClock } from "./ShowClock";
import { SystemStatus } from "./SystemStatus";

export function TopBar() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-12 items-center justify-between border-b border-border bg-card px-4">
      {/* Left: Logo + System Status */}
      <div className="flex items-center gap-3">
        <Link
          to={ROUTES.SETUP}
          className="text-lg font-bold text-foreground hover:text-primary transition-colors"
        >
          StageBrain
        </Link>
        <SystemStatus />
      </div>

      {/* Right: Show Clock */}
      <ShowClock now={now} />
    </div>
  );
}
