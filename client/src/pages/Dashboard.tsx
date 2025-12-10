import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import MetricCard from "@/components/MetricCard";
import HorizontalBarChart from "@/components/HorizontalBarChart";
import PerformanceCard from "@/components/PerformanceCard";
import RankingCard from "@/components/RankingCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, DollarSign, FileCheck, Users, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string | null;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("todos");
  const [selectedChannel, setSelectedChannel] = useState<string>("todos");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("todos");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const mountedRef = useRef(true);
  // Contador de requisições para ignorar respostas obsoletas
  const requestIdRef = useRef(0);
  
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

  // Cleanup ao desmontar
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Invalidar qualquer requisição pendente
      requestIdRef.current++;
    };
  }, []);

  // Auto F5 se ficar carregando por mais de 3 segundos
  useEffect(() => {
    if (!loading) return;

    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log("⏱️ Timeout de 3 segundos atingido, recarregando página...");
        window.location.reload();
      }
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [loading]);

  // Auto-refresh (F5) quando o usuário volta para a janela após 30+ segundos
  useEffect(() => {
    let hiddenAt: number | null = null;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
      } else if (document.visibilityState === 'visible' && hiddenAt) {
        const timeAway = Date.now() - hiddenAt;
        // Se ficou fora por mais de 1 segundo, dar F5
        if (timeAway > 100) {
          console.log(`🔄 Usuário voltou após ${Math.round(timeAway / 1000)}s, recarregando página...`);
          window.location.reload();
        }
        hiddenAt = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Carregar profiles apenas uma vez quando o usuário autenticar
  useEffect(() => {
    if (authLoading || !user) return;
    console.log("✅ Dashboard: Autenticado, carregando profiles...");
    loadProfiles();
  }, [authLoading, user]);

  // Carregar dados do dashboard quando filtros mudarem ou usuário autenticar
  useEffect(() => {
    if (authLoading || !user) {
      console.log("⏳ Dashboard: Aguardando autenticação...");
      return;
    }
    // Se for personalizado, só carrega quando ambas as datas estiverem preenchidas
    if (selectedPeriod === "personalizado" && (!customStartDate || !customEndDate)) {
      return;
    }
    console.log("✅ Dashboard: Carregando métricas...");
    loadDashboardData();
  }, [selectedUser, selectedChannel, selectedPeriod, customStartDate, customEndDate, authLoading, user]);

  const loadProfiles = async () => {
    try {
      console.log("👥 Carregando profiles...");
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name");
      
      if (error) {
        console.error("❌ Erro ao carregar profiles:", error);
        toast.error(`Erro ao carregar perfis: ${error.message}`);
        return;
      }
      
      console.log("✅ Profiles carregados:", data?.length || 0);
      setProfiles(data || []);
    } catch (error: any) {
      console.error("❌ Erro crítico ao carregar profiles:", error);
      toast.error(`Erro ao carregar perfis: ${error?.message || 'Erro desconhecido'}`);
    }
  };

  const loadDashboardData = async () => {
    // Incrementar contador para invalidar requisições anteriores
    const currentRequestId = ++requestIdRef.current;
    console.log(`🔍 [Request ${currentRequestId}] Carregando dashboard para:`, user?.email);

    try {
      setLoading(true);
      console.log(`⏱️ [Request ${currentRequestId}] Iniciando query...`);

      // Query simples e direta - aumentar limite do Supabase (default é 1000)
      const { data: activities, error, count } = await supabase
        .from("activities")
        .select("*", { count: "exact" })
        .limit(10000);

      // Verificar se esta requisição ainda é válida
      if (currentRequestId !== requestIdRef.current) {
        console.log(`⚠️ [Request ${currentRequestId}] Requisição obsoleta, ignorando (atual: ${requestIdRef.current})`);
        return;
      }

      // Verificar se componente ainda está montado
      if (!mountedRef.current) {
        console.log(`⚠️ [Request ${currentRequestId}] Componente desmontado, ignorando resultado`);
        return;
      }

      console.log(`📊 [Request ${currentRequestId}] Query retornou:`, { activities: activities?.length, totalCount: count, error });

      if (error) {
        console.error(`❌ [Request ${currentRequestId}] Erro ao carregar activities:`, error);
        toast.error(`Erro ao carregar dados: ${error.message}`);
        setLoading(false);
        return;
      }

      console.log(`✅ [Request ${currentRequestId}] Activities carregadas:`, activities?.length || 0);

      if (!activities || activities.length === 0) {
        console.warn(`⚠️ [Request ${currentRequestId}] Nenhuma atividade encontrada`);
        toast.info("Nenhuma atividade cadastrada ainda. Vá em 'Diário' para adicionar.");
        setActivities([]);
        setMetrics({
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
        setPerformanceCanal([]);
        setEtapasReuniao([]);
        setEvolucaoFunil([]);
        setRanking([]);
        setLoading(false);
        return;
      }
      
      console.log(`📊 [Request ${currentRequestId}] Primeira atividade:`, activities[0]);
      console.log(`📋 [Request ${currentRequestId}] Campos disponíveis:`, Object.keys(activities[0]));

      // Aplicar filtros
      let filteredActivities = [...activities];

      // Filtro por usuário (closer)
      if (selectedUser !== "todos") {
        filteredActivities = filteredActivities.filter(a => a.closer_id === selectedUser);
        console.log(`🔍 Filtro por usuário: ${filteredActivities.length} atividades`);
      }

      // Filtro por canal
      if (selectedChannel !== "todos") {
        filteredActivities = filteredActivities.filter(a => a.channel === selectedChannel);
        console.log(`🔍 Filtro por canal: ${filteredActivities.length} atividades`);
      }

      // Filtro por período
      if (selectedPeriod !== "todos") {
        let startDate: string;
        let endDate: string = new Date().toISOString().split('T')[0];

        if (selectedPeriod === "esse_mes") {
          // Primeiro dia do mês atual
          const now = new Date();
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          console.log(`🔍 Filtro: Esse mês (${startDate} a ${endDate})`);
        } else if (selectedPeriod === "mes_passado") {
          // Primeiro e último dia do mês passado
          const now = new Date();
          const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
          startDate = firstDayLastMonth.toISOString().split('T')[0];
          endDate = lastDayLastMonth.toISOString().split('T')[0];
          console.log(`🔍 Filtro: Mês passado (${startDate} a ${endDate})`);
        } else if (selectedPeriod === "personalizado") {
          // Datas personalizadas
          startDate = customStartDate;
          endDate = customEndDate;
          console.log(`🔍 Filtro: Personalizado (${startDate} a ${endDate})`);
        } else {
          // Últimos X dias
          const days = parseInt(selectedPeriod);
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - days);
          startDate = cutoffDate.toISOString().split('T')[0];
          console.log(`🔍 Filtro por período (${days} dias): desde ${startDate}`);
        }

        filteredActivities = filteredActivities.filter(a => {
          const activityDate = a.date || a.created_at?.split('T')[0];
          return activityDate >= startDate && activityDate <= endDate;
        });
        console.log(`🔍 Atividades após filtro de período: ${filteredActivities.length}`);
      }

      console.log(`📊 [Request ${currentRequestId}] Atividades após filtros: ${filteredActivities.length}`);

      // Processar dados filtrados
      setActivities(filteredActivities);

      // Log dos valores únicos para debug
      const uniqueOutcomes = [...new Set(filteredActivities.map(a => a.deal_outcome).filter(Boolean))];
      const uniqueStatus = [...new Set(filteredActivities.map(a => a.status).filter(Boolean))];
      const uniqueQualification = [...new Set(filteredActivities.map(a => a.qualification).filter(Boolean))];
      const uniqueProposalSent = [...new Set(filteredActivities.map(a => a.proposal_sent).filter(Boolean))];
      const uniqueResgat = [...new Set(filteredActivities.map(a => a.reuniao_resgatada).filter(Boolean))];

      console.log(`🏷️ Valores únicos:`, {
        deal_outcome: uniqueOutcomes,
        status: uniqueStatus,
        qualification: uniqueQualification,
        proposal_sent: uniqueProposalSent,
        reuniao_resgatada: uniqueResgat,
      });

      const activitiesWithProposals = filteredActivities.filter(a => a.proposal_sent === "Sim" || a.proposal_sent === "Yes" || a.proposal_sent === true) || [];
      console.log("📝 Com propostas:", activitiesWithProposals.length);

      // Negócios ganhos - verificar múltiplos formatos
      const activitiesWon = filteredActivities.filter(a => {
        const outcome = (a.deal_outcome || "").toLowerCase().trim();
        // Valores possíveis: "Ganha", "Ganho", "Won", "Fechado", "Venda"
        return outcome === "ganha" || outcome.includes("ganho") || outcome.includes("won") || outcome === "fechado" || outcome.includes("venda");
      }) || [];
      console.log(`🏆 Negócios ganhos: ${activitiesWon.length}`, activitiesWon.slice(0, 3).map(a => ({ outcome: a.deal_outcome, value: a.sale_value })));

      // Negócios perdidos
      const activitiesLost = filteredActivities.filter(a => {
        const outcome = (a.deal_outcome || "").toLowerCase().trim();
        // Valores possíveis: "Perdida", "Perda", "Perdido", "Lost"
        return outcome === "perdida" || outcome === "perda" || outcome.includes("perdido") || outcome.includes("lost");
      }) || [];
      console.log(`❌ Negócios perdidos: ${activitiesLost.length}`);

      const activitiesOpen = filteredActivities.filter(a => !a.deal_outcome || a.deal_outcome === "Em Aberto" || a.deal_outcome === "Open") || [];
      
      const valorTotalVendido = activitiesWon.reduce((sum, a) => sum + (a.sale_value || 0), 0);
      console.log(`💰 Valor total vendido: R$ ${valorTotalVendido}`);
      const valorPropostaAberto = activitiesOpen.reduce((sum, a) => sum + (a.proposal_value || 0), 0);

      const reunioesRealizadas = filteredActivities.filter(a => a.status === "Reunião Realizada" || a.status === "Completed") || [];
      const noShow = filteredActivities.filter(a => a.status === "No Show") || [];
      const reagendadas = filteredActivities.filter(a => {
        const status = (a.status || "").toLowerCase().trim();
        return status.includes("reagendada") || status.includes("rescheduled");
      }) || [];
      const qualificadas = filteredActivities.filter(a => a.qualification === "Qualificado" || a.qualification === "Qualified") || [];
      const desqualificadas = filteredActivities.filter(a => a.qualification === "Não Qualificado" || a.qualification === "Unqualified") || [];
      const reunioesResgatadas = filteredActivities.filter(a => a.reuniao_resgatada === "Sim" || a.reuniao_resgatada === "Yes") || [];

      // Performance por canal
      const canais = ["Inbound", "Outbound", "Webinar", "Vanguarda"];
      const perfCanal = canais.map(canal => {
        const atvsCanal = filteredActivities.filter(a => a.channel === canal) || [];
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
        const count = filteredActivities.filter(a => a.type === tipo).length || 0;
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
        const count = filteredActivities.filter(a => a.evolution === evo.pt || a.evolution === evo.en).length || 0;
        return { evolucao: evo.label, count };
      });

      // Ranking de vendas por closer
      const closerSales = new Map<string, { nome: string; vendas: number; valor: number }>();

      // Se não houver atividades ganhas, considerar todas com sale_value > 0
      const activitiesForRanking = activitiesWon.length > 0
        ? activitiesWon
        : filteredActivities.filter(a => a.sale_value && a.sale_value > 0) || [];
      
      activitiesForRanking.forEach(activity => {
        const closerId = activity.closer_id;
        const closerName = activity.closer || "Sem nome";
        const saleValue = activity.sale_value || 0;
        
        if (closerId && saleValue > 0) {
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

      // Verificar novamente antes de atualizar estado (processamento pode ter demorado)
      if (currentRequestId !== requestIdRef.current || !mountedRef.current) {
        console.log(`⚠️ [Request ${currentRequestId}] Dados processados mas requisição obsoleta`);
        return;
      }

      setMetrics({
        valorTotalVendido,
        negociosGanhos: activitiesWon.length,
        propostasEnviadas: activitiesWithProposals.length,
        leadsAtendimento: filteredActivities.length,
        totalReunioes: filteredActivities.length,
        reunioesRealizadas: reunioesRealizadas.length,
        valorPropostaAberto,
        qualificadas: qualificadas.length,
        desqualificadas: desqualificadas.length,
        reagendadas: reagendadas.length,
        noShow: noShow.length,
        reunioesResgatadas: reunioesResgatadas.length,
        perdidas: activitiesLost.length,
      });

      console.log(`📈 Métricas calculadas:`, {
        valorTotalVendido,
        negociosGanhos: activitiesWon.length,
        perdidas: activitiesLost.length,
        totalAtividades: filteredActivities.length,
      });
      
      setPerformanceCanal(perfCanal);
      setEtapasReuniao(etapas);
      setEvolucaoFunil(evol);
      setRanking(rankingData);

      console.log(`✅ [Request ${currentRequestId}] Dashboard carregado com sucesso`);
      setLoading(false);
    } catch (error: any) {
      // Verificar se esta requisição ainda é válida antes de atualizar estado
      if (currentRequestId !== requestIdRef.current || !mountedRef.current) {
        return;
      }
      console.error(`❌ [Request ${currentRequestId}] Erro ao carregar dashboard:`, error);
      toast.error(`Erro ao carregar dashboard: ${error?.message || 'Erro desconhecido'}`);
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
        <p className="text-foreground/80">Visão geral das suas métricas de prospecção</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger className="w-[200px] border-primary/20" data-testid="select-user">
            <SelectValue placeholder="Closer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Usuários</SelectItem>
            {profiles
              .filter(profile => profile.full_name && profile.full_name.trim() !== "")
              .map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.full_name}
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
            <SelectItem value="todos">Máximo</SelectItem>
            <SelectItem value="esse_mes">Esse mês</SelectItem>
            <SelectItem value="mes_passado">Mês passado</SelectItem>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="personalizado">Personalizado</SelectItem>
          </SelectContent>
        </Select>

        {selectedPeriod === "personalizado" && (
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-2 rounded-md border border-primary/20 bg-background text-foreground"
              placeholder="Data inicial"
            />
            <span className="text-foreground/60">até</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-2 rounded-md border border-primary/20 bg-background text-foreground"
              placeholder="Data final"
            />
          </div>
        )}
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
                  <div className="text-3xl font-bold text-green-200">{metrics.qualificadas}</div>
                  <div className="text-sm text-foreground mt-1">Qualificadas</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-card/50">
                  <div className="text-3xl font-bold text-red-400">{metrics.desqualificadas}</div>
                  <div className="text-sm text-foreground mt-1">Desqualificadas</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-card/50">
                  <div className="text-3xl font-bold text-yellow-400">{metrics.reagendadas}</div>
                  <div className="text-sm text-foreground mt-1">Reagendadas</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-card/50">
                  <div className="text-3xl font-bold text-orange-400">{metrics.noShow}</div>
                  <div className="text-sm text-foreground mt-1">No Show</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-4 rounded-lg bg-card/50">
                  <div className="text-3xl font-bold text-blue-400">{metrics.reunioesResgatadas}</div>
                  <div className="text-sm text-foreground mt-1">Reuniões Resgatadas</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-card/50">
                  <div className="text-3xl font-bold text-red-400">{metrics.perdidas}</div>
                  <div className="text-sm text-foreground mt-1">Perdidas</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ranking de Vendas */}
          <RankingCard data={ranking} />

          {/* Performance por Canal */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Performance por Canal</h2>
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
