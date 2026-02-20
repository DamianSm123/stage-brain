import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LivePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Live</CardTitle>
        <CardDescription>Real-time event monitoring dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Live module — coming soon.</p>
      </CardContent>
    </Card>
  );
}
