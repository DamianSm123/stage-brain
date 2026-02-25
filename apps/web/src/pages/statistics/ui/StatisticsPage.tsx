import { Activity, BarChart3, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

const PLANNED_FEATURES = [
  {
    icon: Activity,
    title: "Zaangażowanie w czasie",
    description: "Wykres zaangażowania publiczności z kolejnych koncertów",
  },
  {
    icon: TrendingUp,
    title: "Średnia delta",
    description: "Porównanie planowanego vs rzeczywistego czasu w sezonie",
  },
  {
    icon: BarChart3,
    title: "Porównanie obiektów",
    description: "Zaangażowanie i wyniki wg venue",
  },
  {
    icon: Clock,
    title: "Top segmenty",
    description: "Segmenty z najwyższym i najniższym zaangażowaniem",
  },
];

export function StatisticsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl xl:text-3xl font-bold leading-tight">Statystyki</h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 xl:gap-6">
        {PLANNED_FEATURES.map((feature) => (
          <Card key={feature.title} className="border-dashed">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <feature.icon className="size-5 text-muted-foreground" />
              <CardTitle className="text-base xl:text-lg font-semibold">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center py-8">
        <p className="text-base text-muted-foreground">Niedostępne w prototypie</p>
      </div>
    </div>
  );
}
