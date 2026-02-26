import { Plus } from "lucide-react";
import { getDetailsValidationErrors, useShowEditorStore } from "@/entities/show";
import type { VenueType } from "@/entities/venue";
import { MOCK_VENUES } from "@/shared/lib/mock-setup-data";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { VenueCombobox } from "./VenueCombobox";

const VENUE_TYPE_OPTIONS: { value: VenueType; label: string }[] = [
  { value: "hall", label: "Hala" },
  { value: "stadium", label: "Stadion" },
  { value: "open_air", label: "Open-air" },
  { value: "club", label: "Klub" },
  { value: "theatre", label: "Teatr" },
];

export function VenueCard() {
  const selectedVenueId = useShowEditorStore((s) => s.selectedVenueId);
  const isCreatingNewVenue = useShowEditorStore((s) => s.isCreatingNewVenue);
  const newVenueName = useShowEditorStore((s) => s.newVenueName);
  const venueType = useShowEditorStore((s) => s.venueType);
  const venueCapacity = useShowEditorStore((s) => s.venueCapacity);
  const venueCity = useShowEditorStore((s) => s.venueCity);
  const touchedFields = useShowEditorStore((s) => s.touchedFields);

  const selectVenue = useShowEditorStore((s) => s.selectVenue);
  const startNewVenue = useShowEditorStore((s) => s.startNewVenue);
  const setNewVenueName = useShowEditorStore((s) => s.setNewVenueName);
  const setVenueType = useShowEditorStore((s) => s.setVenueType);
  const setVenueCapacity = useShowEditorStore((s) => s.setVenueCapacity);
  const setVenueCity = useShowEditorStore((s) => s.setVenueCity);
  const touchField = useShowEditorStore((s) => s.touchField);

  // Only need venue-related validation
  const showName = useShowEditorStore((s) => s.showName);
  const date = useShowEditorStore((s) => s.date);
  const startTime = useShowEditorStore((s) => s.startTime);
  const endTime = useShowEditorStore((s) => s.endTime);
  const curfew = useShowEditorStore((s) => s.curfew);

  const showId = useShowEditorStore((s) => s.showId);

  const errors = getDetailsValidationErrors({
    showId,
    showName,
    date,
    startTime,
    endTime,
    curfew,
    selectedVenueId,
    isCreatingNewVenue,
    newVenueName,
    touchedFields,
  });

  const hasVenueSelected = selectedVenueId !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base xl:text-lg">Obiekt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Venue selector */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Obiekt</Label>
          <div className="flex gap-2">
            {/* biome-ignore lint/a11y/noStaticElementInteractions: wrapper for blur delegation to children */}
            <div className="flex-1" onBlur={() => touchField("venue")}>
              {isCreatingNewVenue ? (
                <Input
                  placeholder="Nazwa nowego obiektu"
                  value={newVenueName}
                  onChange={(e) => setNewVenueName(e.target.value)}
                  onBlur={() => touchField("venue")}
                  className={errors.venue ? "border-red-500" : undefined}
                />
              ) : (
                <VenueCombobox
                  venues={MOCK_VENUES}
                  selectedVenueId={selectedVenueId}
                  onSelect={(id) => {
                    selectVenue(id);
                    touchField("venue");
                  }}
                  hasError={!!errors.venue}
                />
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-9 shrink-0"
              onClick={() => {
                if (isCreatingNewVenue) {
                  // Cancel new venue creation
                  useShowEditorStore.getState().clearVenue();
                } else {
                  startNewVenue();
                }
              }}
            >
              <Plus className="size-4" />
              {isCreatingNewVenue ? "Anuluj" : "Nowy obiekt"}
            </Button>
          </div>
          {errors.venue && <p className="text-xs text-red-500">{errors.venue}</p>}
        </div>

        {/* Venue details (shown when venue selected or creating new) */}
        {(hasVenueSelected || isCreatingNewVenue) && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 xl:gap-6">
            {/* Typ */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Typ</Label>
              <Select
                value={venueType || undefined}
                onValueChange={(v) => setVenueType(v as VenueType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Wybierz typ" />
                </SelectTrigger>
                <SelectContent>
                  {VENUE_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pojemność */}
            <div className="space-y-2">
              <Label htmlFor="venue-capacity" className="text-sm font-semibold">
                Pojemność
              </Label>
              <Input
                id="venue-capacity"
                type="number"
                placeholder="np. 15000"
                value={venueCapacity}
                onChange={(e) => setVenueCapacity(e.target.value)}
              />
            </div>

            {/* Miasto */}
            <div className="space-y-2">
              <Label htmlFor="venue-city" className="text-sm font-semibold">
                Miasto
              </Label>
              <Input
                id="venue-city"
                placeholder="np. Kraków"
                value={venueCity}
                onChange={(e) => setVenueCity(e.target.value)}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
