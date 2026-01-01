import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";
import { getSupabase } from "../services/supabase";
import { getErrorMessage } from "../utils/errors";

type MeResponse = {
  profileComplete: boolean;
  user?: { username?: string | null };
};

export function AuthCallbackPage() {
  const nav = useNavigate();
  const [msg, setMsg] = useState("Completing sign-in…");

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase.auth.getSession();
        if (error) throw new Error(error.message);
        if (!data.session) {
          setMsg(
            "No session found. If you just confirmed your email, please go to Sign in."
          );
          return;
        }

        const me = await apiFetch<MeResponse>("/me");

        const pendingUsername =
          sessionStorage.getItem("vitatrack_oauth_username")?.trim() ?? "";
        const currentUsername = me?.user?.username ?? null;
        if (pendingUsername && !currentUsername) {
          sessionStorage.removeItem("vitatrack_oauth_username");
          try {
            await apiFetch("/me/profile", {
              method: "PUT",
              json: { username: pendingUsername },
            });
          } catch {
            // allow users to create username once if they didn't set it already
          }
        }
        if (!mounted) return;
        nav(me.profileComplete ? "/home" : "/onboarding", {
          replace: true,
        });
      } catch (err: unknown) {
        setMsg(getErrorMessage(err, "Failed to complete sign-in"));
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [nav]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center">
        <div className="text-sm text-slate-700">{msg}</div>
      </div>
    </div>
  );
}
