import { Disc3 } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

interface ShowInfoSummaryCardProps {
  showName: string;
  artists: string[];
  genre: string;
}

export function ShowInfoSummaryCard({ showName, artists, genre }: ShowInfoSummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold xl:text-lg">
          <Disc3 className="size-5" />
          Koncert
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-lg font-semibold">{showName || "—"}</p>
        {artists.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {artists.map((a) => (
              <Badge key={a} variant="secondary">
                {a}
              </Badge>
            ))}
          </div>
        )}
        {genre && <p className="text-sm text-muted-foreground">Gatunek: {genre}</p>}
      </CardContent>
    </Card>
  );
}
