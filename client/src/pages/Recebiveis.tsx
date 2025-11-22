import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { DollarSign, Calendar, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import MetricCard from "@/components/MetricCard";

interface Payment {
  id: number;
  activity_id: number | null;
  valor_pago: number | null;
  data_pagamento: string | null;
  meio_pagamento: string | null;
  created_at: string | null;
  activities?: {
    lead: string | null;
    closer: string | null;
    sale_value: number | null;
  } | null;
}

export default function Recebiveis() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          activities!payments_activity_id_fkey(
            lead,
            closer,
            sale_value
          )
        `)
        .order("data_pagamento", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error loading payments:", error);
    } finally {
      setLoading(false);
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

  const getPaymentMethodColor = (method: string | null) => {
    switch (method) {
      case "Cartão de Crédito":
        return "bg-blue-500/20 text-blue-400";
      case "Boleto":
        return "bg-yellow-500/20 text-yellow-400";
      case "PIX":
        return "bg-green-500/20 text-green-400";
      case "Transferência":
        return "bg-purple-500/20 text-purple-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const totalRecebido = payments.reduce((sum, p) => sum + (p.valor_pago || 0), 0);
  const totalPagamentos = payments.length;
  const ticketMedio = totalPagamentos > 0 ? totalRecebido / totalPagamentos : 0;

  const filteredPayments = payments.filter(payment => {
    if (!searchTerm) return true;
    
    const lead = payment.activities?.lead?.toLowerCase() || "";
    const closer = payment.activities?.closer?.toLowerCase() || "";
    const method = payment.meio_pagamento?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    
    return lead.includes(search) || closer.includes(search) || method.includes(search);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-glow bg-clip-text text-transparent">
          Recebíveis
        </h1>
        <p className="text-muted-foreground">Acompanhe os pagamentos e valores recebidos</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Total Recebido"
          value={formatCurrency(totalRecebido)}
          icon={DollarSign}
        />
        <MetricCard
          title="Total de Pagamentos"
          value={totalPagamentos}
          icon={CreditCard}
        />
        <MetricCard
          title="Ticket Médio"
          value={formatCurrency(ticketMedio)}
          icon={DollarSign}
        />
      </div>

      {/* Search */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Buscar por lead, closer ou meio de pagamento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border-primary/20"
          data-testid="input-search-recebiveis"
        />
      </div>

      {/* Payments Table */}
      <Card className="glass-card border-2 border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Pagamentos ({filteredPayments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-pulse text-primary text-xl">Carregando pagamentos...</div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              Nenhum pagamento encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Data Pagamento</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Closer</TableHead>
                    <TableHead>Meio de Pagamento</TableHead>
                    <TableHead className="text-right">Valor Venda</TableHead>
                    <TableHead className="text-right">Valor Pago</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                      <TableCell className="font-mono">#{payment.id}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(payment.data_pagamento)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {payment.activities?.lead || "-"}
                      </TableCell>
                      <TableCell>
                        {payment.activities?.closer || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPaymentMethodColor(payment.meio_pagamento)}>
                          {payment.meio_pagamento || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(payment.activities?.sale_value)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-green-400">
                        {formatCurrency(payment.valor_pago)}
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
