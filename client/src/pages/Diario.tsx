import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Plus, Save, Trash2 } from "lucide-react";

interface Profile {
  id: string;
  full_name: string | null;
}

interface LancamentoFormData {
  data: string;
  closerId: string;
  closerName: string;
  bdr: string;
  leadNome: string;
  faturamentoEmpresa: string;
  canal: string;
  qualificacao: string;
  reuniaoResgatada: string;
  tipoReuniao: string;
  statusAtividade: string;
  propostaEnviada: string;
  evolucaoFunil: string;
  valorProposta: string;
  observacoes: string;
}

const getDefaultFormData = (currentUserProfile?: Profile): LancamentoFormData => ({
  data: new Date().toISOString().split("T")[0],
  closerId: currentUserProfile?.id || "",
  closerName: currentUserProfile?.full_name || "",
  bdr: "",
  leadNome: "",
  faturamentoEmpresa: "",
  canal: "Inbound",
  qualificacao: "Não Identificado",
  reuniaoResgatada: "Não",
  tipoReuniao: "R1",
  statusAtividade: "Reunião Realizada",
  propostaEnviada: "Não",
  evolucaoFunil: "Nenhuma",
  valorProposta: "",
  observacoes: "",
});

export default function Diario() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [lancamentos, setLancamentos] = useState<LancamentoFormData[]>([getDefaultFormData()]);

  useEffect(() => {
    if (authLoading || !user) return;
    loadProfiles();
  }, [user, authLoading]);

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name");
      
      if (error) throw error;
      setProfiles(data || []);
      
      // Preselect current user if available
      if (user && data) {
        const currentUserProfile = data.find(p => p.id === user.id);
        if (currentUserProfile) {
          setLancamentos([getDefaultFormData(currentUserProfile)]);
        }
      }
    } catch (error) {
      console.error("Error loading profiles:", error);
    }
  };

  const addLancamento = () => {
    const currentUserProfile = profiles.find(p => p.id === user?.id);
    setLancamentos([...lancamentos, getDefaultFormData(currentUserProfile)]);
  };

  const removeLancamento = (index: number) => {
    if (lancamentos.length > 1) {
      setLancamentos(lancamentos.filter((_, i) => i !== index));
    }
  };

  const updateLancamento = (index: number, field: keyof LancamentoFormData, value: string) => {
    const updated = [...lancamentos];
    if (field === "closerId") {
      const selected = profiles.find(p => p.id === value);
      updated[index] = {
        ...updated[index],
        closerId: value,
        closerName: selected?.full_name || ""
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setLancamentos(updated);
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all forms
    for (let i = 0; i < lancamentos.length; i++) {
      const lancamento = lancamentos[i];
      if (!lancamento.closerId) {
        toast.error(`Lançamento ${i + 1}: Selecione um closer`);
        return;
      }
      if (!lancamento.leadNome) {
        toast.error(`Lançamento ${i + 1}: Preencha o nome do lead/empresa`);
        return;
      }
    }
    
    try {
      setLoading(true);
      const activitiesToInsert = [];
      
      for (const formData of lancamentos) {
        // Create or get the lead
        let leadName = formData.leadNome;
        const { data: existingLead } = await supabase
          .from("leads")
          .select("id, name")
          .eq("name", formData.leadNome)
          .single();
        
        if (!existingLead) {
          const { data: newLead } = await supabase
            .from("leads")
            .insert({
              name: formData.leadNome,
              notes: formData.faturamentoEmpresa ? `Faturamento: ${formData.faturamentoEmpresa}` : null,
            })
            .select("id, name")
            .single();
          
          if (newLead) {
            leadName = newLead.name;
          }
        }
        
        activitiesToInsert.push({
          date: formData.data,
          closer: formData.closerName || null,
          closer_id: formData.closerId || null,
          bdr: formData.bdr || null,
          lead: leadName,
          channel: formData.canal,
          type: formData.tipoReuniao,
          status: formData.statusAtividade,
          qualification: formData.qualificacao,
          proposal_sent: formData.propostaEnviada,
          evolution: formData.evolucaoFunil,
          proposal_value: formData.valorProposta ? parseFloat(formData.valorProposta) : null,
          notes: formData.observacoes || null,
          reuniao_resgatada: formData.reuniaoResgatada,
          company_revenue: formData.faturamentoEmpresa || null,
        });
      }
      
      const { error } = await supabase
        .from("activities")
        .insert(activitiesToInsert);
      
      if (error) throw error;
      
      toast.success(`${lancamentos.length} lançamento(s) salvo(s) com sucesso!`);
      
      // Reset forms
      const currentUserProfile = profiles.find(p => p.id === user?.id);
      setLancamentos([getDefaultFormData(currentUserProfile)]);
      
    } catch (error: any) {
      console.error("Error saving activities:", error);
      toast.error("Erro ao salvar lançamentos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-glow bg-clip-text text-transparent">
          Lançamento Diário
        </h1>
        <p className="text-foreground/80">Registre uma ou mais atividades do seu dia</p>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-6">
        {lancamentos.map((formData, index) => (
          <Card key={index} className="glass-card glow-purple border-dashed">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Lançamento {index + 1}
                </CardTitle>
                {lancamentos.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLancamento(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <CardDescription className="text-foreground/80">Preencha os campos abaixo para registrar uma atividade</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`data-${index}`}>Data</Label>
                <Input
                  id={`data-${index}`}
                  type="date"
                  value={formData.data}
                  onChange={(e) => updateLancamento(index, "data", e.target.value)}
                  className="border-primary/20"
                  data-testid={`input-date-${index}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`closer-${index}`}>Closer *</Label>
                <Select 
                  value={formData.closerId} 
                  onValueChange={(value) => updateLancamento(index, "closerId", value)}
                >
                  <SelectTrigger className="border-primary/20" data-testid={`select-closer-${index}`}>
                    <SelectValue placeholder="Selecione o closer" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles
                      .filter(profile => profile.full_name && profile.full_name.trim() !== "")
                      .map(profile => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`bdr-${index}`}>BDR</Label>
                <Input
                  id={`bdr-${index}`}
                  placeholder="Nome do BDR"
                  value={formData.bdr}
                  onChange={(e) => updateLancamento(index, "bdr", e.target.value)}
                  className="border-primary/20"
                  data-testid={`input-bdr-${index}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`leadNome-${index}`}>Lead / Empresa *</Label>
                <Input
                  id={`leadNome-${index}`}
                  placeholder="Nome da empresa"
                  value={formData.leadNome}
                  onChange={(e) => updateLancamento(index, "leadNome", e.target.value)}
                  className="border-primary/20"
                  data-testid={`input-lead-${index}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`faturamento-${index}`}>Faturamento da Empresa</Label>
                <Input
                  id={`faturamento-${index}`}
                  placeholder="Ex: R$ 1.000.000"
                  value={formData.faturamentoEmpresa}
                  onChange={(e) => updateLancamento(index, "faturamentoEmpresa", e.target.value)}
                  className="border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`canal-${index}`}>Canal</Label>
                <Select value={formData.canal} onValueChange={(value) => updateLancamento(index, "canal", value)}>
                  <SelectTrigger className="border-primary/20" data-testid={`select-canal-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inbound">Inbound</SelectItem>
                    <SelectItem value="Outbound">Outbound</SelectItem>
                    <SelectItem value="Webinar">Webinar</SelectItem>
                    <SelectItem value="Vanguarda">Vanguarda</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`qualificacao-${index}`}>Qualificação</Label>
                <Select value={formData.qualificacao} onValueChange={(value) => updateLancamento(index, "qualificacao", value)}>
                  <SelectTrigger className="border-primary/20" data-testid={`select-qualificacao-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Qualificado">Qualificado</SelectItem>
                    <SelectItem value="Não Qualificado">Não Qualificado</SelectItem>
                    <SelectItem value="Não Identificado">Não Identificado</SelectItem>
                    <SelectItem value="Desconhecido">Desconhecido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`reuniaoResgatada-${index}`}>Reunião Resgatada?</Label>
                <Select value={formData.reuniaoResgatada} onValueChange={(value) => updateLancamento(index, "reuniaoResgatada", value)}>
                  <SelectTrigger className="border-primary/20" data-testid={`select-reuniao-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Não">Não</SelectItem>
                    <SelectItem value="Sim">Sim</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`tipoReuniao-${index}`}>Tipo de Reunião</Label>
                <Select value={formData.tipoReuniao} onValueChange={(value) => updateLancamento(index, "tipoReuniao", value)}>
                  <SelectTrigger className="border-primary/20" data-testid={`select-meeting-type-${index}`}>
                    <SelectValue />
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
                <Label htmlFor={`statusAtividade-${index}`}>Status da Atividade</Label>
                <Select value={formData.statusAtividade} onValueChange={(value) => updateLancamento(index, "statusAtividade", value)}>
                  <SelectTrigger className="border-primary/20" data-testid={`select-status-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Reunião Realizada">Reunião Realizada</SelectItem>
                    <SelectItem value="No Show">No Show</SelectItem>
                    <SelectItem value="Reagendada">Reagendada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`propostaEnviada-${index}`}>Proposta Enviada?</Label>
                <Select value={formData.propostaEnviada} onValueChange={(value) => updateLancamento(index, "propostaEnviada", value)}>
                  <SelectTrigger className="border-primary/20" data-testid={`select-proposta-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Não">Não</SelectItem>
                    <SelectItem value="Sim">Sim</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`evolucaoFunil-${index}`}>Evolução no Funil</Label>
                <Select value={formData.evolucaoFunil} onValueChange={(value) => updateLancamento(index, "evolucaoFunil", value)}>
                  <SelectTrigger className="border-primary/20" data-testid={`select-evolucao-${index}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Nenhuma">Nenhuma</SelectItem>
                    <SelectItem value="R1 > R2">R1 &gt; R2</SelectItem>
                    <SelectItem value="R2 > R3">R2 &gt; R3</SelectItem>
                    <SelectItem value="R3 > R4">R3 &gt; R4</SelectItem>
                    <SelectItem value="R4 > R5">R4 &gt; R5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`valorProposta-${index}`}>Valor da Proposta (R$)</Label>
                <Input
                  id={`valorProposta-${index}`}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.valorProposta}
                  onChange={(e) => updateLancamento(index, "valorProposta", e.target.value)}
                  className="border-primary/20"
                  data-testid={`input-proposta-${index}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`observacoes-${index}`}>Observações</Label>
              <Textarea
                id={`observacoes-${index}`}
                placeholder="Adicione notas sobre a negociação..."
                value={formData.observacoes}
                onChange={(e) => updateLancamento(index, "observacoes", e.target.value)}
                className="border-primary/20 min-h-[100px]"
                data-testid={`textarea-obs-${index}`}
              />
            </div>

            </CardContent>
          </Card>
        ))}

        <div className="flex gap-4">
          <Button
            type="button"
            onClick={addLancamento}
            variant="outline"
            className="border-dashed border-primary/50 hover:border-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Lançamento
          </Button>
          <Button type="submit" disabled={loading} className="flex-1 glow-purple-hover">
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Salvando..." : "Salvar Todos os Lançamentos"}
          </Button>
        </div>
      </form>
    </div>
  );
}
