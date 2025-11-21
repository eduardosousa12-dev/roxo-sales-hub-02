import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileCheck, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Proposta {
  id: number;
  proposal_value: number | null;
  deal_outcome: string | null;
  date: string | null;
  lead: string | null;
  closer: string | null;
  sale_date: string | null;
}

export default function Propostas() {
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPropostas();
  }, []);

  const loadPropostas = async () => {
    try {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .or("proposal_sent.eq.Sim,proposal_sent.eq.Yes")
        .or("deal_outcome.is.null,deal_outcome.eq.Em Aberto,deal_outcome.eq.Open")
        .not("proposal_value", "is", null)
        .order("date", { ascending: false });

      if (error) throw error;
      setPropostas(data || []);
    } catch (error) {
      console.error("Error loading propostas:", error);
      toast.error("Erro ao carregar propostas");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, novoStatus: "Ganho" | "Perdido") => {
    try {
      const { error } = await supabase
        .from("activities")
        .update({
          deal_outcome: novoStatus,
          sale_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Proposta marcada como ${novoStatus}`);
      loadPropostas();
    } catch (error) {
      console.error("Error updating proposta:", error);
      toast.error("Erro ao atualizar proposta");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-glow bg-clip-text text-transparent">
          Propostas em Aberto
        </h1>
        <p className="text-muted-foreground">Converta propostas em vendas ou perdas</p>
      </div>

      <div className="flex gap-4">
        <Select defaultValue="todos-usuarios">
          <SelectTrigger className="w-[200px] border-primary/20">
            <SelectValue placeholder="Closer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos-usuarios">Todos os Usuários</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {loading ? (
          <Card className="glass-card">
            <CardContent className="p-8">
              <p className="text-center text-muted-foreground">Carregando propostas...</p>
            </CardContent>
          </Card>
        ) : propostas.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-8">
              <div className="text-center">
                <FileCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhuma proposta em aberto</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          propostas.map((proposta) => (
            <Card key={proposta.id} className="glass-card glow-purple-hover">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {proposta.lead || "Lead não identificado"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Closer: {proposta.closer || "Não atribuído"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {proposta.date ? `Enviada em ${formatDate(proposta.date)}` : "Data não informada"}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-primary text-primary">
                    {proposta.deal_outcome || "Em Aberto"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(proposta.proposal_value || 0)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => updateStatus(proposta.id, "Ganho")}
                      variant="default"
                      className="glow-purple-hover"
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Marcar como Ganho
                    </Button>
                    <Button
                      onClick={() => updateStatus(proposta.id, "Perdido")}
                      variant="destructive"
                    >
                      <TrendingDown className="mr-2 h-4 w-4" />
                      Marcar como Perdido
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
