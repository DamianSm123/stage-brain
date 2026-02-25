import { format, startOfDay } from "date-fns";
import { pl } from "date-fns/locale/pl";
import { AlertTriangle, CalendarDays } from "lucide-react";
import { getDetailsValidationErrors, useShowEditorStore, useShowsStore } from "@/entities/show";
import { cn } from "@/shared/lib/utils";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Label } from "@/shared/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { TimePicker } from "@/shared/ui/time-picker";

export function ScheduleCard() {
  const showId = useShowEditorStore((s) => s.showId);
  const date = useShowEditorStore((s) => s.date);
  const startTime = useShowEditorStore((s) => s.startTime);
  const endTime = useShowEditorStore((s) => s.endTime);
  const curfew = useShowEditorStore((s) => s.curfew);
  const showName = useShowEditorStore((s) => s.showName);
  const selectedVenueId = useShowEditorStore((s) => s.selectedVenueId);
  const isCreatingNewVenue = useShowEditorStore((s) => s.isCreatingNewVenue);
  const newVenueName = useShowEditorStore((s) => s.newVenueName);
  const touchedFields = useShowEditorStore((s) => s.touchedFields);
  const setDate = useShowEditorStore((s) => s.setDate);
  const setStartTime = useShowEditorStore((s) => s.setStartTime);
  const setEndTime = useShowEditorStore((s) => s.setEndTime);
  const setCurfew = useShowEditorStore((s) => s.setCurfew);
  const touchField = useShowEditorStore((s) => s.touchField);
  const allShows = useShowsStore((s) => s.shows);

  const errors = getDetailsValidationErrors(
    {
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
    },
    allShows,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base xl:text-lg">Harmonogram</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Data */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">
            Data <span className="text-red-500">*</span>
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-9 w-full justify-start font-normal sm:w-64",
                  !date && "text-muted-foreground",
                  errors.date && "border-red-500",
                )}
                onBlur={() => touchField("date")}
              >
                <CalendarDays className="mr-2 size-4" />
                {date ? format(date, "d MMM yyyy", { locale: pl }) : "Wybierz datę"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                locale={pl}
                mode="single"
                selected={date}
                onSelect={(d) => {
                  setDate(d);
                  touchField("date");
                }}
                disabled={{ before: startOfDay(new Date()) }}
              />
            </PopoverContent>
          </Popover>
          {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
        </div>

        {/* Time fields */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 xl:gap-6">
          {/* Planowany start */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Planowany start <span className="text-red-500">*</span>
            </Label>
            <TimePicker
              value={startTime}
              onChange={setStartTime}
              onBlur={() => touchField("startTime")}
              error={!!errors.startTime}
            />
            {errors.startTime && <p className="text-xs text-red-500">{errors.startTime}</p>}
          </div>

          {/* Planowany koniec */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Planowany koniec <span className="text-red-500">*</span>
            </Label>
            <TimePicker
              value={endTime}
              onChange={setEndTime}
              onBlur={() => touchField("endTime")}
              error={!!errors.endTime}
            />
            {errors.endTime && <p className="text-xs text-red-500">{errors.endTime}</p>}
          </div>

          {/* Curfew */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Curfew <span className="text-red-500">*</span>
            </Label>
            <TimePicker
              value={curfew}
              onChange={setCurfew}
              onBlur={() => touchField("curfew")}
              icon={<AlertTriangle className="size-4 text-orange-500" />}
              error={!!errors.curfew}
              className={cn(!errors.curfew && "border-orange-500")}
            />
            {errors.curfew ? (
              <p className="text-xs text-red-500">{errors.curfew}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Maksymalny czas zakończenia wg umowy z obiektem
              </p>
            )}
          </div>
        </div>

        {errors.dateTimeConflict && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription>
              Koncert „{errors.dateTimeConflict}" jest już zaplanowany na tę datę i godzinę.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
