import { Card, CardDescription, CardHeader, CardTitle } from "@scp/ui";
import type { LucideIcon } from "lucide-react";

export function Kpi({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  value: number | string;
}) {
  return (
    <Card className="shadow-panel">
      <CardHeader className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <CardDescription>{label}</CardDescription>
          <Icon className="size-3.5 text-primary" />
        </div>
        <CardTitle className="text-2xl">{value}</CardTitle>
        <CardDescription>{detail}</CardDescription>
      </CardHeader>
    </Card>
  );
}
