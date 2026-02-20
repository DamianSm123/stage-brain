import { useState } from "react";
import { useSetupStore } from "@/entities/show";
import type { VenueType } from "@/entities/venue";
import { MOCK_CALIBRATION_PRESETS, MOCK_VENUES } from "@/shared/lib/mock-setup-data";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Separator } from "@/shared/ui/separator";
import { Slider } from "@/shared/ui/slider";

const VENUE_TYPE_LABELS: Record<VenueType, string> = {
  hall: "Hala",
  stadium: "Stadion",
  club: "Klub",
  open_air: "Open Air",
};

export function VenueCalibrationStep() {
  const {
    selectedVenueId,
    newVenue,
    calibrationPresetId,
    calibration,
    selectVenue,
    setNewVenue,
    selectCalibrationPreset,
    updateCalibration,
  } = useSetupStore();

  const [showNewVenueForm, setShowNewVenueForm] = useState(newVenue !== null);

  const selectedVenue = MOCK_VENUES.find((v) => v.id === selectedVenueId);

  const handleNewVenueToggle = () => {
    if (showNewVenueForm) {
      setShowNewVenueForm(false);
      setNewVenue(null);
    } else {
      setShowNewVenueForm(true);
      setNewVenue({ name: "", type: "hall", capacity: 0, city: "" });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Venue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label>Venue</Label>
              <Select
                value={selectedVenueId ?? ""}
                onValueChange={(value) => {
                  setShowNewVenueForm(false);
                  selectVenue(value);
                }}
                disabled={showNewVenueForm}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz venue" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_VENUES.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name} — {venue.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={handleNewVenueToggle}>
              {showNewVenueForm ? "Anuluj" : "+ Nowy"}
            </Button>
          </div>

          {selectedVenue && !showNewVenueForm && (
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Typ: {VENUE_TYPE_LABELS[selectedVenue.type]}</span>
              <span>Pojemność: {selectedVenue.capacity.toLocaleString("pl-PL")}</span>
            </div>
          )}

          {showNewVenueForm && (
            <div className="space-y-3 rounded-md border border-border p-4">
              <div className="space-y-2">
                <Label htmlFor="new-venue-name">Nazwa</Label>
                <Input
                  id="new-venue-name"
                  placeholder="np. Tauron Arena"
                  value={newVenue?.name ?? ""}
                  onChange={(e) =>
                    setNewVenue({
                      ...(newVenue ?? { name: "", type: "hall", capacity: 0, city: "" }),
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Typ obiektu</Label>
                  <Select
                    value={newVenue?.type ?? "hall"}
                    onValueChange={(value) =>
                      setNewVenue({
                        ...(newVenue ?? { name: "", type: "hall", capacity: 0, city: "" }),
                        type: value as VenueType,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(VENUE_TYPE_LABELS) as [VenueType, string][]).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-venue-capacity">Pojemność</Label>
                  <Input
                    id="new-venue-capacity"
                    type="number"
                    min={0}
                    placeholder="np. 5000"
                    value={newVenue?.capacity || ""}
                    onChange={(e) =>
                      setNewVenue({
                        ...(newVenue ?? { name: "", type: "hall", capacity: 0, city: "" }),
                        capacity: Number.parseInt(e.target.value, 10) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-venue-city">Miasto</Label>
                <Input
                  id="new-venue-city"
                  placeholder="np. Kraków"
                  value={newVenue?.city ?? ""}
                  onChange={(e) =>
                    setNewVenue({
                      ...(newVenue ?? { name: "", type: "hall", capacity: 0, city: "" }),
                      city: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Kalibracja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Preset</Label>
            <Select value={calibrationPresetId ?? ""} onValueChange={selectCalibrationPreset}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz preset kalibracji" />
              </SelectTrigger>
              <SelectContent>
                {MOCK_CALIBRATION_PRESETS.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <CalibrationSlider
            label="Energy baseline"
            value={calibration.energy_baseline}
            onChange={(value) => updateCalibration({ energy_baseline: value })}
          />

          <CalibrationSlider
            label="Sensitivity"
            value={calibration.energy_sensitivity}
            onChange={(value) => updateCalibration({ energy_sensitivity: value })}
          />

          <CalibrationSlider
            label="Noise floor"
            value={calibration.crowd_noise_floor}
            onChange={(value) => updateCalibration({ crowd_noise_floor: value })}
          />
        </CardContent>
      </Card>
    </div>
  );
}

interface CalibrationSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function CalibrationSlider({ label, value, onChange }: CalibrationSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm tabular-nums text-muted-foreground">{value.toFixed(2)}</span>
      </div>
      <Slider min={0} max={1} step={0.01} value={[value]} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}
