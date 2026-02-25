import { Music, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { useShowsStore } from "@/entities/show";
import { Button } from "@/shared/ui/button";
import { ShowsTable } from "@/widgets/shows-table";
import { ShowsToolbar } from "@/widgets/shows-toolbar";

function EmptyState() {
  const navigate = useNavigate();
  const createShow = useShowsStore((s) => s.createShow);

  const handleCreate = () => {
    const show = createShow();
    navigate(`/shows/${show.id}`);
  };

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Music className="size-12 text-muted-foreground" />
      <h2 className="text-xl xl:text-2xl font-semibold">Brak koncertów</h2>
      <p className="text-base text-muted-foreground">Stwórz pierwszy koncert, żeby zacząć.</p>
      <Button onClick={handleCreate}>
        <Plus />
        Stwórz koncert
      </Button>
    </div>
  );
}

export function DashboardPage() {
  const shows = useShowsStore((s) => s.shows);
  const isEmpty = shows.length === 0;

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-6">
      {isEmpty ? (
        <>
          <h1 className="text-2xl xl:text-3xl font-bold leading-tight">Koncerty</h1>
          <EmptyState />
        </>
      ) : (
        <>
          <ShowsToolbar />
          <ShowsTable />
        </>
      )}
    </div>
  );
}
