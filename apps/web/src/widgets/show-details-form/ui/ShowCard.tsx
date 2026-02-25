import { getDetailsValidationErrors, useShowEditorStore } from "@/entities/show";
import { cn } from "@/shared/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { TagInput } from "./TagInput";

const GENRE_OPTIONS = [
  { value: "hip-hop", label: "Hip-hop" },
  { value: "pop", label: "Pop" },
  { value: "rock", label: "Rock" },
  { value: "electronic", label: "Elektronika" },
  { value: "other", label: "Inne" },
];

export function ShowCard() {
  const showName = useShowEditorStore((s) => s.showName);
  const artists = useShowEditorStore((s) => s.artists);
  const genre = useShowEditorStore((s) => s.genre);
  const touchedFields = useShowEditorStore((s) => s.touchedFields);
  const setShowName = useShowEditorStore((s) => s.setShowName);
  const addArtist = useShowEditorStore((s) => s.addArtist);
  const removeArtist = useShowEditorStore((s) => s.removeArtist);
  const setGenre = useShowEditorStore((s) => s.setGenre);
  const touchField = useShowEditorStore((s) => s.touchField);

  const errors = getDetailsValidationErrors({
    showName,
    date: undefined,
    startTime: "",
    endTime: "",
    curfew: "",
    selectedVenueId: null,
    isCreatingNewVenue: false,
    newVenueName: "",
    touchedFields,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base xl:text-lg">Show</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Nazwa koncertu */}
        <div className="space-y-2">
          <Label htmlFor="show-name" className="text-sm font-semibold">
            Nazwa koncertu <span className="text-red-500">*</span>
          </Label>
          <Input
            id="show-name"
            autoFocus={!showName}
            placeholder="np. Mata — Hala Tour Kraków"
            value={showName}
            onChange={(e) => setShowName(e.target.value)}
            onBlur={() => touchField("showName")}
            className={cn(errors.showName && "border-red-500")}
          />
          {errors.showName && <p className="text-xs text-red-500">{errors.showName}</p>}
        </div>

        {/* Artyści + Gatunek */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_auto] xl:gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Artyści</Label>
            <TagInput tags={artists} onAdd={addArtist} onRemove={removeArtist} />
          </div>

          <div className="space-y-2 xl:w-48">
            <Label className="text-sm font-semibold">Gatunek</Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Wybierz gatunek" />
              </SelectTrigger>
              <SelectContent>
                {GENRE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
