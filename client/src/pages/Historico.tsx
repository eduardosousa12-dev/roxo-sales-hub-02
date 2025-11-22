import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Calendar, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Profile {
  id: string;
  full_name: string | null;
}

interface Activity {
  id: number;
  date: string | null;
  closer: string | null;
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
}

export default function Historico() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
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
  
  // Meeting type checkboxes (R1-R5)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["R1", "R2", "R3", "R4", "R5"]);

  useEffect(() => {
    loadProfiles();
    loadActivities();
  }, []);

  const loadProfiles = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name");
      setProfiles(data || []);
    } catch (error) {
      console.error("Error loading profiles:", error);
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
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error("Error loading activities:", error);
    } finally {
      setLoading(false);
    }
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
    if (normalized.includes("ganho") || normalized.includes("won")) return "won";
    if (normalized.includes("perdido") || normalized.includes("lost")) return "lost";
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
      activities
        .map(a => normalizeStatus(a.status))
        .filter(Boolean)
    )
  );

  const statusOptions = uniqueStatusesNormalized.map(normalized => {
    const example = activities.find(a => normalizeStatus(a.status) === normalized);
    return { value: example?.status || normalized, normalized };
  });

  // Get unique values for dropdowns
  const uniqueChannels = Array.from(new Set(activities.map(a => a.channel).filter(Boolean)));
  const uniqueBdrs = Array.from(new Set(activities.map(a => a.bdr).filter(Boolean)));
  const uniqueQualifications = Array.from(new Set(activities.map(a => a.qualification).filter(Boolean)));
  const uniqueOutcomes = Array.from(new Set(activities.map(a => a.deal_outcome).filter(Boolean)));

  const filteredActivities = activities.filter(activity => {
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
    // If type is R1-R5, check if it's selected. Otherwise, always show it.
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
        <p className="text-muted-foreground">Visualize todas as atividades e reuniões realizadas</p>
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
            <label className="text-sm font-medium mb-3 block">Tipos de Reunião</label>
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
                    className="text-sm font-medium cursor-pointer"
                  >
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Dropdown Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                {profiles.map(profile => (
                  <SelectItem key={profile.id} value={profile.full_name || ""}>
                    {profile.full_name || "Sem nome"}
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
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-pulse text-primary text-xl">Carregando histórico...</div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              Nenhuma atividade encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Closer</TableHead>
                    <TableHead>BDR</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Qualificação</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead className="text-right">Valor Venda</TableHead>
                    <TableHead className="text-right">Valor Proposta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.map((activity) => (
                    <TableRow key={activity.id} data-testid={`row-activity-${activity.id}`}>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
