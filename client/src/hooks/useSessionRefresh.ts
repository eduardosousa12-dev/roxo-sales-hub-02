import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Singleton para evitar múltiplos intervalos
let sessionRefreshTimer: ReturnType<typeof setInterval> | null = null;
let activeHooks = 0;

const startSessionRefresh = () => {
  if (sessionRefreshTimer) return; // Já está rodando

  sessionRefreshTimer = setInterval(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Erro ao verificar sessão:', error);
        return;
      }

      if (session) {
        const expiresAt = session.expires_at;
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt ? expiresAt - now : 0;

        // Se faltar menos de 2 minutos para expirar, fazer refresh
        if (timeUntilExpiry < 120) {
          console.log('🔄 Token próximo de expirar, fazendo refresh...');
          const { error: refreshError } = await supabase.auth.refreshSession();

          if (refreshError) {
            console.error('❌ Erro ao fazer refresh do token:', refreshError);
          } else {
            console.log('✅ Token atualizado com sucesso');
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro no useSessionRefresh:', error);
    }
  }, 90000); // Verificar a cada 90 segundos
};

const stopSessionRefresh = () => {
  if (sessionRefreshTimer) {
    clearInterval(sessionRefreshTimer);
    sessionRefreshTimer = null;
  }
};

/**
 * Hook para manter a sessão ativa e forçar refresh do token periodicamente
 * Usa singleton pattern para garantir que apenas um intervalo existe
 */
export function useSessionRefresh() {
  useEffect(() => {
    activeHooks++;

    if (activeHooks === 1) {
      startSessionRefresh();
    }

    return () => {
      activeHooks--;
      if (activeHooks === 0) {
        stopSessionRefresh();
      }
    };
  }, []);
}
