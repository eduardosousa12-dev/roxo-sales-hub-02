import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  className?: string;
  valueClassName?: string;
}

export default function MetricCard({ title, value, icon: Icon, className, valueClassName }: MetricCardProps) {
  return (
    <Card className={cn("glass-card glow-purple-hover transition-all", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("text-3xl font-bold bg-gradient-to-r from-primary to-purple-glow bg-clip-text text-transparent", valueClassName)}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
