import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface HorizontalBarChartProps {
  title: string;
  data: BarData[];
  maxValue?: number;
}

export default function HorizontalBarChart({ title, data, maxValue }: HorizontalBarChartProps) {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);

  return (
    <Card className="glass-card border-2 border-primary/10">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((item, index) => {
          const percentage = (item.value / max) * 100;
          return (
            <div key={index} className="space-y-2" data-testid={`bar-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground" data-testid={`label-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>{item.label}</span>
                <span className="font-semibold" data-testid={`value-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>{item.value}</span>
              </div>
              <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${item.color || "bg-primary"}`}
                  style={{ width: `${percentage}%` }}
                  data-testid={`progress-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
