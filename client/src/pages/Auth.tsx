import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Signup form
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupNome, setSignupNome] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast.error("Preencha todos os campos");
      return;
    }
    
    setLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    
    if (error) {
      toast.error(error.message || "Erro ao fazer login");
      setLoading(false);
    } else {
      toast.success("Login realizado com sucesso!");
      setLocation("/");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupEmail || !signupPassword || !signupNome) {
      toast.error("Preencha todos os campos");
      return;
    }
    
    if (signupPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    
    setLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupNome);
    
    if (error) {
      toast.error(error.message || "Erro ao criar conta");
      setLoading(false);
    } else {
      toast.success("Conta criada com sucesso!");
      setLocation("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-glow bg-clip-text text-transparent">
            Grupo Rugido
          </h1>
          <p className="text-muted-foreground">Sistema de CRM & Gestão Comercial</p>
        </div>
        
        <Card className="glass-card glow-purple border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Acesso ao Sistema</CardTitle>
            <CardDescription>Entre com sua conta ou crie uma nova</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Criar Conta</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-mail</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      disabled={loading}
                      className="border-primary/20 focus:border-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={loading}
                      className="border-primary/20 focus:border-primary"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full glow-purple-hover"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-nome">Nome Completo</Label>
                    <Input
                      id="signup-nome"
                      type="text"
                      placeholder="Seu nome completo"
                      value={signupNome}
                      onChange={(e) => setSignupNome(e.target.value)}
                      disabled={loading}
                      className="border-primary/20 focus:border-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-mail</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      disabled={loading}
                      className="border-primary/20 focus:border-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      disabled={loading}
                      className="border-primary/20 focus:border-primary"
                    />
                    <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full glow-purple-hover"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      "Criar Conta"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
