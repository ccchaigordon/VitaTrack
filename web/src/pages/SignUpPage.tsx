import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { getSupabase, setAuthPersistence } from "../services/supabase";
import { getErrorMessage } from "../utils/errors";

export function SignUpPage() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);
    try {
      setAuthPersistence(keepLoggedIn);
      const supabase = getSupabase();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw new Error(error.message);

      if (!data.session) {
        setInfoMsg(
          "Account created. Please check your email to confirm your account, then sign in."
        );
        return;
      }

      // If session exists, proceed to onboarding and let onboarding update username/full_name.
      nav("/onboarding", { replace: true, state: { username } });
    } catch (err: unknown) {
      setErrorMsg(getErrorMessage(err, "Sign up failed"));
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
      setErrorMsg(getErrorMessage(err, "Google sign-up failed"));
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Sign up"
      subtitle="Sign up to enjoy the features of VitaTrack"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">
            Username
          </label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your username"
            autoComplete="username"
            required
          />
        </div>

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
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="text-xs text-slate-500"
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

        {infoMsg ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {infoMsg}
          </div>
        ) : null}

        {errorMsg ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMsg}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          Sign up
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
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 disabled:opacity-60"
        >
          Continue with Google
        </button>

        <div className="pt-2 text-sm text-slate-500">
          Already have an account??{" "}
          <Link className="font-medium text-slate-900 underline" to="/signin">
            Sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
