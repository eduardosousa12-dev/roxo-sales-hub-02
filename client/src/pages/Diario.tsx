import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Plus, Save } from "lucide-react";

export default function Diario() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split("T")[0],
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.leadNome) {
      toast.error("Preencha o nome do lead/empresa");
      return;
    }
    
    try {
      setLoading(true);
      
      // First, create or get the lead
      let leadName = formData.leadNome;
      const { data: existingLead } = await supabase
        .from("leads")
        .select("id, name")
        .eq("name", formData.leadNome)
        .single();
      
      if (!existingLead) {
        const { data: newLead, error: leadError } = await supabase
          .from("leads")
          .insert({
            name: formData.leadNome,
            notes: formData.faturamentoEmpresa ? `Faturamento: ${formData.faturamentoEmpresa}` : null,
          })
          .select("id, name")
          .single();
        
        if (leadError) {
          console.error("Lead creation error:", leadError);
        }
        if (newLead) {
          leadName = newLead.name;
        }
      }
      
      // Create the activity
      const { error } = await supabase
        .from("activities")
        .insert({
          date: formData.data,
          closer: user?.email || null,
          closer_id: user?.id,
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
      
      if (error) throw error;
      
      toast.success("Lançamento salvo com sucesso!");
      
      // Reset form
      setFormData({
        data: new Date().toISOString().split("T")[0],
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
      
    } catch (error: any) {
      console.error("Error saving activity:", error);
      toast.error("Erro ao salvar lançamento");
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
        <p className="text-muted-foreground">Registre uma ou mais atividades do seu dia</p>
      </div>

      <Card className="glass-card glow-purple">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Nova Atividade
          </CardTitle>
          <CardDescription>Preencha os campos abaixo para registrar uma atividade</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data">Data</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className="border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="leadNome">Lead / Empresa *</Label>
                <Input
                  id="leadNome"
                  placeholder="Nome da empresa"
                  value={formData.leadNome}
                  onChange={(e) => setFormData({ ...formData, leadNome: e.target.value })}
                  className="border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="faturamento">Faturamento da Empresa</Label>
                <Input
                  id="faturamento"
                  placeholder="Ex: R$ 1.000.000"
                  value={formData.faturamentoEmpresa}
                  onChange={(e) => setFormData({ ...formData, faturamentoEmpresa: e.target.value })}
                  className="border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="canal">Canal</Label>
                <Select value={formData.canal} onValueChange={(value) => setFormData({ ...formData, canal: value })}>
                  <SelectTrigger className="border-primary/20">
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
                <Label htmlFor="qualificacao">Qualificação</Label>
                <Select value={formData.qualificacao} onValueChange={(value) => setFormData({ ...formData, qualificacao: value })}>
                  <SelectTrigger className="border-primary/20">
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
                <Label htmlFor="reuniaoResgatada">Reunião Resgatada?</Label>
                <Select value={formData.reuniaoResgatada} onValueChange={(value) => setFormData({ ...formData, reuniaoResgatada: value })}>
                  <SelectTrigger className="border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Não">Não</SelectItem>
                    <SelectItem value="Sim">Sim</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoReuniao">Tipo de Reunião</Label>
                <Select value={formData.tipoReuniao} onValueChange={(value) => setFormData({ ...formData, tipoReuniao: value })}>
                  <SelectTrigger className="border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="R1">R1</SelectItem>
                    <SelectItem value="R2">R2</SelectItem>
                    <SelectItem value="R3">R3</SelectItem>
                    <SelectItem value="R4">R4</SelectItem>
                    <SelectItem value="R5">R5</SelectItem>
                    <SelectItem value="-Sa">-Sa</SelectItem>
                    <SelectItem value="acima de 750k">acima de 750k</SelectItem>
                    <SelectItem value="150k a 750k">150k a 750k</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="statusAtividade">Status da Atividade</Label>
                <Select value={formData.statusAtividade} onValueChange={(value) => setFormData({ ...formData, statusAtividade: value })}>
                  <SelectTrigger className="border-primary/20">
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
                <Label htmlFor="propostaEnviada">Proposta Enviada?</Label>
                <Select value={formData.propostaEnviada} onValueChange={(value) => setFormData({ ...formData, propostaEnviada: value })}>
                  <SelectTrigger className="border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Não">Não</SelectItem>
                    <SelectItem value="Sim">Sim</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="evolucaoFunil">Evolução no Funil</Label>
                <Select value={formData.evolucaoFunil} onValueChange={(value) => setFormData({ ...formData, evolucaoFunil: value })}>
                  <SelectTrigger className="border-primary/20">
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
                <Label htmlFor="valorProposta">Valor da Proposta (R$)</Label>
                <Input
                  id="valorProposta"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.valorProposta}
                  onChange={(e) => setFormData({ ...formData, valorProposta: e.target.value })}
                  className="border-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Adicione notas sobre a negociação..."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="border-primary/20 min-h-[100px]"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full glow-purple-hover">
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Salvando..." : "Salvar Lançamento"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
