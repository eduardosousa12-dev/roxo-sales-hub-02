import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Settings, UserPlus, Edit, Trash2, Save, X, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Profile {
  id: string;
  full_name: string | null;
  is_active?: boolean;
  email?: string; // Opcional, será buscado separadamente se necessário
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
}

const ROLES = ["super_admin", "admin", "closer", "bdr", "financeiro", "gestor"];

export default function Admin() {
  const { isSuperAdmin, user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<Map<string, string[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "closer",
  });

  const [location] = useLocation();

  useEffect(() => {
    // Aguardar autenticação antes de verificar permissões e carregar dados
    if (authLoading) {
      console.log("⏳ Admin: Aguardando autenticação...");
      return;
    }
    if (!user) {
      console.log("❌ Admin: Usuário não autenticado");
      return;
    }
    
    console.log("✅ Admin: Autenticado, verificando permissões...");
    if (!isSuperAdmin) {
      toast.error("Acesso negado. Apenas Super Admin pode acessar esta página.");
      setLocation("/");
      return;
    }
    // Forçar reload sempre que a página é acessada
    console.log("✅ Admin: É super admin, carregando usuários...");
    loadUsers();
  }, [isSuperAdmin, setLocation, location, authLoading, user]);

  const loadUsers = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Forçar refresh limpando cache se necessário
      if (forceRefresh) {
        // Limpar qualquer cache local se houver
        console.log("🔄 Forçando refresh dos dados...");
      }
      
      // Load profiles (sem cache, sempre buscar do servidor)
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, is_active")
        .order("full_name");

      if (profilesError) {
        console.error("❌ Erro ao carregar profiles:", profilesError);
        throw profilesError;
      }

      console.log(`✅ Profiles carregados: ${profilesData?.length || 0}`);
      setProfiles(profilesData || []);

      // Load super admins (nova tabela simples)
      const { data: superAdminsData, error: superAdminsError } = await supabase
        .from("super_admins")
        .select("user_id");

      if (superAdminsError) {
        console.error("⚠️ Erro ao carregar super_admins:", superAdminsError);
        // Não quebrar se a tabela não existir ainda
        if (superAdminsError.code !== '42P01') { // 42P01 = table does not exist
          throw superAdminsError;
        }
        console.log("ℹ️ Tabela super_admins não existe ainda, continuando sem roles");
      }

      const rolesMap = new Map<string, string[]>();
      // Adicionar super_admin para usuários que estão na tabela super_admins
      (superAdminsData || []).forEach((sa: { user_id: string }) => {
        rolesMap.set(sa.user_id, ['super_admin']);
      });

      console.log(`✅ Super admins encontrados: ${superAdminsData?.length || 0}`);
      setUserRoles(rolesMap);
    } catch (error: any) {
      console.error("❌ Erro ao carregar usuários:", error);
      toast.error(`Erro ao carregar usuários: ${error?.message || 'Erro desconhecido'}`);
      // Garantir que loading seja false mesmo com erro
      setProfiles([]);
      setUserRoles(new Map());
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!formData.email || !formData.password || !formData.full_name) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }

      // Note: Creating users requires Supabase Admin API (service role key)
      // This should be done server-side. For now, we'll show instructions.
      toast.info("Criação de usuários deve ser feita através do Supabase Dashboard ou API server-side. Use o botão 'Editar' para gerenciar usuários existentes.");
      setIsCreateDialogOpen(false);
      
      // Alternative: Use signUp (but requires email confirmation)
      // const { data, error } = await supabase.auth.signUp({
      //   email: formData.email,
      //   password: formData.password,
      //   options: {
      //     data: {
      //       nome_completo: formData.full_name,
      //     },
      //   },
      // });
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Erro ao criar usuário");
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: editingUser.full_name,
          is_active: editingUser.is_active,
        })
        .eq("id", editingUser.id);

      if (profileError) throw profileError;

      toast.success("Usuário atualizado com sucesso!");
      setIsDialogOpen(false);
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.message || "Erro ao atualizar usuário");
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      if (newRole === 'super_admin') {
        // Adicionar como super admin
        const { error: insertError } = await supabase
          .from("super_admins")
          .insert({ user_id: userId })
          .onConflict('user_id')
          .ignore();

        if (insertError) throw insertError;
        toast.success("Usuário promovido a Super Admin!");
      } else {
        // Remover de super_admins se não for super_admin
        const { error: deleteError } = await supabase
          .from("super_admins")
          .delete()
          .eq("user_id", userId);

        if (deleteError && deleteError.code !== '42P01') { // Ignorar se tabela não existir
          throw deleteError;
        }
        toast.success("Role atualizado com sucesso!");
      }
      
      // Recarregar dados
      await loadUsers();
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast.error(error.message || "Erro ao atualizar role");
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: false })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Usuário desativado com sucesso!");
      loadUsers();
    } catch (error: any) {
      console.error("Error deactivating user:", error);
      toast.error(error.message || "Erro ao desativar usuário");
    }
  };

  const getUserRoles = (userId: string): string[] => {
    return userRoles.get(userId) || [];
  };

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-glow bg-clip-text text-transparent">
          Administração
        </h1>
        <p className="text-foreground/70">Gerencie usuários e permissões do sistema</p>
      </div>

      <Card className="glass-card border-2 border-primary/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Usuários do Sistema
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                onClick={loadUsers} 
                variant="outline" 
                disabled={loading}
                className="glow-purple-hover"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="glow-purple-hover">
                <UserPlus className="mr-2 h-4 w-4" />
                Criar Usuário
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-pulse text-primary text-xl">Carregando usuários...</div>
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center text-foreground/70 py-12">
              <p className="mb-4">Nenhum usuário encontrado</p>
              <Button onClick={() => loadUsers(true)} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar Novamente
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground font-semibold">Nome</TableHead>
                    <TableHead className="text-foreground font-semibold">Email</TableHead>
                    <TableHead className="text-foreground font-semibold">Roles</TableHead>
                    <TableHead className="text-foreground font-semibold">Status</TableHead>
                    <TableHead className="text-right text-foreground font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => {
                    const roles = getUserRoles(profile.id);
                    return (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium align-middle py-2">
                          {profile.full_name || "Sem nome"}
                        </TableCell>
                        <TableCell className="text-foreground/70 align-middle py-2">
                          {profile.email || profile.id.substring(0, 8) + "..."}
                        </TableCell>
                        <TableCell className="align-middle py-2">
                          <div className="flex gap-2 flex-wrap items-center">
                            {roles.map((role) => (
                              <Badge key={role} variant="outline" className="whitespace-nowrap">
                                {role}
                              </Badge>
                            ))}
                            {roles.length === 0 && (
                              <span className="text-foreground/50">Sem role</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-middle py-2">
                          <Badge variant={profile.is_active !== false ? "default" : "secondary"} className="whitespace-nowrap">
                            {profile.is_active !== false ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right align-middle py-2">
                          <div className="flex gap-2 justify-end items-center min-w-[220px]">
                            <Select
                              value={roles[0] || "closer"}
                              onValueChange={(value) => handleUpdateRole(profile.id, value)}
                            >
                              <SelectTrigger className="w-[130px] h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLES.map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {role}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 flex-shrink-0"
                              onClick={() => {
                                setEditingUser(profile);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              className={`h-9 w-9 flex-shrink-0 ${profile.id === user?.id ? 'invisible' : ''}`}
                              onClick={() => handleDeactivateUser(profile.id)}
                              disabled={profile.id === user?.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  value={editingUser.full_name || ""}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, full_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editingUser.is_active !== false ? "ativo" : "inativo"}
                  onValueChange={(value) =>
                    setEditingUser({ ...editingUser, is_active: value === "ativo" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser}>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Senha *</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label>Nome Completo *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Nome do usuário"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={handleCreateUser}>
              <UserPlus className="mr-2 h-4 w-4" />
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

