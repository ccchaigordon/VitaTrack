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
          className="flex flex-row items-center justify-center py-1 w-full rounded-lg border border-slate-300 bg-transparent text-sm font-medium text-slate-900 disabled:opacity-60 cursor-pointer"
        >
          Sign in with Google
          <div className="bg-white p-2 rounded-full">
            <svg className="w-4" viewBox="0 0 533.5 544.3">
              <path
                d="M533.5 278.4c0-18.5-1.5-37.1-4.7-55.3H272.1v104.8h147c-6.1 33.8-25.7 63.7-54.4 82.7v68h87.7c51.5-47.4 81.1-117.4 81.1-200.2z"
                fill="#4285f4"
              />
              <path
                d="M272.1 544.3c73.4 0 135.3-24.1 180.4-65.7l-87.7-68c-24.4 16.6-55.9 26-92.6 26-71 0-131.2-47.9-152.8-112.3H28.9v70.1c46.2 91.9 140.3 149.9 243.2 149.9z"
                fill="#34a853"
              />
              <path
                d="M119.3 324.3c-11.4-33.8-11.4-70.4 0-104.2V150H28.9c-38.6 76.9-38.6 167.5 0 244.4l90.4-70.1z"
                fill="#fbbc04"
              />
              <path
                d="M272.1 107.7c38.8-.6 76.3 14 104.4 40.8l77.7-77.7C405 24.6 339.7-.8 272.1 0 169.2 0 75.1 58 28.9 150l90.4 70.1c21.5-64.5 81.8-112.4 152.8-112.4z"
                fill="#ea4335"
              />
            </svg>
          </div>
        </button>

        <div className="pt-2 text-sm text-slate-500 text-center">
          Need an account?{" "}
          <Link className="font-medium text-[#1A381D] underline" to="/signup">
            Create one
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
