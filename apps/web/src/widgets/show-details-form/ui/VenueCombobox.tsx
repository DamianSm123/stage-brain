import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import type { Venue } from "@/entities/venue";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

interface VenueComboboxProps {
  venues: Venue[];
  selectedVenueId: string | null;
  onSelect: (venueId: string) => void;
  hasError?: boolean;
}

export function VenueCombobox({ venues, selectedVenueId, onSelect, hasError }: VenueComboboxProps) {
  const [open, setOpen] = useState(false);
  const selectedVenue = venues.find((v) => v.id === selectedVenueId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-9 w-full justify-between font-normal",
            !selectedVenue && "text-muted-foreground",
            hasError && "border-red-500",
          )}
        >
          {selectedVenue
            ? `${selectedVenue.name} — ${selectedVenue.city}`
            : "Szukaj lub wybierz obiekt..."}
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Szukaj obiekt..." />
          <CommandList>
            <CommandEmpty>Nie znaleziono obiektu.</CommandEmpty>
            <CommandGroup>
              {venues.map((venue) => (
                <CommandItem
                  key={venue.id}
                  value={`${venue.name} ${venue.city}`}
                  onSelect={() => {
                    onSelect(venue.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      selectedVenueId === venue.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm">{venue.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {venue.city} · {venue.capacity.toLocaleString("pl-PL")}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
