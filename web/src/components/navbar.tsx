import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSupabase } from "../services/supabase";
import { useUser } from "../contexts/UserContext";
import NavLogo from "../assets/NavLogo.png";

function firstChar(v: string) {
  const s = v.trim();
  return s ? s[0].toUpperCase() : "U";
}

function normalizePlanLabel(planName: string | null | undefined) {
  const name = (planName || "").trim();
  if (!name) return "FREE";
  const upper = name.toUpperCase();
  return upper.length > 12 ? upper.slice(0, 12) : upper;
}

function DotSeparator() {
  return (
    <li className="text-gray-300">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        stroke="currentColor"
        className="h-4 w-4"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 5v0m0 7v0m0 7v0m0-13a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
        />
      </svg>
    </li>
  );
}

function PlanBadge({
  label,
  gradient = true,
}: {
  label: string;
  gradient?: boolean;
}) {
  return (
    <span
      className={`relative rounded-md bg-[#EAF1FF]/30 px-2 py-0.5 text-[10px] font-semibold text-[#34A853] ${
        gradient ? "plan-badge-gradient" : "plan-badge-solid"
      }`}
    >
      {label}
    </span>
  );
}

function Avatar({
  src,
  letter,
  size = "md",
}: {
  src: string | null;
  letter: string;
  size?: "sm" | "md" | "lg";
}) {
  const [imgError, setImgError] = useState(false);

  const sizeClass =
    size === "sm"
      ? "h-9 w-9 text-sm"
      : size === "lg"
      ? "h-12 w-12 text-base"
      : "h-10 w-10 text-sm";

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt="Avatar"
        className={`${sizeClass} rounded-full object-cover`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`flex ${sizeClass} items-center justify-center rounded-full bg-[#DDF3D8] font-semibold text-[#1A381D]`}
    >
      {letter}
    </div>
  );
}

export default function Navbar() {
  const nav = useNavigate();
  const { me } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileAnimating, setMobileAnimating] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const displayName = useMemo(() => {
    const username = me?.user?.username?.trim();
    if (username) return username;
    const email = me?.user?.email?.trim();
    if (email) return email.split("@")[0];
    return "User";
  }, [me?.user?.email, me?.user?.username]);

  const email = me?.user?.email || "";
  const avatarUrl = me?.user?.avatar_url || null;
  const planLabel = normalizePlanLabel(me?.plan?.plan_name);
  const avatarLetter = firstChar(displayName);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!profileOpen) return;
      const el = profileRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target))
        setProfileOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [profileOpen]);

  async function signOut() {
    const supabase = getSupabase();
    try {
      await supabase.auth.signOut();
    } catch {
      // If the session is invalid, clear storage manually
      localStorage.clear();
      sessionStorage.clear();
    }
    nav("/signin", { replace: true });
  }

  function openMobileMenu() {
    setMobileOpen(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setMobileAnimating(true);
      });
    });
  }

  function closeMobileMenu() {
    setMobileAnimating(false);
    setTimeout(() => setMobileOpen(false), 300);
  }

  return (
    <>
      <nav className="sticky top-0 z-50 flex items-center justify-between bg-white px-4 xl:px-10 py-3 shadow-[0px_4px_6px_-2px_rgba(0,0,0,0.1)] rounded-b-xl">
        <a href="/dashboard" className="text-3xl font-bold leading-none">
          <img src={NavLogo} alt="VitaTrack" className="h-9" />
        </a>

        <div className="flex items-center gap-1 lg:hidden">
          <button
            type="button"
            onClick={openMobileMenu}
            className="flex cursor-pointer items-center rounded-lg p-2 text-[#1A381D] transition-colors hover:bg-[#1A381D]/5"
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <button className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>
        </div>

        <ul className="hidden absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform items-center space-x-3 xl:space-x-6 lg:mx-auto lg:flex lg:w-auto">
          <li>
            <a href="/dashboard" className="text-sm font-bold text-[#1A381D]">
              Home
            </a>
          </li>
          <DotSeparator />
          <li>
            <a
              href="/chatbot"
              className="text-sm text-gray-400 hover:text-gray-500"
            >
              Chatbot
            </a>
          </li>
          <DotSeparator />
          <li>
            <a
              href="/dashboard"
              className="text-sm text-gray-400 hover:text-gray-500"
            >
              Progress
            </a>
          </li>
          <DotSeparator />
          <li>
            <a
              href="/dashboard"
              className="text-sm text-gray-400 hover:text-gray-500"
            >
              Resources
            </a>
          </li>
        </ul>

        <div className="hidden lg:flex flex-row gap-1 xl:gap-2">
          <button className="rounded-full px-3 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm text-[#1A381D] transition duration-200 hover:bg-[#F7F7F9]/80"
            >
              <Avatar src={avatarUrl} letter={avatarLetter} size="sm" />
              <div className="flex flex-col items-start leading-tight">
                <div className="flex items-center gap-2">
                  <div className="max-w-[120px] truncate text-sm font-semibold">
                    {displayName}
                  </div>
                  <PlanBadge label={planLabel} />
                </div>
              </div>
              <svg
                className={`ml-2 xl:ml-8 h-4 w-4 text-[#1A381D]/70 transition-transform duration-200 ${
                  profileOpen ? "rotate-180" : ""
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <div
              className={`absolute right-0 z-50 mt-2 w-[280px] origin-top-right rounded-2xl border border-[#1A381D]/15 bg-white p-3 shadow-lg transition-all duration-200 ${
                profileOpen
                  ? "pointer-events-auto scale-100 opacity-100"
                  : "pointer-events-none scale-95 opacity-0"
              }`}
            >
              <div className="flex items-center gap-3 px-2 py-2">
                <Avatar src={avatarUrl} letter={avatarLetter} size="lg" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold text-[#1A381D]">
                      {displayName}
                    </div>
                    <PlanBadge label={planLabel} gradient={false} />
                  </div>
                  {email && (
                    <div className="truncate text-xs text-[#1A381D]/70">
                      {email}
                    </div>
                  )}
                </div>
              </div>

              <div className="my-2 h-px bg-[#1A381D]/10" />

              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  nav("/profile");
                }}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-[#1A381D] transition-colors hover:bg-[#1A381D]/5"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </span>
                Profile Settings
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  nav("/dashboard");
                }}
                className="mt-1 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-[#1A381D] transition-colors hover:bg-[#1A381D]/5"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </span>
                Help Center
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  nav("/dashboard");
                }}
                className="mt-1 flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-[#1A381D] transition-colors hover:bg-[#1A381D]/5"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </span>
                Upgrade Plan
              </button>

              <div className="my-2 h-px bg-[#1A381D]/10" />

              <button
                type="button"
                onClick={signOut}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-[#1A381D] transition-colors hover:bg-[#1A381D]/5"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A381D]/5">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </span>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            onClick={closeMobileMenu}
            className={`fixed inset-0 bg-black transition-opacity duration-300 ${
              mobileAnimating ? "opacity-25" : "opacity-0"
            }`}
            aria-label="Close menu"
          />
          <nav
            className={`fixed bottom-0 left-0 top-0 flex w-[280px] flex-col overflow-y-auto bg-white shadow-2xl rounded-r-2xl transition-transform duration-300 ease-out ${
              mobileAnimating ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <a href="/dashboard" className="font-bold leading-none">
                <img src={NavLogo} alt="VitaTrack" className="h-10" />
              </a>
              <button
                type="button"
                onClick={closeMobileMenu}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 px-4 py-4">
              <div className="mb-6 flex items-center gap-3 rounded-xl bg-linear-to-r from-[#DDF3D8]/50 to-[#B4CDFD]/30 p-3">
                <Avatar src={avatarUrl} letter={avatarLetter} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold text-[#1A381D]">
                      {displayName}
                    </div>
                    <PlanBadge label={planLabel} gradient={false} />
                  </div>
                  {email && (
                    <div className="truncate text-xs text-gray-500">
                      {email}
                    </div>
                  )}
                </div>
              </div>

              <ul className="space-y-1">
                <li>
                  <a
                    href="/dashboard"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#1A381D] transition-colors hover:bg-[#DDF3D8]/50"
                  >
                    <svg
                      className="h-5 w-5 text-[#34A853]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="/chatbot"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-[#DDF3D8]/50 hover:text-[#1A381D]"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    Chatbot
                  </a>
                </li>
                <li>
                  <a
                    href="/dashboard"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-[#DDF3D8]/50 hover:text-[#1A381D]"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    Progress
                  </a>
                </li>
                <li>
                  <a
                    href="/dashboard"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-[#DDF3D8]/50 hover:text-[#1A381D]"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    Resources
                  </a>
                </li>
              </ul>

              <div className="my-4 h-px bg-gray-100" />

              <ul className="space-y-1">
                <li>
                  <a
                    href="/profile"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-[#DDF3D8]/50 hover:text-[#1A381D]"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Profile Settings
                  </a>
                </li>
                <li>
                  <a
                    href="/dashboard"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-[#DDF3D8]/50 hover:text-[#1A381D]"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="/dashboard"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-[#DDF3D8]/50 hover:text-[#1A381D]"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                    Upgrade Plan
                  </a>
                </li>
              </ul>
            </div>

            <div className="border-t border-gray-100 px-4 py-4">
              <button
                type="button"
                onClick={async () => {
                  closeMobileMenu();
                  await signOut();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A381D] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2a4a2d]"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign Out
              </button>
              <p className="mt-4 text-center text-xs text-gray-400">
                © 2026 VitaTrack
              </p>
            </div>
          </nav>
        </div>
      )}

      <style>{`
        .plan-badge-gradient {
          position: relative;
          z-index: 0;
        }
        .plan-badge-gradient::before {
          content: '';
          position: absolute;
          inset: 0;
          padding: 1.5px;
          border-radius: 6px;
          background: linear-gradient(180deg, #CCDDF9 45%, #C1B7FF 100%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          z-index: -1;
        }
        .plan-badge-solid {
          border: 1.5px solid #CCDDF9;
        }
      `}</style>
    </>
  );
}
