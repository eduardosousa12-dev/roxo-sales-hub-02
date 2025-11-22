import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PerformanceCardProps {
  title: string;
  reunioes: number;
  vendas: number;
  noShow: number;
  valorVendas: number;
}

export default function PerformanceCard({ title, reunioes, vendas, noShow, valorVendas }: PerformanceCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Card className="bg-card/80 backdrop-blur border-2 border-primary/20" data-testid={`card-performance-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold" data-testid={`title-performance-${title.toLowerCase().replace(/\s+/g, '-')}`}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Reuniões</span>
          <span className="text-lg font-bold" data-testid={`value-reunioes-${title.toLowerCase().replace(/\s+/g, '-')}`}>{reunioes}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Vendas</span>
          <span className="text-lg font-bold text-green-500" data-testid={`value-vendas-${title.toLowerCase().replace(/\s+/g, '-')}`}>{vendas}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">No Show</span>
          <span className="text-lg font-bold text-red-500" data-testid={`value-noshow-${title.toLowerCase().replace(/\s+/g, '-')}`}>{noShow}</span>
        </div>
        <div className="border-t pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Valor Vendas</span>
            <span className="text-base font-bold text-primary" data-testid={`value-total-${title.toLowerCase().replace(/\s+/g, '-')}`}>{formatCurrency(valorVendas)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
