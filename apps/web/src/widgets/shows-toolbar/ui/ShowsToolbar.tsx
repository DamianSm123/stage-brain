import { Plus, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import type { DashboardShowStatus, SortOption } from "@/entities/show";
import { useShowsStore } from "@/entities/show";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

const ALL_VALUE = "__ALL__";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: ALL_VALUE, label: "Wszystkie" },
  { value: "SZKIC", label: "Szkic" },
  { value: "GOTOWY", label: "Gotowy" },
  { value: "NA_ZYWO", label: "Na żywo" },
  { value: "ZAKONCZONY", label: "Zakończony" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Najnowsze" },
  { value: "oldest", label: "Najstarsze" },
  { value: "name-asc", label: "Nazwa A–Z" },
  { value: "closest-date", label: "Najbliższa data" },
];

export function ShowsToolbar() {
  const navigate = useNavigate();
  const { search, statusFilter, sort, setSearch, setStatusFilter, setSort, createShow } =
    useShowsStore();

  const [localSearch, setLocalSearch] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setSearch(localSearch);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [localSearch, setSearch]);

  const handleNewShow = () => {
    const show = createShow();
    navigate(`/shows/${show.id}`);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl xl:text-3xl font-bold leading-tight">Koncerty</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-[280px] xl:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Szukaj koncertu..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={statusFilter ?? ALL_VALUE}
          onValueChange={(v) =>
            setStatusFilter(v === ALL_VALUE ? null : (v as DashboardShowStatus))
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" side="bottom" align="start">
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" side="bottom" align="start">
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleNewShow} className="ml-auto">
          <Plus />
          Nowy koncert
        </Button>
      </div>
    </div>
  );
}
