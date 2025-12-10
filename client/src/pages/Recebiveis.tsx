import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DollarSign, Calendar, X, Trash2, Pencil, Check } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import MetricCard from "@/components/MetricCard";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string | null;
}

interface Payment {
  id: number;
  activity_id: number;
  valor_pago: number;
  data_pagamento: string;
  meio_pagamento: string | null;
}

interface SaleWithPayments {
  id: number;
  date: string | null;
  lead: string | null;
  closer: string | null;
  closer_id: string | null;
  sale_value: number;
  total_paid: number;
  saldo_devedor: number;
  status: "Pendente" | "Pago";
}

export default function Recebiveis() {
  const { user, loading: authLoading } = useAuth();
  const [sales, setSales] = useState<SaleWithPayments[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCloser, setSelectedCloser] = useState("todos");
  const [salePeriod, setSalePeriod] = useState("maximo");
  const [selectedStatus, setSelectedStatus] = useState("todos");

  // Modal de pagamentos
  const [selectedSale, setSelectedSale] = useState<SaleWithPayments | null>(null);
  const [salePayments, setSalePayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Form de novo pagamento
  const [newPaymentValue, setNewPaymentValue] = useState("");
  const [newPaymentDate, setNewPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [newPaymentMethod, setNewPaymentMethod] = useState("Pix");
  const [savingPayment, setSavingPayment] = useState(false);

  // Edição de data da venda
  const [editingSaleDate, setEditingSaleDate] = useState(false);
  const [newSaleDate, setNewSaleDate] = useState("");
  const [savingSaleDate, setSavingSaleDate] = useState(false);
  const [deletingSale, setDeletingSale] = useState(false);

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

  useEffect(() => {
    if (authLoading || !user) return;
    loadProfiles();
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading || !user) return;
    loadSalesWithPayments();
  }, [selectedCloser, salePeriod, selectedStatus, authLoading, user]);

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

  const loadSalesWithPayments = async () => {
    try {
      setLoading(true);

      // 1. Buscar atividades com sale_value > 0 OU deal_outcome ganho (para compatibilidade)
      const { data: activitiesData, error: activitiesError } = await supabase
        .from("activities")
        .select("*")
        .order("date", { ascending: false });

      if (activitiesError) throw activitiesError;

      // Filtrar: sale_value > 0 OU (deal_outcome ganho E proposal_value > 0)
      const salesActivities = (activitiesData || []).filter(a => {
        // Se tem sale_value, é uma venda
        if (a.sale_value && a.sale_value > 0) return true;

        // Se deal_outcome é ganho/ganha e tem proposal_value, também é venda
        const outcome = (a.deal_outcome || "").toLowerCase();
        if ((outcome === "ganha" || outcome === "ganho") && a.proposal_value && a.proposal_value > 0) {
          return true;
        }

        return false;
      });

      console.log("📊 Atividades com vendas:", salesActivities.length);

      // 2. Buscar todos os pagamentos
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("payments")
        .select("activity_id, valor_pago, data_pagamento");

      if (paymentsError) throw paymentsError;

      // 3. Agrupar pagamentos por activity_id
      const paymentsByActivity = new Map<number, { total: number; lastDate: string | null }>();
      (paymentsData || []).forEach(p => {
        if (p.activity_id) {
          const current = paymentsByActivity.get(p.activity_id) || { total: 0, lastDate: null };
          paymentsByActivity.set(p.activity_id, {
            total: current.total + (p.valor_pago || 0),
            lastDate: p.data_pagamento || current.lastDate,
          });
        }
      });

      // 4. Combinar vendas com pagamentos
      let combinedSales: SaleWithPayments[] = salesActivities.map(activity => {
        const payments = paymentsByActivity.get(activity.id) || { total: 0, lastDate: null };
        // Usar sale_value se existir, senão usar proposal_value (para vendas antigas marcadas como ganho)
        const saleValue = activity.sale_value || activity.proposal_value || 0;
        const totalPaid = payments.total;
        const saldoDevedor = saleValue - totalPaid;

        return {
          id: activity.id,
          date: activity.date || activity.created_at?.split('T')[0] || null,
          lead: activity.lead,
          closer: activity.closer,
          closer_id: activity.closer_id,
          sale_value: saleValue,
          total_paid: totalPaid,
          saldo_devedor: saldoDevedor,
          status: saldoDevedor <= 0 ? "Pago" as const : "Pendente" as const,
        };
      });

      // 5. Aplicar filtros

      // Filtro por closer
      if (selectedCloser !== "todos") {
        combinedSales = combinedSales.filter(s => s.closer_id === selectedCloser);
      }

      // Filtro por período da venda
      if (salePeriod !== "todos" && salePeriod !== "maximo") {
        const daysAgo = parseInt(salePeriod);
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - daysAgo);
        const dateFromStr = dateFrom.toISOString().split('T')[0];
        combinedSales = combinedSales.filter(s => {
          if (!s.date) return false;
          return s.date >= dateFromStr;
        });
      }

      // Filtro por status
      if (selectedStatus !== "todos") {
        const statusFilter = selectedStatus === "pendente" ? "Pendente" : "Pago";
        combinedSales = combinedSales.filter(s => s.status === statusFilter);
      }

      console.log("📋 Vendas após filtros:", combinedSales.length);
      setSales(combinedSales);
    } catch (error) {
      console.error("Error loading sales:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentsForSale = async (activityId: number) => {
    try {
      setLoadingPayments(true);
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("activity_id", activityId)
        .order("data_pagamento", { ascending: false });

      if (error) throw error;
      setSalePayments(data || []);
    } catch (error) {
      console.error("Error loading payments:", error);
      toast.error("Erro ao carregar pagamentos");
    } finally {
      setLoadingPayments(false);
    }
  };

  const openPaymentModal = (sale: SaleWithPayments) => {
    setSelectedSale(sale);
    loadPaymentsForSale(sale.id);
    // Reset form
    setNewPaymentValue("");
    setNewPaymentDate(new Date().toISOString().split("T")[0]);
    setNewPaymentMethod("Pix");
    // Reset edição de data
    setEditingSaleDate(false);
    setNewSaleDate(sale.date || "");
  };

  const closePaymentModal = () => {
    setSelectedSale(null);
    setSalePayments([]);
  };

  const addPayment = async () => {
    if (!selectedSale) return;

    const valorNumerico = parseFloat(newPaymentValue.replace(",", "."));
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    try {
      setSavingPayment(true);
      const { error } = await supabase
        .from("payments")
        .insert({
          activity_id: selectedSale.id,
          valor_pago: valorNumerico,
          data_pagamento: newPaymentDate,
          meio_pagamento: newPaymentMethod,
        });

      if (error) throw error;

      toast.success("Pagamento registrado com sucesso!");

      // Recarregar pagamentos e vendas
      await loadPaymentsForSale(selectedSale.id);
      await loadSalesWithPayments();

      // Atualizar o selectedSale com os novos valores
      const updatedTotalPaid = selectedSale.total_paid + valorNumerico;
      const updatedSaldoDevedor = selectedSale.sale_value - updatedTotalPaid;
      setSelectedSale({
        ...selectedSale,
        total_paid: updatedTotalPaid,
        saldo_devedor: updatedSaldoDevedor,
        status: updatedSaldoDevedor <= 0 ? "Pago" : "Pendente",
      });

      // Limpar form
      setNewPaymentValue("");
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error("Erro ao registrar pagamento");
    } finally {
      setSavingPayment(false);
    }
  };

  const deletePayment = async (paymentId: number) => {
    if (!selectedSale) return;

    try {
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", paymentId);

      if (error) throw error;

      toast.success("Pagamento excluído");

      // Recarregar
      await loadPaymentsForSale(selectedSale.id);
      await loadSalesWithPayments();

      // Atualizar selectedSale
      const deletedPayment = salePayments.find(p => p.id === paymentId);
      if (deletedPayment) {
        const updatedTotalPaid = selectedSale.total_paid - deletedPayment.valor_pago;
        const updatedSaldoDevedor = selectedSale.sale_value - updatedTotalPaid;
        setSelectedSale({
          ...selectedSale,
          total_paid: updatedTotalPaid,
          saldo_devedor: updatedSaldoDevedor,
          status: updatedSaldoDevedor <= 0 ? "Pago" : "Pendente",
        });
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Erro ao excluir pagamento");
    }
  };

  const updateSaleDate = async () => {
    if (!selectedSale || !newSaleDate) return;

    try {
      setSavingSaleDate(true);
      const { error } = await supabase
        .from("activities")
        .update({ sale_date: newSaleDate, date: newSaleDate })
        .eq("id", selectedSale.id);

      if (error) throw error;

      toast.success("Data da venda atualizada");
      setEditingSaleDate(false);

      // Atualizar selectedSale localmente
      setSelectedSale({
        ...selectedSale,
        date: newSaleDate,
      });

      // Recarregar lista
      await loadSalesWithPayments();
    } catch (error) {
      console.error("Error updating sale date:", error);
      toast.error("Erro ao atualizar data da venda");
    } finally {
      setSavingSaleDate(false);
    }
  };

  const deleteSale = async () => {
    if (!selectedSale) return;

    const confirmDelete = window.confirm(
      `Tem certeza que deseja apagar esta venda de ${selectedSale.lead || "Lead"}?\n\nIsso irá:\n- Remover a venda (zerar sale_value)\n- Manter os pagamentos registrados\n\nEsta ação não pode ser desfeita.`
    );

    if (!confirmDelete) return;

    try {
      setDeletingSale(true);

      // Atualizar a atividade para remover os dados de venda
      const { error } = await supabase
        .from("activities")
        .update({
          sale_value: null,
          sale_date: null,
          deal_outcome: "Em Aberto",
        })
        .eq("id", selectedSale.id);

      if (error) throw error;

      toast.success("Venda removida com sucesso");
      closePaymentModal();
      await loadSalesWithPayments();
    } catch (error) {
      console.error("Error deleting sale:", error);
      toast.error("Erro ao remover venda");
    } finally {
      setDeletingSale(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      // Adiciona T12:00:00 para evitar problemas de timezone
      const date = new Date(dateString + "T12:00:00");
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  // Para métricas, precisamos recalcular sem o filtro de status
  const [metricsData, setMetricsData] = useState({ totalVendido: 0, totalRecebido: 0, saldoPendente: 0 });

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const { data: activitiesData } = await supabase
          .from("activities")
          .select("id, sale_value, proposal_value, deal_outcome, closer_id, date, created_at");

        // Filtrar: sale_value > 0 OU (deal_outcome ganho E proposal_value > 0)
        let salesForMetrics = (activitiesData || []).filter(a => {
          if (a.sale_value && a.sale_value > 0) return true;
          const outcome = (a.deal_outcome || "").toLowerCase();
          if ((outcome === "ganha" || outcome === "ganho") && a.proposal_value && a.proposal_value > 0) {
            return true;
          }
          return false;
        });

        if (selectedCloser !== "todos") {
          salesForMetrics = salesForMetrics.filter(s => s.closer_id === selectedCloser);
        }

        if (salePeriod !== "todos" && salePeriod !== "maximo") {
          const daysAgo = parseInt(salePeriod);
          const dateFrom = new Date();
          dateFrom.setDate(dateFrom.getDate() - daysAgo);
          const dateFromStr = dateFrom.toISOString().split('T')[0];
          salesForMetrics = salesForMetrics.filter(s => {
            const saleDate = s.date || s.created_at?.split('T')[0];
            if (!saleDate) return false;
            return saleDate >= dateFromStr;
          });
        }

        const { data: paymentsData } = await supabase
          .from("payments")
          .select("activity_id, valor_pago");

        const paymentsByActivity = new Map<number, number>();
        (paymentsData || []).forEach(p => {
          if (p.activity_id) {
            const current = paymentsByActivity.get(p.activity_id) || 0;
            paymentsByActivity.set(p.activity_id, current + (p.valor_pago || 0));
          }
        });

        let totalVendido = 0;
        let totalRecebido = 0;

        salesForMetrics.forEach(sale => {
          // Usar sale_value se existir, senão usar proposal_value
          const saleValue = sale.sale_value || sale.proposal_value || 0;
          const paid = paymentsByActivity.get(sale.id) || 0;
          totalVendido += saleValue;
          totalRecebido += paid;
        });

        setMetricsData({
          totalVendido,
          totalRecebido,
          saldoPendente: totalVendido - totalRecebido,
        });
      } catch (error) {
        console.error("Error loading metrics:", error);
      }
    };

    if (!authLoading && user) {
      loadMetrics();
    }
  }, [selectedCloser, salePeriod, authLoading, user]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-glow bg-clip-text text-transparent">
          Controle de Recebíveis
        </h1>
        <p className="text-foreground/80">Gerencie os pagamentos das vendas realizadas.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap items-center">
        <Select value={selectedCloser} onValueChange={setSelectedCloser}>
          <SelectTrigger className="w-[180px] border-primary/20" data-testid="select-closer">
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

        <Select value={salePeriod} onValueChange={setSalePeriod}>
          <SelectTrigger className="w-[160px] border-primary/20" data-testid="select-sale-period">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="maximo">Máximo</SelectItem>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[140px] border-primary/20" data-testid="select-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="pendente">Não Pago</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Vendido"
          value={formatCurrency(metricsData.totalVendido)}
          icon={DollarSign}
        />
        <MetricCard
          title="Valor Recebido"
          value={formatCurrency(metricsData.totalRecebido)}
          valueClassName="!text-cyan-300 !bg-none drop-shadow-[0_0_12px_rgba(103,232,249,0.8)]"
        />
        <MetricCard
          title="Saldo Pendente"
          value={formatCurrency(metricsData.saldoPendente)}
          valueClassName="!text-orange-300 !bg-none drop-shadow-[0_0_12px_rgba(253,186,116,0.8)]"
        />
      </div>

      {/* Sales Table */}
      <Card className="glass-card border-2 border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Vendas ({sales.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-pulse text-primary text-xl">Carregando vendas...</div>
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center text-foreground/70 py-12">
              Nenhuma venda encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground font-semibold">DATA VENDA</TableHead>
                    <TableHead className="text-foreground font-semibold">CLOSER</TableHead>
                    <TableHead className="text-foreground font-semibold">LEAD</TableHead>
                    <TableHead className="text-right text-foreground font-semibold">VALOR VENDA</TableHead>
                    <TableHead className="text-right text-foreground font-semibold">VALOR RECEBIDO</TableHead>
                    <TableHead className="text-right text-foreground font-semibold">SALDO DEVEDOR</TableHead>
                    <TableHead className="text-foreground font-semibold">STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow
                      key={sale.id}
                      data-testid={`row-sale-${sale.id}`}
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => openPaymentModal(sale)}
                    >
                      <TableCell className="whitespace-nowrap">
                        {formatDate(sale.date)}
                      </TableCell>
                      <TableCell>
                        {sale.closer || "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {sale.lead || "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(sale.sale_value)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-cyan-300">
                        {formatCurrency(sale.total_paid)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-orange-300">
                        {formatCurrency(sale.saldo_devedor)}
                      </TableCell>
                      <TableCell>
                        <Badge className={sale.status === "Pago" ? "bg-cyan-900 text-cyan-300 border border-cyan-500" : "bg-orange-900 text-orange-300 border border-orange-500"}>
                          {sale.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Pagamentos */}
      <Dialog open={!!selectedSale} onOpenChange={() => closePaymentModal()}>
        <DialogContent className="max-w-2xl bg-background/95 backdrop-blur border-primary/20">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Gerenciar Pagamentos para: {selectedSale?.lead || "Venda"}
            </DialogTitle>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-6">
              {/* Ações da venda: Data e Apagar */}
              <div className="flex items-center justify-between bg-card/30 rounded-lg p-3 border border-primary/10">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-foreground/70" />
                  {editingSaleDate ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={newSaleDate}
                        onChange={(e) => setNewSaleDate(e.target.value)}
                        className="w-40 h-8 bg-card/50 border-primary/20"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={updateSaleDate}
                        disabled={savingSaleDate}
                        className="h-8 px-2 text-green-400 hover:text-green-300"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingSaleDate(false);
                          setNewSaleDate(selectedSale.date || "");
                        }}
                        className="h-8 px-2 text-foreground/50 hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        Data da venda: <strong>{formatDate(selectedSale.date)}</strong>
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingSaleDate(true);
                          setNewSaleDate(selectedSale.date || "");
                        }}
                        className="h-6 px-2 text-foreground/50 hover:text-foreground"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deleteSale}
                  disabled={deletingSale}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {deletingSale ? "Apagando..." : "Apagar Venda"}
                </Button>
              </div>

              {/* Resumo da venda */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-card/50 rounded-lg p-4">
                  <p className="text-sm text-foreground/70">Valor Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedSale.sale_value)}</p>
                </div>
                <div className="bg-card/50 rounded-lg p-4">
                  <p className="text-sm text-foreground/70">Total Pago</p>
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(selectedSale.total_paid)}</p>
                </div>
                <div className="bg-card/50 rounded-lg p-4">
                  <p className="text-sm text-foreground/70">Saldo Devedor</p>
                  <p className="text-2xl font-bold text-red-400">{formatCurrency(selectedSale.saldo_devedor)}</p>
                </div>
              </div>

              {/* Lista de pagamentos */}
              <div>
                <h3 className="font-semibold mb-3">Pagamentos Registrados</h3>
                {loadingPayments ? (
                  <p className="text-foreground/70">Carregando...</p>
                ) : salePayments.length === 0 ? (
                  <p className="text-foreground/70">Nenhum pagamento registrado</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>VALOR</TableHead>
                        <TableHead>DATA</TableHead>
                        <TableHead>MEIO DE PAGAMENTO</TableHead>
                        <TableHead className="text-right">AÇÃO</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salePayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-mono">{formatCurrency(payment.valor_pago)}</TableCell>
                          <TableCell>{formatDate(payment.data_pagamento)}</TableCell>
                          <TableCell>{payment.meio_pagamento || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                              onClick={() => deletePayment(payment.id)}
                            >
                              Excluir
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Formulário de novo pagamento */}
              <div className="border-t border-primary/20 pt-4">
                <h3 className="font-semibold mb-3">Adicionar Novo Pagamento</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment-value">Valor Recebido (R$)</Label>
                    <Input
                      id="payment-value"
                      type="text"
                      placeholder="0,00"
                      value={newPaymentValue}
                      onChange={(e) => setNewPaymentValue(e.target.value)}
                      className="bg-card/50 border-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment-date">Data do Recebimento</Label>
                    <Input
                      id="payment-date"
                      type="date"
                      value={newPaymentDate}
                      onChange={(e) => setNewPaymentDate(e.target.value)}
                      className="bg-card/50 border-primary/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Meio de Pagamento</Label>
                    <Select value={newPaymentMethod} onValueChange={setNewPaymentMethod}>
                      <SelectTrigger className="bg-card/50 border-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pix">Pix</SelectItem>
                        <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                        <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                        <SelectItem value="Boleto">Boleto</SelectItem>
                        <SelectItem value="Transferência">Transferência</SelectItem>
                        <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={addPayment}
                      disabled={savingPayment}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      {savingPayment ? "Salvando..." : "Adicionar Pagamento"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
