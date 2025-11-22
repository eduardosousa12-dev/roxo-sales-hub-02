import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  useEffect(() => {
    loadActivities();
  }, []);

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

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = !searchTerm || 
      activity.lead?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.closer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.bdr?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || 
      normalizeStatus(activity.status) === normalizeStatus(statusFilter);
    
    return matchesSearch && matchesStatus;
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

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por lead, closer ou BDR..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-primary/20"
            data-testid="input-search-historico"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px] border-primary/20" data-testid="select-status-historico">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            {statusOptions.map(opt => (
              <SelectItem key={opt.normalized} value={opt.value}>
                {opt.value} {opt.normalized !== opt.value.toLowerCase() && `(${opt.normalized})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
