import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Calendar, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string | null;
}

interface Activity {
  id: number;
  date: string | null;
  closer: string | null;
  closer_id: string | null;
  lead: string | null;
  bdr: string | null;
  channel: string | null;
  type: string | null;
  status: string | null;
  evolution: string | null;
  sale_value: number | null;
  proposal_value: number | null;
  qualification: string | null;
  deal_outcome: string | null;
  notes: string | null;
  proposal_sent: string | null;
  reuniao_resgatada: string | null;
}

export default function Historico() {
  const { user, loading: authLoading } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de edição
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [editForm, setEditForm] = useState<Partial<Activity>>({});
  const [saving, setSaving] = useState(false);

  // Search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [searchLead, setSearchLead] = useState("");
  const [searchCloser, setSearchCloser] = useState("");
  const [searchBdr, setSearchBdr] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [channelFilter, setChannelFilter] = useState("todos");
  const [periodFilter, setPeriodFilter] = useState("todos");
  const [closerFilter, setCloserFilter] = useState("todos");
  const [bdrFilter, setBdrFilter] = useState("todos");
  const [qualificationFilter, setQualificationFilter] = useState("todos");
  const [outcomeFilter, setOutcomeFilter] = useState("todos");

  // Table column filters
  const [filterData, setFilterData] = useState("");
  const [filterCloser, setFilterCloser] = useState("todos");
  const [filterBdr, setFilterBdr] = useState("");
  const [filterLead, setFilterLead] = useState("");
  const [filterCanal, setFilterCanal] = useState("todos");
  const [filterFaturamento, setFilterFaturamento] = useState("todos");
  const [filterQualificacao, setFilterQualificacao] = useState("todos");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterReuniaoResgatada, setFilterReuniaoResgatada] = useState("todos");
  const [filterResultado, setFilterResultado] = useState("todos");
  const [filterVlrProposta, setFilterVlrProposta] = useState("");
  const [filterVlrVenda, setFilterVlrVenda] = useState("");
  const [filterNotas, setFilterNotas] = useState("");

  // Meeting type checkboxes (R1-R5)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["R1", "R2", "R3", "R4", "R5"]);

  useEffect(() => {
    if (authLoading || !user) return;

    setError(null);
    loadProfiles();
    loadActivities();
  }, [authLoading, user]);

  const loadProfiles = async () => {
    try {
      const { data, error: err } = await supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name");

      if (err) throw err;
      setProfiles(data || []);
    } catch (err) {
      console.error("Error loading profiles:", err);
      setError("Erro ao carregar perfis de usuários");
    }
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: err } = await supabase
        .from("activities")
        .select("*")
        .order("date", { ascending: false });

      if (err) throw err;

      setActivities(data || []);
    } catch (err: any) {
      console.error("Error loading activities:", err);
      setError(err?.message || "Erro ao carregar atividades");
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (activity: Activity) => {
    setSelectedActivity(activity);
    setEditForm({
      date: activity.date || "",
      lead: activity.lead || "",
      bdr: activity.bdr || "",
      channel: activity.channel || "",
      qualification: activity.qualification || "",
      type: activity.type || "",
      status: activity.status || "",
      proposal_sent: activity.proposal_sent || "",
      rescued_meeting: activity.reuniao_resgatada || "",
      evolution: activity.evolution || "",
      proposal_value: activity.proposal_value,
      notes: activity.notes || "",
    });
  };

  const closeEditModal = () => {
    setSelectedActivity(null);
    setEditForm({});
  };

  const saveActivity = async () => {
    if (!selectedActivity) return;

    try {
      setSaving(true);

      // Construir objeto apenas com campos que foram alterados e existem
      const updateData: Record<string, any> = {};

      if (editForm.date !== undefined) updateData.date = editForm.date || null;
      if (editForm.lead !== undefined) updateData.lead = editForm.lead || null;
      if (editForm.bdr !== undefined) updateData.bdr = editForm.bdr || null;
      if (editForm.channel !== undefined) updateData.channel = editForm.channel || null;
      if (editForm.qualification !== undefined) updateData.qualification = editForm.qualification || null;
      if (editForm.type !== undefined) updateData.type = editForm.type || null;
      if (editForm.status !== undefined) updateData.status = editForm.status || null;
      if (editForm.proposal_sent !== undefined) updateData.proposal_sent = editForm.proposal_sent || null;
      if (editForm.rescued_meeting !== undefined) updateData.reuniao_resgatada = editForm.rescued_meeting || null;
      if (editForm.evolution !== undefined) updateData.evolution = editForm.evolution || null;
      if (editForm.proposal_value !== undefined) {
        const newProposalValue = editForm.proposal_value ? Number(editForm.proposal_value) : null;
        updateData.proposal_value = newProposalValue;

        // Se a venda já foi marcada como ganha, também atualizar o sale_value
        const outcome = (selectedActivity.deal_outcome || "").toLowerCase();
        if (outcome === "ganha" || outcome === "ganho") {
          updateData.sale_value = newProposalValue;
        }
      }
      if (editForm.notes !== undefined) updateData.notes = editForm.notes || null;

      console.log("📝 Atualizando atividade:", selectedActivity.id, updateData);

      const { error } = await supabase
        .from("activities")
        .update(updateData)
        .eq("id", selectedActivity.id);

      if (error) {
        console.error("Erro Supabase:", error);
        throw error;
      }

      toast.success("Atividade atualizada com sucesso!");
      closeEditModal();
      loadActivities();
    } catch (error: any) {
      console.error("Error saving activity:", error);
      toast.error(`Erro ao salvar: ${error?.message || "Erro desconhecido"}`);
    } finally {
      setSaving(false);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSearchLead("");
    setSearchCloser("");
    setSearchBdr("");
    setStatusFilter("todos");
    setChannelFilter("todos");
    setPeriodFilter("todos");
    setCloserFilter("todos");
    setBdrFilter("todos");
    setQualificationFilter("todos");
    setOutcomeFilter("todos");
    setSelectedTypes(["R1", "R2", "R3", "R4", "R5"]);
    setFilterData("");
    setFilterCloser("todos");
    setFilterBdr("");
    setFilterLead("");
    setFilterCanal("todos");
    setFilterFaturamento("todos");
    setFilterQualificacao("todos");
    setFilterStatus("todos");
    setFilterReuniaoResgatada("todos");
    setFilterResultado("todos");
    setFilterVlrProposta("");
    setFilterVlrVenda("");
    setFilterNotas("");
  };

  const normalizeStatus = (status: string | null): string => {
    if (!status) return "";
    const normalized = status.toLowerCase();
    if (normalized.includes("reunião") || normalized.includes("completed")) return "completed";
    if (normalized.includes("no show")) return "no-show";
    if (normalized.includes("reagendada") || normalized.includes("rescheduled")) return "rescheduled";
    if (normalized.includes("andamento") || normalized.includes("progress")) return "progress";
    return normalized;
  };

  const normalizeOutcome = (outcome: string | null): string => {
    if (!outcome) return "";
    const normalized = outcome.toLowerCase();
    if (normalized.includes("ganho") || normalized.includes("ganha") || normalized.includes("won")) return "won";
    if (normalized.includes("perdido") || normalized.includes("perdida") || normalized.includes("lost")) return "lost";
    if (normalized.includes("aberto") || normalized.includes("open")) return "open";
    return normalized;
  };

  const getStatusColor = (status: string | null) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case "completed":
        return "bg-green-500/20 text-green-400";
      case "no-show":
        return "bg-red-500/20 text-red-400";
      case "rescheduled":
        return "bg-yellow-500/20 text-yellow-400";
      case "progress":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-purple-500/20 text-purple-400";
    }
  };

  const getOutcomeColor = (outcome: string | null) => {
    const normalized = normalizeOutcome(outcome);
    switch (normalized) {
      case "won":
        return "bg-green-500/20 text-green-400";
      case "lost":
        return "bg-red-500/20 text-red-400";
      case "open":
        return "bg-blue-500/20 text-blue-400";
      default:
        return "bg-purple-500/20 text-purple-400";
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  const uniqueStatusesNormalized = Array.from(
    new Set(
      (activities || [])
        .map(a => normalizeStatus(a.status))
        .filter(Boolean)
    )
  );

  const statusOptions = uniqueStatusesNormalized.map(normalized => {
    const example = activities.find(a => normalizeStatus(a.status) === normalized);
    return { value: example?.status || normalized, normalized };
  });

  // Get unique values for dropdowns
  const uniqueChannels = Array.from(new Set((activities || []).map(a => a.channel).filter(Boolean)));
  const uniqueBdrs = Array.from(new Set((activities || []).map(a => a.bdr).filter(Boolean)));
  const uniqueQualifications = Array.from(new Set((activities || []).map(a => a.qualification).filter(Boolean)));
  const uniqueOutcomes = Array.from(new Set((activities || []).map(a => a.deal_outcome).filter(Boolean)));

  const filteredActivities = (activities || []).filter(activity => {
    // General search
    const matchesGeneralSearch = !searchTerm ||
      activity.lead?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.closer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.bdr?.toLowerCase().includes(searchTerm.toLowerCase());

    // Specific searches
    const matchesLeadSearch = !searchLead ||
      activity.lead?.toLowerCase().includes(searchLead.toLowerCase());

    const matchesCloserSearch = !searchCloser ||
      activity.closer?.toLowerCase().includes(searchCloser.toLowerCase());

    const matchesBdrSearch = !searchBdr ||
      activity.bdr?.toLowerCase().includes(searchBdr.toLowerCase());

    // Dropdown filters
    const matchesStatus = statusFilter === "todos" ||
      normalizeStatus(activity.status) === normalizeStatus(statusFilter);

    const matchesChannel = channelFilter === "todos" ||
      activity.channel === channelFilter;

    const matchesCloser = closerFilter === "todos" ||
      activity.closer === closerFilter;

    const matchesBdr = bdrFilter === "todos" ||
      activity.bdr === bdrFilter;

    const matchesQualification = qualificationFilter === "todos" ||
      (activity.qualification?.toLowerCase().includes(qualificationFilter.toLowerCase()));

    const matchesOutcome = outcomeFilter === "todos" ||
      (activity.deal_outcome && normalizeOutcome(activity.deal_outcome) === normalizeOutcome(outcomeFilter));

    // Meeting type checkboxes (R1-R5)
    const matchesType = !activity.type ||
      !["R1", "R2", "R3", "R4", "R5"].includes(activity.type) ||
      selectedTypes.includes(activity.type);

    // Period filter
    const matchesPeriod = periodFilter === "todos" || (() => {
      if (!activity.date) return false;
      const daysAgo = parseInt(periodFilter);
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - daysAgo);
      return new Date(activity.date) >= dateFrom;
    })();

    return matchesGeneralSearch && matchesLeadSearch && matchesCloserSearch &&
           matchesBdrSearch && matchesStatus && matchesChannel && matchesCloser &&
           matchesBdr && matchesQualification && matchesOutcome && matchesType && matchesPeriod;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-glow bg-clip-text text-transparent">
          Histórico de Atividades
        </h1>
        <p className="text-foreground/80">Visualize todas as atividades e reuniões realizadas</p>
      </div>

      {/* Extensive Filter Panel */}
      <Card className="glass-card border-2 border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros Avançados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* General Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/70" />
            <Input
              placeholder="Busca geral (lead, closer ou BDR)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-primary/20"
              data-testid="input-search-general"
            />
          </div>

          {/* Specific Searches */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Buscar por Lead..."
              value={searchLead}
              onChange={(e) => setSearchLead(e.target.value)}
              className="border-primary/20"
              data-testid="input-search-lead"
            />
            <Input
              placeholder="Buscar por Closer..."
              value={searchCloser}
              onChange={(e) => setSearchCloser(e.target.value)}
              className="border-primary/20"
              data-testid="input-search-closer"
            />
            <Input
              placeholder="Buscar por BDR..."
              value={searchBdr}
              onChange={(e) => setSearchBdr(e.target.value)}
              className="border-primary/20"
              data-testid="input-search-bdr"
            />
          </div>

          {/* Meeting Type Checkboxes (R1-R5) */}
          <div>
            <label className="text-sm font-medium mb-3 block text-foreground">Tipos de Reunião</label>
            <div className="flex gap-6 flex-wrap">
              {["R1", "R2", "R3", "R4", "R5"].map(type => (
                <div key={type} className="flex items-center gap-2">
                  <Checkbox
                    id={`checkbox-${type}`}
                    checked={selectedTypes.includes(type)}
                    onCheckedChange={() => toggleType(type)}
                    data-testid={`checkbox-type-${type.toLowerCase()}`}
                  />
                  <label
                    htmlFor={`checkbox-${type}`}
                    className="text-sm font-medium cursor-pointer text-foreground"
                  >
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Dropdown Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="xl:col-span-4 flex justify-end">
              <Button
                onClick={clearAllFilters}
                variant="outline"
                className="border-primary/20"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="border-primary/20" data-testid="select-channel">
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Canais</SelectItem>
                {uniqueChannels.map(channel => (
                  <SelectItem key={channel} value={channel}>{channel}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="border-primary/20" data-testid="select-period">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todo o período</SelectItem>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>

            <Select value={closerFilter} onValueChange={setCloserFilter}>
              <SelectTrigger className="border-primary/20" data-testid="select-closer-filter">
                <SelectValue placeholder="Closer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Closers</SelectItem>
                {profiles
                  .filter(profile => profile.full_name && profile.full_name.trim() !== "")
                  .map(profile => (
                    <SelectItem key={profile.id} value={profile.full_name!}>
                      {profile.full_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            <Select value={bdrFilter} onValueChange={setBdrFilter}>
              <SelectTrigger className="border-primary/20" data-testid="select-bdr-filter">
                <SelectValue placeholder="BDR" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os BDRs</SelectItem>
                {uniqueBdrs.map(bdr => (
                  <SelectItem key={bdr} value={bdr}>{bdr}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-primary/20" data-testid="select-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.normalized} value={opt.value}>{opt.value}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={qualificationFilter} onValueChange={setQualificationFilter}>
              <SelectTrigger className="border-primary/20" data-testid="select-qualification">
                <SelectValue placeholder="Qualificação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                {uniqueQualifications.map(qual => (
                  <SelectItem key={qual} value={qual}>{qual}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
              <SelectTrigger className="border-primary/20" data-testid="select-outcome">
                <SelectValue placeholder="Resultado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {uniqueOutcomes.map(outcome => (
                  <SelectItem key={outcome} value={outcome}>{outcome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activities Table */}
      <Card className="glass-card border-2 border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Atividades ({filteredActivities.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="text-red-400 text-xl mb-2">Erro ao carregar dados</div>
              <div className="text-foreground/70 mb-4">{error}</div>
              <Button onClick={loadActivities} variant="outline">
                Tentar Novamente
              </Button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-pulse text-primary text-xl">Carregando histórico...</div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center text-foreground/70 py-12">
              Nenhuma atividade encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Input
                        type="date"
                        placeholder="Data"
                        value={filterData}
                        onChange={(e) => setFilterData(e.target.value)}
                        className="h-8 w-full border-primary/20 text-foreground"
                      />
                      <div className="text-xs text-foreground/70 mt-1">DATA</div>
                    </TableHead>
                    <TableHead>
                      <Select value={filterCloser} onValueChange={setFilterCloser}>
                        <SelectTrigger className="h-8 border-primary/20">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          {profiles
                            .filter(profile => profile.full_name && profile.full_name.trim() !== "")
                            .map(profile => (
                              <SelectItem key={profile.id} value={profile.full_name!}>
                                {profile.full_name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <div className="text-xs text-foreground/70 mt-1">CLOSER</div>
                    </TableHead>
                    <TableHead>
                      <Input
                        placeholder="Filtrar..."
                        value={filterBdr}
                        onChange={(e) => setFilterBdr(e.target.value)}
                        className="h-8 w-full border-primary/20 text-foreground"
                      />
                      <div className="text-xs text-foreground/70 mt-1">BDR</div>
                    </TableHead>
                    <TableHead>
                      <Input
                        placeholder="Filtrar..."
                        value={filterLead}
                        onChange={(e) => setFilterLead(e.target.value)}
                        className="h-8 w-full border-primary/20 text-foreground"
                      />
                      <div className="text-xs text-foreground/70 mt-1">LEAD</div>
                    </TableHead>
                    <TableHead>
                      <Select value={filterCanal} onValueChange={setFilterCanal}>
                        <SelectTrigger className="h-8 border-primary/20">
                          <SelectValue placeholder="Todo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todo</SelectItem>
                          {uniqueChannels.map(channel => (
                            <SelectItem key={channel} value={channel}>{channel}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="text-xs text-foreground/70 mt-1">CANAL</div>
                    </TableHead>
                    <TableHead>
                      <Select value={filterFaturamento} onValueChange={setFilterFaturamento}>
                        <SelectTrigger className="h-8 border-primary/20">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="text-xs text-foreground/70 mt-1">FATURAMENTO</div>
                    </TableHead>
                    <TableHead>
                      <Select value={filterQualificacao} onValueChange={setFilterQualificacao}>
                        <SelectTrigger className="h-8 border-primary/20">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          {uniqueQualifications.map(qual => (
                            <SelectItem key={qual} value={qual}>{qual}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="text-xs text-foreground/70 mt-1">QUALIFICAÇÃO</div>
                    </TableHead>
                    <TableHead>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="h-8 border-primary/20">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          {statusOptions.map(opt => (
                            <SelectItem key={opt.normalized} value={opt.value}>{opt.value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="text-xs text-foreground/70 mt-1">STATUS</div>
                    </TableHead>
                    <TableHead>
                      <Select value={filterReuniaoResgatada} onValueChange={setFilterReuniaoResgatada}>
                        <SelectTrigger className="h-8 border-primary/20">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos</SelectItem>
                          <SelectItem value="Sim">Sim</SelectItem>
                          <SelectItem value="Não">Não</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="text-xs text-foreground/70 mt-1">REUNIÃO RESGATADA</div>
                    </TableHead>
                    <TableHead>
                      <Select value={filterResultado} onValueChange={setFilterResultado}>
                        <SelectTrigger className="h-8 border-primary/20">
                          <SelectValue placeholder="Todo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todo</SelectItem>
                          {uniqueOutcomes.map(outcome => (
                            <SelectItem key={outcome} value={outcome}>{outcome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="text-xs text-foreground/70 mt-1">RESULTADO</div>
                    </TableHead>
                    <TableHead className="text-right">
                      <Input
                        type="number"
                        placeholder="Vlr. Proposta"
                        value={filterVlrProposta}
                        onChange={(e) => setFilterVlrProposta(e.target.value)}
                        className="h-8 w-full border-primary/20 text-foreground"
                      />
                      <div className="text-xs text-foreground/70 mt-1">VLR. PROPOSTA</div>
                    </TableHead>
                    <TableHead className="text-right">
                      <Input
                        type="number"
                        placeholder="Vlr. Venda"
                        value={filterVlrVenda}
                        onChange={(e) => setFilterVlrVenda(e.target.value)}
                        className="h-8 w-full border-primary/20 text-foreground"
                      />
                      <div className="text-xs text-foreground/70 mt-1">VLR. VENDA</div>
                    </TableHead>
                    <TableHead>
                      <Input
                        placeholder="Filtrar"
                        value={filterNotas}
                        onChange={(e) => setFilterNotas(e.target.value)}
                        className="h-8 w-full border-primary/20 text-foreground"
                      />
                      <div className="text-xs text-foreground/70 mt-1">NOTAS</div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.filter(activity => {
                    // Apply table column filters
                    if (filterData && activity.date) {
                      const filterDate = new Date(filterData).toISOString().split('T')[0];
                      const activityDate = new Date(activity.date).toISOString().split('T')[0];
                      if (activityDate !== filterDate) return false;
                    }
                    if (filterCloser !== "todos" && activity.closer !== filterCloser) return false;
                    if (filterBdr && !activity.bdr?.toLowerCase().includes(filterBdr.toLowerCase())) return false;
                    if (filterLead && !activity.lead?.toLowerCase().includes(filterLead.toLowerCase())) return false;
                    if (filterCanal !== "todos" && activity.channel !== filterCanal) return false;
                    if (filterQualificacao !== "todos" && activity.qualification !== filterQualificacao) return false;
                    if (filterStatus !== "todos" && normalizeStatus(activity.status) !== normalizeStatus(filterStatus)) return false;
                    if (filterResultado !== "todos" && normalizeOutcome(activity.deal_outcome) !== normalizeOutcome(filterResultado)) return false;
                    if (filterVlrProposta && activity.proposal_value) {
                      const filterVal = parseFloat(filterVlrProposta);
                      if (activity.proposal_value < filterVal) return false;
                    }
                    if (filterVlrVenda && activity.sale_value) {
                      const filterVal = parseFloat(filterVlrVenda);
                      if (activity.sale_value < filterVal) return false;
                    }
                    if (filterNotas && !activity.notes?.toLowerCase().includes(filterNotas.toLowerCase())) return false;
                    return true;
                  }).map((activity) => (
                    <TableRow
                      key={activity.id}
                      data-testid={`row-activity-${activity.id}`}
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => openEditModal(activity)}
                    >
                      <TableCell className="whitespace-nowrap">
                        {formatDate(activity.date)}
                      </TableCell>
                      <TableCell className="font-medium">{activity.lead || "-"}</TableCell>
                      <TableCell>{activity.closer || "-"}</TableCell>
                      <TableCell>{activity.bdr || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{activity.channel || "-"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{activity.type || "-"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {activity.qualification || "-"}
                      </TableCell>
                      <TableCell>
                        {activity.deal_outcome ? (
                          <Badge className={getOutcomeColor(activity.deal_outcome)}>
                            {activity.deal_outcome}
                          </Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(activity.sale_value)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(activity.proposal_value)}
                      </TableCell>
                      <TableCell>
                        {activity.notes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={!!selectedActivity} onOpenChange={() => closeEditModal()}>
        <DialogContent className="max-w-2xl bg-background/95 backdrop-blur border-primary/20 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Editar Atividade</DialogTitle>
          </DialogHeader>

          {selectedActivity && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data da Atividade</Label>
                  <Input
                    type="date"
                    value={editForm.date || ""}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    className="bg-card/50 border-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lead/Empresa</Label>
                  <Input
                    value={editForm.lead || ""}
                    onChange={(e) => setEditForm({ ...editForm, lead: e.target.value })}
                    className="bg-card/50 border-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>BDR</Label>
                <Input
                  value={editForm.bdr || ""}
                  onChange={(e) => setEditForm({ ...editForm, bdr: e.target.value })}
                  className="bg-card/50 border-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Canal</Label>
                  <Select
                    value={editForm.channel || ""}
                    onValueChange={(value) => setEditForm({ ...editForm, channel: value })}
                  >
                    <SelectTrigger className="bg-card/50 border-primary/20">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inbound">Inbound</SelectItem>
                      <SelectItem value="Outbound">Outbound</SelectItem>
                      <SelectItem value="Indicação">Indicação</SelectItem>
                      <SelectItem value="Parceiro">Parceiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Qualificação</Label>
                  <Select
                    value={editForm.qualification || ""}
                    onValueChange={(value) => setEditForm({ ...editForm, qualification: value })}
                  >
                    <SelectTrigger className="bg-card/50 border-primary/20">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Qualificado">Qualificado</SelectItem>
                      <SelectItem value="Não Qualificado">Não Qualificado</SelectItem>
                      <SelectItem value="Em Análise">Em Análise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Reunião</Label>
                  <Select
                    value={editForm.type || ""}
                    onValueChange={(value) => setEditForm({ ...editForm, type: value })}
                  >
                    <SelectTrigger className="bg-card/50 border-primary/20">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="R1">R1</SelectItem>
                      <SelectItem value="R2">R2</SelectItem>
                      <SelectItem value="R3">R3</SelectItem>
                      <SelectItem value="R4">R4</SelectItem>
                      <SelectItem value="R5">R5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status da Atividade</Label>
                  <Select
                    value={editForm.status || ""}
                    onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                  >
                    <SelectTrigger className="bg-card/50 border-primary/20">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Reunião Realizada">Reunião Realizada</SelectItem>
                      <SelectItem value="No Show">No Show</SelectItem>
                      <SelectItem value="Reagendada">Reagendada</SelectItem>
                      <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Proposta Enviada?</Label>
                  <Select
                    value={editForm.proposal_sent || ""}
                    onValueChange={(value) => setEditForm({ ...editForm, proposal_sent: value })}
                  >
                    <SelectTrigger className="bg-card/50 border-primary/20">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sim">Sim</SelectItem>
                      <SelectItem value="Não">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Reunião Resgatada?</Label>
                  <Select
                    value={editForm.rescued_meeting || ""}
                    onValueChange={(value) => setEditForm({ ...editForm, rescued_meeting: value })}
                  >
                    <SelectTrigger className="bg-card/50 border-primary/20">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sim">Sim</SelectItem>
                      <SelectItem value="Não">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Evolução no Funil</Label>
                <Select
                  value={editForm.evolution || ""}
                  onValueChange={(value) => setEditForm({ ...editForm, evolution: value })}
                >
                  <SelectTrigger className="bg-card/50 border-primary/20">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Avançou">Avançou</SelectItem>
                    <SelectItem value="Manteve">Manteve</SelectItem>
                    <SelectItem value="Regrediu">Regrediu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Valor da Proposta (R$)</Label>
                <Input
                  type="number"
                  value={editForm.proposal_value || ""}
                  onChange={(e) => setEditForm({ ...editForm, proposal_value: e.target.value ? Number(e.target.value) : null })}
                  className="bg-card/50 border-primary/20"
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={editForm.notes || ""}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="bg-card/50 border-primary/20 min-h-[100px]"
                  placeholder="Adicione observações..."
                />
              </div>

              <Button
                onClick={saveActivity}
                disabled={saving}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
