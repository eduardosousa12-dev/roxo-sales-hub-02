import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileCheck, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Proposta {
  id: number;
  proposal_value: number | null;
  deal_outcome: string | null;
  date: string | null;
  lead: string | null;
  closer: string | null;
  closer_id: string | null;
  sale_date: string | null;
}

interface Profile {
  id: string;
  full_name: string | null;
}

export default function Propostas() {
  const { user, loading: authLoading } = useAuth();
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCloser, setSelectedCloser] = useState("todos");

  // Estados para o modal de confirmação
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"Ganho" | "Perdido">("Ganho");
  const [selectedPropostaId, setSelectedPropostaId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (authLoading || !user) return;
    loadProfiles();
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading || !user) return;
    loadPropostas();
  }, [selectedCloser, authLoading, user]);

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

  const loadPropostas = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("activities")
        .select("*");

      // Filter by closer if selected
      if (selectedCloser !== "todos") {
        query = query.eq("closer_id", selectedCloser);
      }

      // Get activities with proposals (proposal_sent = Sim/Yes OR proposal_value not null)
      // AND deal_outcome is null or "Em Aberto" or "Open"
      const { data, error } = await query
        .order("date", { ascending: false });

      if (error) throw error;

      // Filter in frontend for proposals
      const filtered = (data || []).filter(activity => {
        const hasProposal = activity.proposal_sent === "Sim" || 
                           activity.proposal_sent === "Yes" || 
                           (activity.proposal_value !== null && activity.proposal_value > 0);
        
        const isOpen = !activity.deal_outcome || 
                      activity.deal_outcome === "Em Aberto" || 
                      activity.deal_outcome === "Open";
        
        return hasProposal && isOpen;
      });

      setPropostas(filtered);
    } catch (error) {
      console.error("Error loading propostas:", error);
      toast.error("Erro ao carregar propostas");
    } finally {
      setLoading(false);
    }
  };

  const openConfirmModal = (id: number, tipo: "Ganho" | "Perdido") => {
    setSelectedPropostaId(id);
    setModalType(tipo);
    setSelectedDate(new Date().toISOString().split("T")[0]);
    setModalOpen(true);
  };

  const handleConfirmStatus = async () => {
    if (!selectedPropostaId) return;

    try {
      // Buscar a proposta para pegar o proposal_value
      const proposta = propostas.find(p => p.id === selectedPropostaId);

      const updateData: any = {
        deal_outcome: modalType === "Ganho" ? "Ganha" : "Perdida",
        sale_date: selectedDate,
        date: selectedDate, // Atualiza também o campo date para exibir corretamente em Recebíveis
      };

      // Se for ganho, copiar proposal_value para sale_value
      if (modalType === "Ganho" && proposta?.proposal_value) {
        updateData.sale_value = proposta.proposal_value;
      }

      const { error } = await supabase
        .from("activities")
        .update(updateData)
        .eq("id", selectedPropostaId);

      if (error) throw error;

      toast.success(`Proposta marcada como ${modalType}`);
      setModalOpen(false);
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
        <p className="text-foreground/80">Converta propostas em vendas ou perdas</p>
      </div>

      <div className="flex gap-4">
        <Select value={selectedCloser} onValueChange={setSelectedCloser}>
          <SelectTrigger className="w-[200px] border-primary/20">
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
      </div>

      <div className="space-y-4">
        {loading ? (
          <Card className="glass-card">
            <CardContent className="p-8">
              <p className="text-center text-foreground/80">Carregando propostas...</p>
            </CardContent>
          </Card>
        ) : propostas.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="p-8">
              <div className="text-center">
                <FileCheck className="h-12 w-12 mx-auto mb-4 text-foreground/70" />
                <p className="text-foreground/80">Nenhuma proposta em aberto</p>
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
                    <p className="text-sm text-foreground/80 mt-1">
                      Closer: {proposta.closer || "Não atribuído"}
                    </p>
                    <p className="text-xs text-foreground/70">
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
                      onClick={() => openConfirmModal(proposta.id, "Ganho")}
                      variant="default"
                      className="glow-purple-hover"
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Marcar como Ganho
                    </Button>
                    <Button
                      onClick={() => openConfirmModal(proposta.id, "Perdido")}
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

      {/* Modal de confirmação com seleção de data */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {modalType === "Ganho" ? (
                <>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Marcar como Ganho
                </>
              ) : (
                <>
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  Marcar como Perdido
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {modalType === "Ganho"
                ? "Selecione a data em que a venda foi concluída."
                : "Selecione a data em que a proposta foi perdida."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {modalType === "Ganho" ? "Data da Venda" : "Data da Perda"}
              </Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-primary/20"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmStatus}
              variant={modalType === "Ganho" ? "default" : "destructive"}
              className={modalType === "Ganho" ? "glow-purple-hover" : ""}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
