import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { getSupabase } from "../services/supabase";

export function DashboardPage() {
  const nav = useNavigate();
  const { me, loading, error } = useUser();

  useEffect(() => {
    if (!loading && me && !me.profileComplete) {
      nav("/onboarding", { replace: true });
    }
  }, [loading, me, nav]);

  async function logout() {
    const supabase = getSupabase();
    try {
      await supabase.auth.signOut();
    } catch {
      localStorage.clear();
      sessionStorage.clear();
    }
    nav("/signin", { replace: true });
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-4xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold text-slate-900">
              Dashboard
            </div>
            <div className="mt-1 text-sm text-slate-500">
              Logged-in area (placeholder)
            </div>
          </div>
          <button
            onClick={logout}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900"
          >
            Logout
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 p-4">
          {error ? <div className="text-sm text-red-700">{error}</div> : null}
          {loading ? (
            <div className="text-sm text-slate-600">Loading…</div>
          ) : null}
          {me && !loading ? (
            <div className="space-y-1 text-sm text-slate-700">
              <div>
                <span className="font-medium">Email:</span>{" "}
                {me.user?.email ?? "(unknown)"}
              </div>
              <div>
                <span className="font-medium">Username:</span>{" "}
                {me.user?.username ?? "(not set)"}
              </div>
              <div>
                <span className="font-medium">Full name:</span>{" "}
                {me.user?.full_name ?? "(not set)"}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
