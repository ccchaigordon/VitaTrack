import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";
import { getSupabase } from "../services/supabase";

type MeResponse = {
  user: {
    email: string;
    username: string | null;
    full_name: string | null;
  } | null;
  profileComplete: boolean;
};

export function DashboardPage() {
  const nav = useNavigate();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiFetch<MeResponse>("/me")
      .then((r) => {
        if (!mounted) return;
        setMe(r);
        if (!r.profileComplete) nav("/onboarding", { replace: true });
      })
      .catch((e) => {
        if (!mounted) return;
        setErrorMsg(e?.message || "Failed to load dashboard");
      });
    return () => {
      mounted = false;
    };
  }, [nav]);

  async function logout() {
    const supabase = getSupabase();
    await supabase.auth.signOut();
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
          {errorMsg ? (
            <div className="text-sm text-red-700">{errorMsg}</div>
          ) : null}
          {!me && !errorMsg ? (
            <div className="text-sm text-slate-600">Loading…</div>
          ) : null}
          {me ? (
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
