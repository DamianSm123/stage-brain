import { MapPin } from "lucide-react";
import type { VenueType } from "@/entities/venue";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

interface VenueSummaryCardProps {
  name: string;
  type: VenueType | "";
  capacity: string;
  city: string;
}

const VENUE_TYPE_LABELS: Record<string, string> = {
  hall: "Hala",
  stadium: "Stadion",
  club: "Klub",
  open_air: "Open Air",
  theatre: "Teatr",
};

export function VenueSummaryCard({ name, type, capacity, city }: VenueSummaryCardProps) {
  const typeLabel = type ? (VENUE_TYPE_LABELS[type] ?? type) : "";
  const details = [typeLabel, capacity ? `${Number(capacity).toLocaleString("pl-PL")}` : "", city]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold xl:text-lg">
          <MapPin className="size-5" />
          Obiekt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-lg font-semibold">{name || "—"}</p>
        {details && <p className="text-sm text-muted-foreground">{details}</p>}
      </CardContent>
    </Card>
  );
}
