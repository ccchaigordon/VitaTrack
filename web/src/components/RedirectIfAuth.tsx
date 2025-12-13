import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getSupabase } from "../services/supabase";

export function RedirectIfAuth({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabase();

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setHasSession(Boolean(data.session));
      setLoading(false);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session));
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) return null;
  if (hasSession) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
