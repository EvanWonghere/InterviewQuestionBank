import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const epoch = useRef(0);
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const refreshAdmin = useCallback(async (nextSession) => {
    const ticket = ++epoch.current;
    setSession(nextSession); setIsAdmin(false); setLoading(Boolean(nextSession?.user));
    if (!supabase || !nextSession?.user) { setLoading(false); return; }
    // Defer Supabase calls out of onAuthStateChange's synchronous callback.
    await new Promise(resolve => setTimeout(resolve, 0));
    if (ticket !== epoch.current) return;
    let data = false, error = null;
    try { ({ data, error } = await supabase.rpc('is_app_admin')); }
    catch (cause) { error = cause; }
    if (ticket !== epoch.current) return;
    setIsAdmin(!error && data === true); setLoading(false);
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    const generation = epoch;
    const initialEpoch = epoch.current;
    supabase.auth.getSession().then(({ data }) => {
      if (active && epoch.current === initialEpoch) void refreshAdmin(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) void refreshAdmin(nextSession);
    });
    return () => { active = false; ++generation.current; listener.subscription.unsubscribe(); };
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
