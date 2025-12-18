import { useNavigate } from "react-router-dom";
import NavLogo from "../assets/NavLogo.png";

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#111827]">
      {/* Top navigation */}
      <header className="sticky top-0 z-100 border-b border-gray-200 bg-white shadow-[0px_4px_6px_-2px_rgba(0,0,0,0.1)] rounded-b-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 cursor-pointer"
          >
            <img src={NavLogo} alt="VitaTrack" className="h-8 w-auto" />
          </button>

          <div className="flex items-center gap-3">
            <a
              href="/signin"
              className="hidden text-sm font-medium text-gray-700 hover:text-[#1A381D] sm:inline-block"
            >
              Sign in
            </a>
            <a
              href="/signup"
              className="rounded-full bg-[#1A381D] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2A4A2D]"
            >
              Get started
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:py-14 sm:px-6 lg:flex-row lg:items-center lg:py-16 lg:px-8">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#E5F3E2] px-3 py-1 text-xs font-semibold text-[#166534]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                Smart health companion for busy people
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl md:text-5xl">
                  Stay on top of your{" "}
                  <span className="text-[#1A381D]">nutrition, workouts</span>{" "}
                  and progress.
                </h1>
                <p className="max-w-xl text-sm text-gray-600 sm:text-base">
                  VitaTrack combines AI-powered guidance, simple logging, and
                  clear progress insights so you can build healthy habits that
                  actually stick.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="inline-flex items-center justify-center rounded-full bg-[#1A381D] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#2A4A2D] cursor-pointer"
                >
                  Create your free account
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/signin")}
                  className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:border-[#1A381D] hover:text-[#1A381D] cursor-pointer"
                >
                  I already have an account
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500 sm:text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#DDF3D8] text-[11px] font-semibold text-[#166534]">
                    ✓
                  </span>
                  No credit card required
                </div>
                <div className="h-1 w-1 rounded-full bg-gray-300" />
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#DDF3D8] text-[11px] font-semibold text-[#166534]">
                    ✓
                  </span>
                  Designed for students & working adults
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-[#F9FAFB] p-4 sm:p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Today&apos;s overview
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#111827]">
                      You&apos;re on track for your goals 🎯
                    </p>
                  </div>
                  <span className="rounded-full bg-[#DDF3D8] px-3 py-1 text-xs font-semibold text-[#166534]">
                    VitaTrack
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="rounded-xl border border-green-100 bg-white p-3">
                    <p className="text-[11px] font-medium text-gray-500">
                      Calories
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#166534]">
                      1,280
                    </p>
                    <p className="mt-1 text-[11px] text-gray-500">
                      65% of daily target
                    </p>
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-white p-3">
                    <p className="text-[11px] font-medium text-gray-500">
                      Steps
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#1D4ED8]">
                      7,420
                    </p>
                    <p className="mt-1 text-[11px] text-gray-500">
                      Keep going!
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-white p-3">
                    <p className="text-[11px] font-medium text-gray-500">
                      Workouts
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#92400E]">
                      3 / 4
                    </p>
                    <p className="mt-1 text-[11px] text-gray-500">
                      sessions this week
                    </p>
                  </div>
                  <div className="rounded-xl border border-purple-100 bg-white p-3">
                    <p className="text-[11px] font-medium text-gray-500">
                      Streak
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#6D28D9]">
                      12 days
                    </p>
                    <p className="mt-1 text-[11px] text-gray-500">
                      Don't break it!
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-[11px] text-gray-500">
                  Sync your meals, workouts, and progress in one place.
                  VitaTrack keeps you accountable, without feeling overwhelming.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="border-b border-gray-200 bg-[#F5F7FA] py-10 sm:py-14"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">
                Everything you need to build healthier habits
              </h2>
              <p className="mt-2 text-sm text-gray-600 sm:text-base">
                Simple enough to use every day, powerful enough to keep you
                motivated.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-[#111827]">
                  Personalized dashboard
                </h3>
                <p className="mt-2 text-xs text-gray-600 sm:text-sm">
                  See calories, macros, and workouts in a single clean view that
                  updates as you log.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-[#111827]">
                  AI health chatbot
                </h3>
                <p className="mt-2 text-xs text-gray-600 sm:text-sm">
                  Ask questions about your meals and routines and get
                  bite-sized, practical suggestions.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-[#111827]">
                  Progress & motivation
                </h3>
                <p className="mt-2 text-xs text-gray-600 sm:text-sm">
                  Weekly summaries, streak tracking, and gentle nudges to keep
                  you consistent.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="bg-white py-10 sm:py-14">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">
                Get started in three simple steps
              </h2>
            </div>

            <ol className="grid gap-6 text-sm text-gray-700 sm:grid-cols-3">
              <li className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-[#F9FAFB] p-5">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1A381D] text-xs font-semibold text-white">
                  1
                </span>
                <h3 className="text-sm font-semibold text-[#111827]">
                  Create your free account
                </h3>
                <p className="text-xs text-gray-600 sm:text-sm">
                  Sign up in under a minute with your email or Google account.
                </p>
              </li>
              <li className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-[#F9FAFB] p-5">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1A381D] text-xs font-semibold text-white">
                  2
                </span>
                <h3 className="text-sm font-semibold text-[#111827]">
                  Tell us about your goals
                </h3>
                <p className="text-xs text-gray-600 sm:text-sm">
                  Complete a short onboarding flow so VitaTrack can adapt to
                  you.
                </p>
              </li>
              <li className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-[#F9FAFB] p-5">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1A381D] text-xs font-semibold text-white">
                  3
                </span>
                <h3 className="text-sm font-semibold text-[#111827]">
                  Log, chat, and track
                </h3>
                <p className="text-xs text-gray-600 sm:text-sm">
                  Log meals and workouts, chat with the AI assistant, and watch
                  your progress over time.
                </p>
              </li>
            </ol>

            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="inline-flex items-center justify-center rounded-full bg-[#1A381D] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#2A4A2D] cursor-pointer"
              >
                Start free with VitaTrack
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-gray-500 sm:flex-row sm:px-6 lg:px-8">
          <p>©2026 VitaTrack. All Rights Reserved.</p>
          <div className="flex items-center gap-4">
            <a href="/signin" className="hover:text-[#1A381D]">
              Sign in
            </a>
            <a href="/signup" className="hover:text-[#1A381D]">
              Create account
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
