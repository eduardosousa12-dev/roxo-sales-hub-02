import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "wouter";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRoles: string[];
  isSuperAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, nomeCompleto: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [, setLocation] = useLocation();

  // Contador para ignorar respostas obsoletas de loadUserRoles
  const roleRequestIdRef = React.useRef(0);

  const checkUserRole = async () => {
    if (!user) {
      setUserRoles([]);
      setIsSuperAdmin(false);
      return;
    }

    try {
      // Verificar se está na tabela super_admins
      const { data, error } = await supabase
        .from("super_admins")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }

      const isSuperAdmin = !!data;
      
      setUserRoles(isSuperAdmin ? ['super_admin'] : []);
      setIsSuperAdmin(isSuperAdmin);
      
      console.log(`👑 É Super Admin? ${isSuperAdmin}`);
    } catch (error) {
      console.error("Error checking super admin:", error);
      setUserRoles([]);
      setIsSuperAdmin(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    // Flag para indicar que getSession() completou - só então processamos eventos
    let initialized = false;

    const loadUserRoles = async (userId: string) => {
      // Incrementar contador para invalidar requisições anteriores
      const currentRequestId = ++roleRequestIdRef.current;
      console.log(`👑 [Role Request ${currentRequestId}] Verificando super admin para:`, userId);

      try {
        // Verificar se está na tabela super_admins
        const { data, error } = await supabase
          .from("super_admins")
          .select("user_id")
          .eq("user_id", userId)
          .single();

        // Verificar se esta requisição ainda é válida
        if (currentRequestId !== roleRequestIdRef.current || !mounted) {
          console.log(`⚠️ [Role Request ${currentRequestId}] Requisição obsoleta, ignorando`);
          return;
        }

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
          throw error;
        }

        const isSuperAdmin = !!data;

        setUserRoles(isSuperAdmin ? ['super_admin'] : []);
        setIsSuperAdmin(isSuperAdmin);

        console.log(`👑 [Role Request ${currentRequestId}] É Super Admin? ${isSuperAdmin}`);
      } catch (error) {
        if (currentRequestId !== roleRequestIdRef.current || !mounted) {
          return;
        }
        console.error(`❌ [Role Request ${currentRequestId}] Error checking super admin:`, error);
        setUserRoles([]);
        setIsSuperAdmin(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log(`🔐 Auth event: ${event}`, session?.user?.email, `(initialized: ${initialized})`);

        // Ignorar TODOS os eventos até getSession() completar
        // Isso garante que o Supabase client esteja completamente inicializado
        if (!initialized) {
          console.log(`⏳ Aguardando inicialização, ignorando evento ${event}`);
          return;
        }

        // Apenas SIGNED_OUT deve limpar a sessão
        if (event === 'SIGNED_OUT') {
          console.log('⚠️ Usuário deslogado');
          setUser(null);
          setSession(null);
          setUserRoles([]);
          setIsSuperAdmin(false);
          setLoading(false);
          return;
        }

        // Para eventos com sessão válida (após login, token refresh, etc.)
        if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          console.log(`✅ ${event}: Atualizando sessão`);
          setSession(session);
          const currentUser = session.user;
          setUser(currentUser);

          if (currentUser) {
            await loadUserRoles(currentUser.id);
          }

          setLoading(false);
        }
      }
    );

    // Timeout para garantir que loading sempre seja false
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.log("⚠️ Timeout de inicialização atingido");
        initialized = true;
        setLoading(false);
      }
    }, 5000);

    // getSession() é a fonte primária de verdade para a sessão inicial
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(timeoutId);
      if (!mounted) return;

      console.log("🔐 AuthContext: Sessão obtida", session ? "com usuário" : "sem usuário");
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        console.log("👤 AuthContext: Carregando roles para usuário:", currentUser.email);
        try {
          await loadUserRoles(currentUser.id);
        } catch (error) {
          console.error("❌ AuthContext: Erro ao carregar roles:", error);
          if (mounted) {
            setUserRoles([]);
            setIsSuperAdmin(false);
          }
        }
      } else {
        console.log("⚠️ AuthContext: Nenhum usuário na sessão");
        setUserRoles([]);
        setIsSuperAdmin(false);
      }

      // Marcar como inicializado ANTES de setar loading false
      // Isso permite que eventos futuros sejam processados
      initialized = true;
      console.log("✅ AuthContext: Inicialização completa");

      if (mounted) {
        setLoading(false);
      }
    }).catch((error) => {
      clearTimeout(timeoutId);
      console.error("❌ AuthContext: Erro ao obter sessão:", error);
      initialized = true; // Mesmo com erro, marcar como inicializado
      if (mounted) {
        setLoading(false);
        setUserRoles([]);
        setIsSuperAdmin(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error };
  };

  const signUp = async (email: string, password: string, nomeCompleto: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          nome_completo: nomeCompleto,
        },
      },
    });
    
    return { error };
  };

  const signOut = async () => {
    try {
      console.log("🚪 Fazendo logout...");
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("❌ Erro ao fazer logout:", error);
      }
      // Limpar estado local também
      setUser(null);
      setSession(null);
      setUserRoles([]);
      setIsSuperAdmin(false);
      console.log("✅ Logout concluído");
      setLocation("/auth");
    } catch (err) {
      console.error("❌ Erro crítico no logout:", err);
      // Forçar logout mesmo com erro
      setUser(null);
      setSession(null);
      setLocation("/auth");
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userRoles, isSuperAdmin, signIn, signUp, signOut, checkUserRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
