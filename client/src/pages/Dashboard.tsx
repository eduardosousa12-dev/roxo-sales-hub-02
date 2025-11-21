import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import MetricCard from "@/components/MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, DollarSign, FileCheck, Users, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load activities data
      const { data: activities } = await supabase
        .from("activities")
        .select("*");
      
      const activitiesWithSales = activities?.filter(a => a.sale_value && a.sale_value > 0) || [];
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
      const evolucoes = ["R1 > R2", "R2 > R3", "R3 > R4", "R4 > R5"];
      const evol = evolucoes.map(evo => {
        const count = activities?.filter(a => a.evolution === evo).length || 0;
        return { evolucao: evo, count };
      });
      
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
        <Select defaultValue="todos-usuarios">
          <SelectTrigger className="w-[200px] border-primary/20">
            <SelectValue placeholder="Closer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos-usuarios">Todos os Usuários</SelectItem>
          </SelectContent>
        </Select>
        
        <Select defaultValue="todos-canais">
          <SelectTrigger className="w-[200px] border-primary/20">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos-canais">Todos os Canais</SelectItem>
            <SelectItem value="inbound">Inbound</SelectItem>
            <SelectItem value="outbound">Outbound</SelectItem>
            <SelectItem value="webinar">Webinar</SelectItem>
            <SelectItem value="vanguarda">Vanguarda</SelectItem>
          </SelectContent>
        </Select>
        
        <Select defaultValue="7-dias">
          <SelectTrigger className="w-[200px] border-primary/20">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7-dias">Últimos 7 dias</SelectItem>
            <SelectItem value="30-dias">Últimos 30 dias</SelectItem>
            <SelectItem value="90-dias">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Valor Total Vendido"
          value={formatCurrency(metrics.valorTotalVendido)}
          icon={DollarSign}
          className="md:col-span-1"
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <MetricCard title="Leads em Atendimento" value={metrics.leadsAtendimento} />
        <MetricCard title="Total de Reuniões" value={metrics.totalReunioes} />
        <MetricCard title="Reuniões Realizadas" value={metrics.reunioesRealizadas} />
        <MetricCard title="Valor Proposta em Aberto" value={formatCurrency(metrics.valorPropostaAberto)} />
        <MetricCard title="Qualificadas" value={metrics.qualificadas} />
        <MetricCard title="Desqualificadas" value={metrics.desqualificadas} />
        <MetricCard title="Reagendadas" value={metrics.reagendadas} />
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="No Show" value={metrics.noShow} />
        <MetricCard title="Reuniões Resgatadas" value={metrics.reunioesResgatadas} />
        <MetricCard title="Perdidas" value={metrics.perdidas} />
      </div>

      {/* Performance por Canal */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Performance por Canal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {performanceCanal.map((canal) => (
              <div key={canal.canal} className="space-y-2">
                <h3 className="font-semibold text-primary">{canal.canal}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reuniões:</span>
                    <span className="font-medium">{canal.reunioes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vendas:</span>
                    <span className="font-medium">{canal.vendas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">No Show:</span>
                    <span className="font-medium">{canal.noShow}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor Vendas:</span>
                    <span className="font-medium text-primary">{formatCurrency(canal.valorVendas)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Etapas de Reunião */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Etapas de Reunião
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={etapasReuniao}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="tipo" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Evolução do Funil */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução do Funil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={evolucaoFunil}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="evolucao" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--purple-glow))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
