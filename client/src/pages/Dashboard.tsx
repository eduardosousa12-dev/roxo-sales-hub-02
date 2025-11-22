import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MetricCard from "@/components/MetricCard";
import HorizontalBarChart from "@/components/HorizontalBarChart";
import PerformanceCard from "@/components/PerformanceCard";
import RankingCard from "@/components/RankingCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, DollarSign, FileCheck, Users, Calendar } from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("todos");
  const [selectedChannel, setSelectedChannel] = useState<string>("todos");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("todos");
  
  const [metrics, setMetrics] = useState({
    valorTotalVendido: 0,
    negociosGanhos: 0,
    propostasEnviadas: 0,
    leadsAtendimento: 0,
    totalReunioes: 0,
    reunioesRealizadas: 0,
    valorPropostaAberto: 0,
    qualificadas: 0,
    desqualificadas: 0,
    reagendadas: 0,
    noShow: 0,
    reunioesResgatadas: 0,
    perdidas: 0,
  });
  
  const [performanceCanal, setPerformanceCanal] = useState<any[]>([]);
  const [etapasReuniao, setEtapasReuniao] = useState<any[]>([]);
  const [evolucaoFunil, setEvolucaoFunil] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any[]>([]);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [selectedUser, selectedChannel, selectedPeriod]);

  const loadProfiles = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("is_active", true)
        .order("full_name");
      
      setProfiles(data || []);
    } catch (error) {
      console.error("Error loading profiles:", error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Build query with filters
      let query = supabase.from("activities").select("*");
      
      // Filter by user
      if (selectedUser !== "todos") {
        query = query.eq("closer_id", selectedUser);
      }
      
      // Filter by channel
      if (selectedChannel !== "todos") {
        query = query.eq("channel", selectedChannel);
      }
      
      // Filter by period
      if (selectedPeriod !== "todos") {
        const daysAgo = parseInt(selectedPeriod);
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - daysAgo);
        query = query.gte("date", dateFrom.toISOString().split('T')[0]);
      }
      
      const { data: activities } = await query;
      
      const activitiesWithProposals = activities?.filter(a => a.proposal_sent === "Sim" || a.proposal_sent === "Yes") || [];
      const activitiesWon = activities?.filter(a => a.deal_outcome === "Ganho" || a.deal_outcome === "Won") || [];
      const activitiesLost = activities?.filter(a => a.deal_outcome === "Perdido" || a.deal_outcome === "Lost") || [];
      const activitiesOpen = activities?.filter(a => !a.deal_outcome || a.deal_outcome === "Em Aberto" || a.deal_outcome === "Open") || [];
      
      const valorTotalVendido = activitiesWon.reduce((sum, a) => sum + (a.sale_value || 0), 0);
      const valorPropostaAberto = activitiesOpen.reduce((sum, a) => sum + (a.proposal_value || 0), 0);
      
      const reunioesRealizadas = activities?.filter(a => a.status === "Reunião Realizada" || a.status === "Completed") || [];
      const noShow = activities?.filter(a => a.status === "No Show") || [];
      const reagendadas = activities?.filter(a => a.status === "Reagendada" || a.status === "Rescheduled") || [];
      const qualificadas = activities?.filter(a => a.qualification === "Qualificado" || a.qualification === "Qualified") || [];
      const desqualificadas = activities?.filter(a => a.qualification === "Não Qualificado" || a.qualification === "Unqualified") || [];
      const reunioesResgatadas = activities?.filter(a => a.reuniao_resgatada === "Sim" || a.reuniao_resgatada === "Yes") || [];
      
      // Performance por canal
      const canais = ["Inbound", "Outbound", "Webinar", "Vanguarda"];
      const perfCanal = canais.map(canal => {
        const atvsCanal = activities?.filter(a => a.channel === canal) || [];
        const reunioesCanal = atvsCanal.filter(a => a.status === "Reunião Realizada" || a.status === "Completed");
        const vendasCanal = atvsCanal.filter(a => a.sale_value && a.sale_value > 0);
        const noShowCanal = atvsCanal.filter(a => a.status === "No Show");
        const valorVendas = vendasCanal.reduce((sum, a) => sum + (a.sale_value || 0), 0);
        
        return {
          canal,
          reunioes: atvsCanal.length,
          vendas: vendasCanal.length,
          noShow: noShowCanal.length,
          valorVendas,
        };
      });
      
      // Etapas de reunião
      const tiposReuniao = ["R1", "R2", "R3", "R4", "R5"];
      const etapas = tiposReuniao.map(tipo => {
        const count = activities?.filter(a => a.type === tipo).length || 0;
        return { tipo, count };
      });
      
      // Evolução do funil
      const evolucoes = [
        { pt: "De R1 para R2", en: "R1 > R2", label: "R1 → R2" },
        { pt: "De R2 para R3", en: "R2 > R3", label: "R2 → R3" },
        { pt: "De R3 para R4", en: "R3 > R4", label: "R3 → R4" },
        { pt: "De R4 para R5", en: "R4 > R5", label: "R4 → R5" },
      ];
      const evol = evolucoes.map(evo => {
        const count = activities?.filter(a => a.evolution === evo.pt || a.evolution === evo.en).length || 0;
        return { evolucao: evo.label, count };
      });
      
      // Ranking de vendas por closer
      const closerSales = new Map<string, { nome: string; vendas: number; valor: number }>();
      
      activitiesWon.forEach(activity => {
        const closerId = activity.closer_id;
        const closerName = activity.closer || "Sem nome";
        const saleValue = activity.sale_value || 0;
        
        if (closerId) {
          if (closerSales.has(closerId)) {
            const current = closerSales.get(closerId)!;
            closerSales.set(closerId, {
              nome: current.nome,
              vendas: current.vendas + 1,
              valor: current.valor + saleValue,
            });
          } else {
            closerSales.set(closerId, {
              nome: closerName,
              vendas: 1,
              valor: saleValue,
            });
          }
        }
      });
      
      const rankingData = Array.from(closerSales.values())
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 5)
        .map((item, index) => ({
          rank: index + 1,
          name: item.nome,
          vendas: item.vendas,
          valor: item.valor,
        }));

      setMetrics({
        valorTotalVendido,
        negociosGanhos: activitiesWon.length,
        propostasEnviadas: activitiesWithProposals.length,
        leadsAtendimento: activities?.length || 0,
        totalReunioes: activities?.length || 0,
        reunioesRealizadas: reunioesRealizadas.length,
        valorPropostaAberto,
        qualificadas: qualificadas.length,
        desqualificadas: desqualificadas.length,
        reagendadas: reagendadas.length,
        noShow: noShow.length,
        reunioesResgatadas: reunioesResgatadas.length,
        perdidas: activitiesLost.length,
      });
      
      setPerformanceCanal(perfCanal);
      setEtapasReuniao(etapas);
      setEvolucaoFunil(evol);
      setRanking(rankingData);
      
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-glow bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground">Visão geral das suas métricas de prospecção</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger className="w-[200px] border-primary/20" data-testid="select-user">
            <SelectValue placeholder="Closer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Usuários</SelectItem>
            {profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.full_name || "Sem nome"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedChannel} onValueChange={setSelectedChannel}>
          <SelectTrigger className="w-[200px] border-primary/20" data-testid="select-channel">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Canais</SelectItem>
            <SelectItem value="Inbound">Inbound</SelectItem>
            <SelectItem value="Outbound">Outbound</SelectItem>
            <SelectItem value="Webinar">Webinar</SelectItem>
            <SelectItem value="Vanguarda">Vanguarda</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-[200px] border-primary/20" data-testid="select-period">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="todos">Todo o período</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-primary text-xl">Carregando métricas...</div>
        </div>
      ) : (
        <>
          {/* Main Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Valor Total Vendido"
              value={formatCurrency(metrics.valorTotalVendido)}
              icon={DollarSign}
            />
            <MetricCard
              title="Negócios Ganhos"
              value={metrics.negociosGanhos}
              icon={TrendingUp}
            />
            <MetricCard
              title="Propostas Enviadas"
              value={metrics.propostasEnviadas}
              icon={FileCheck}
            />
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Leads em Atendimento"
              value={metrics.leadsAtendimento}
              icon={Users}
            />
            <MetricCard
              title="Total de Reuniões"
              value={metrics.totalReunioes}
              icon={Calendar}
            />
            <MetricCard
              title="Reuniões Realizadas"
              value={metrics.reunioesRealizadas}
              icon={Calendar}
            />
            <MetricCard
              title="Valor Proposta em Aberto"
              value={formatCurrency(metrics.valorPropostaAberto)}
              icon={DollarSign}
            />
          </div>

          {/* Status Metrics */}
          <Card className="glass-card border-2 border-primary/10">
            <CardHeader>
              <CardTitle className="text-xl">Status das Reuniões</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-card/50">
                  <div className="text-3xl font-bold text-green-400">{metrics.qualificadas}</div>
                  <div className="text-sm text-muted-foreground mt-1">Qualificadas</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-card/50">
                  <div className="text-3xl font-bold text-red-400">{metrics.desqualificadas}</div>
                  <div className="text-sm text-muted-foreground mt-1">Desqualificadas</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-card/50">
                  <div className="text-3xl font-bold text-yellow-400">{metrics.reagendadas}</div>
                  <div className="text-sm text-muted-foreground mt-1">Reagendadas</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-card/50">
                  <div className="text-3xl font-bold text-orange-400">{metrics.noShow}</div>
                  <div className="text-sm text-muted-foreground mt-1">No Show</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-4 rounded-lg bg-card/50">
                  <div className="text-3xl font-bold text-blue-400">{metrics.reunioesResgatadas}</div>
                  <div className="text-sm text-muted-foreground mt-1">Reuniões Resgatadas</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-card/50">
                  <div className="text-3xl font-bold text-red-400">{metrics.perdidas}</div>
                  <div className="text-sm text-muted-foreground mt-1">Perdidas</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ranking de Vendas */}
          <RankingCard data={ranking} />

          {/* Performance por Canal */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Performance por Canal</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {performanceCanal.map((canal) => (
                <PerformanceCard
                  key={canal.canal}
                  title={canal.canal}
                  reunioes={canal.reunioes}
                  vendas={canal.vendas}
                  noShow={canal.noShow}
                  valorVendas={canal.valorVendas}
                />
              ))}
            </div>
          </div>

          {/* Etapas e Evolução */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HorizontalBarChart
              title="Etapas de Reunião"
              data={etapasReuniao.map(e => ({
                label: e.tipo,
                value: e.count,
                color: "bg-gradient-to-r from-primary to-purple-500"
              }))}
            />
            <HorizontalBarChart
              title="Evolução do Funil"
              data={evolucaoFunil.map(e => ({
                label: e.evolucao,
                value: e.count,
                color: "bg-gradient-to-r from-accent to-pink-500"
              }))}
            />
          </div>
        </>
      )}
    </div>
  );
}
