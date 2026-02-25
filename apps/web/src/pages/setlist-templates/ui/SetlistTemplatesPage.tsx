import { ListMusic, Plus, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import type { TemplateSortOption } from "@/entities/setlist-template";
import { useTemplatesStore } from "@/entities/setlist-template";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { TemplatesTable } from "@/widgets/templates-table";

const SORT_OPTIONS: { value: TemplateSortOption; label: string }[] = [
  { value: "newest", label: "Najnowsze" },
  { value: "oldest", label: "Najstarsze" },
  { value: "name-asc", label: "Nazwa A\u2013Z" },
];

function TemplatesToolbar() {
  const navigate = useNavigate();
  const { search, sort, setSearch, setSort, createTemplate } = useTemplatesStore();

  const [localSearch, setLocalSearch] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setSearch(localSearch);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [localSearch, setSearch]);

  const handleNewTemplate = () => {
    const template = createTemplate("Nowy szablon");
    navigate(`/setlist-templates/${template.id}`);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl xl:text-3xl font-bold leading-tight">Szablony setlist</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-[280px] xl:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Szukaj szablonu..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={sort} onValueChange={(v) => setSort(v as TemplateSortOption)}>
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

        <Button onClick={handleNewTemplate} className="ml-auto">
          <Plus />
          Nowy szablon
        </Button>
      </div>
    </div>
  );
}

function EmptyState() {
  const navigate = useNavigate();
  const createTemplate = useTemplatesStore((s) => s.createTemplate);

  const handleCreate = () => {
    const template = createTemplate("Nowy szablon");
    navigate(`/setlist-templates/${template.id}`);
  };

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <ListMusic className="size-12 text-muted-foreground" />
      <h2 className="text-xl xl:text-2xl font-semibold">Brak szablonów</h2>
      <p className="text-base text-muted-foreground">
        Stwórz pierwszy szablon, żeby móc go ładować do show.
      </p>
      <Button onClick={handleCreate}>
        <Plus />
        Stwórz szablon
      </Button>
    </div>
  );
}

export function SetlistTemplatesPage() {
  const templates = useTemplatesStore((s) => s.templates);
  const isEmpty = templates.length === 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-6">
      {isEmpty ? (
        <>
          <h1 className="text-2xl xl:text-3xl font-bold leading-tight">Szablony setlist</h1>
          <EmptyState />
        </>
      ) : (
        <>
          <TemplatesToolbar />
          <TemplatesTable />
        </>
      )}
    </div>
  );
}
