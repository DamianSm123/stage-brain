import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

export function PostShowPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Post-show</CardTitle>
        <CardDescription>Review event analytics and generate reports.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Post-show module — coming soon.</p>
      </CardContent>
    </Card>
  );
}
