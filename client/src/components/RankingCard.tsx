import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface RankingItem {
  rank: number;
  name: string;
  vendas: number;
  valor: number;
}

interface RankingCardProps {
  data: RankingItem[];
}

export default function RankingCard({ data }: RankingCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Card className="glass-card border-2 border-primary/10" data-testid="card-ranking-vendas">
      <CardHeader>
        <CardTitle data-testid="title-ranking-vendas">Ranking de Vendas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <div className="text-center text-muted-foreground py-8" data-testid="text-no-sales">
            Nenhuma venda registrada
          </div>
        ) : (
          data.map((item) => (
            <div
              key={item.rank}
              className="flex items-center justify-between p-3 rounded-lg hover-elevate border border-border/50"
              data-testid={`row-ranking-${item.rank}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-foreground/90 w-8" data-testid={`rank-number-${item.rank}`}>
                  #{item.rank}
                </span>
                <Avatar className="h-10 w-10" data-testid={`avatar-ranking-${item.rank}`}>
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                    {getInitials(item.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground" data-testid={`name-ranking-${item.rank}`}>{item.name}</p>
                  <p className="text-sm text-foreground/70" data-testid={`vendas-count-${item.rank}`}>
                    {item.vendas} {item.vendas === 1 ? "venda" : "vendas"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary" data-testid={`value-ranking-${item.rank}`}>
                  {formatCurrency(item.valor)}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
