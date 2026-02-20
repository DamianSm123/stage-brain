import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

export function SetupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup</CardTitle>
        <CardDescription>Configure event parameters before going live.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Setup module — coming soon.</p>
      </CardContent>
    </Card>
  );
}
