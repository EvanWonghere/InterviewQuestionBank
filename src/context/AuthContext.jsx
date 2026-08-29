import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const refreshAdmin = useCallback(async (nextSession) => {
    if (!supabase || !nextSession?.user) {
      setIsAdmin(false);
      return false;
    }
    const { data, error } = await supabase.rpc('is_app_admin');
    if (error) {
      setIsAdmin(false);
      return false;
    }
    setIsAdmin(Boolean(data));
    return Boolean(data);
  }, []);

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await refreshAdmin(data.session);
      if (active) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      refreshAdmin(nextSession).finally(() => setLoading(false));
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [refreshAdmin]);

  const signIn = useCallback(async () => {
    if (!supabase) throw new Error('尚未配置 Supabase。');
    sessionStorage.setItem('iqb:return-after-auth', window.location.hash || '#/manage/questions');
    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
  }, []);

  useEffect(() => {
    if (!session) return;
    const target = sessionStorage.getItem('iqb:return-after-auth');
    if (target) {
      sessionStorage.removeItem('iqb:return-after-auth');
      window.location.hash = target.replace(/^#/, '');
    }
  }, [session]);

  const value = useMemo(
    () => ({ session, user: session?.user ?? null, isAdmin, loading, signIn, signOut, configured: isSupabaseConfigured }),
    [session, isAdmin, loading, signIn, signOut]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
