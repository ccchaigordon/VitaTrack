import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { apiFetch } from "../services/api";
import { getSupabase, setAuthPersistence } from "../services/supabase";
import { getErrorMessage } from "../utils/errors";

type MeResponse = {
  profileComplete: boolean;
};

export function SignInPage() {
  const nav = useNavigate();
  const location = useLocation();
  const from = useMemo(() => {
    const state = location.state;
    if (!state || typeof state !== "object") return null;
    const maybeFrom = (state as { from?: unknown }).from;
    if (!maybeFrom || typeof maybeFrom !== "object") return null;
    const maybePathname = (maybeFrom as { pathname?: unknown }).pathname;
    return typeof maybePathname === "string" ? maybePathname : null;
  }, [location.state]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function afterLoginNavigate() {
    // Return to a protected page if the user was redirected here
    if (from) {
      nav(from, { replace: true });
      return;
    }

    const me = await apiFetch<MeResponse>("/me");
    nav(me.profileComplete ? "/dashboard" : "/onboarding", { replace: true });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      setAuthPersistence(keepLoggedIn);
      const supabase = getSupabase();

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error(error.message);

      await afterLoginNavigate();
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, "Sign in failed"));
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setErrorMsg(null);
    setLoading(true);
    try {
      setAuthPersistence(keepLoggedIn);
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw new Error(error.message);
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, "Google sign-in failed"));
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Please login to continue to your account."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Email
          </label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Password
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 focus-within:border-slate-900">
            <input
              className="w-full bg-transparent text-sm text-slate-900 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="text-xs text-slate-500 cursor-pointer"
              onClick={() => setShowPassword((s) => !s)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={keepLoggedIn}
            onChange={(e) => setKeepLoggedIn(e.target.checked)}
          />
          Keep me logged in
        </label>

        {errorMsg ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMsg}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60 cursor-pointer"
        >
          Sign in
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={onGoogle}
          disabled={loading}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 disabled:opacity-60 cursor-pointer"
        >
          Sign in with Google
        </button>

        <div className="pt-2 text-sm text-slate-500">
          Need an account?{" "}
          <Link className="font-medium text-slate-900 underline" to="/signup">
            Create one
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
