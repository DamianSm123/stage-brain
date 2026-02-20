import type { Show } from "@/entities/show";
import { useSetupStore } from "@/entities/show";
import { MOCK_PREVIOUS_SHOWS } from "@/shared/lib/mock-setup-data";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";

function formatDate(isoDate: string): string {
  return isoDate.split("T")[0];
}

function formatTime(isoDate: string): string {
  const date = new Date(isoDate);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function ShowInfoStep() {
  const { showName, showDate, scheduledStart, curfew, updateShowInfo } = useSetupStore();

  const handleClone = (show: Show) => {
    updateShowInfo({
      showName: show.name,
      showDate: formatDate(show.scheduled_start),
      scheduledStart: formatTime(show.scheduled_start),
      curfew: formatTime(show.curfew),
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informacje o show</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="show-name">Nazwa show</Label>
            <Input
              id="show-name"
              placeholder="np. Quebonafide — Warszawa 15.05.2026"
              value={showName}
              onChange={(e) => updateShowInfo({ showName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="show-date">Data</Label>
            <Input
              id="show-date"
              type="date"
              value={showDate}
              onChange={(e) => updateShowInfo({ showDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled-start">Planowany start</Label>
              <Input
                id="scheduled-start"
                type="time"
                value={scheduledStart}
                onChange={(e) => updateShowInfo({ scheduledStart: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="curfew">Curfew</Label>
              <Input
                id="curfew"
                type="time"
                value={curfew}
                onChange={(e) => updateShowInfo({ curfew: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="space-y-3">
        <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Ostatnie show
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_PREVIOUS_SHOWS.map((show) => (
            <Card key={show.id} className="flex flex-col justify-between">
              <CardContent className="pt-4">
                <p className="font-medium">{show.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(show.scheduled_start)} | {show.venue.name}, {show.venue.city}
                </p>
              </CardContent>
              <div className="px-4 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleClone(show)}
                >
                  Klonuj
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
