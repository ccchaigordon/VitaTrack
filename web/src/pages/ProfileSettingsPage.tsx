import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getSupabase } from "../services/supabase";
import { useUser } from "../contexts/UserContext";

const SettingsIcon = () => (
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
);

const HelpIcon = () => (
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
);

const UpgradeIcon = () => (
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
);

const LogoutIcon = () => (
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
);

function Avatar({
  src,
  letter,
  size = "lg",
}: {
  src: string | null;
  letter: string;
  size?: "md" | "lg" | "xl";
}) {
  const [error, setError] = useState(false);
  const sizeClasses = {
    md: "h-12 w-12 text-lg",
    lg: "h-20 w-20 text-2xl",
    xl: "h-24 w-24 text-3xl",
  };

  if (src && !error) {
    return (
      <img
        src={src}
        alt=""
        onError={() => setError(true)}
        className={`${sizeClasses[size]} rounded-full border-4 border-white object-cover shadow-md`}
      />
    );
  }
  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full border-4 border-white bg-[#1A381D] font-bold text-white shadow-md`}
    >
      {letter}
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}

function Tag({
  label,
  variant = "green",
}: {
  label: string;
  variant?: "green" | "red";
}) {
  const colors =
    variant === "green"
      ? "border-[#34A853] bg-[#34A853]/5 text-[#34A853]"
      : "border-red-400 bg-red-50 text-red-500";
  return (
    <span
      className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${colors}`}
    >
      {label}
    </span>
  );
}

export function ProfileSettingsPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { me, loading } = useUser();

  async function signOut() {
    const supabase = getSupabase();
    try {
      await supabase.auth.signOut();
    } catch {
      localStorage.clear();
      sessionStorage.clear();
    }
    nav("/signin", { replace: true });
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const displayName = me?.user?.full_name || me?.user?.username || "User";
  const email = me?.user?.email || "user@example.com";
  const avatarLetter = (me?.user?.username || me?.user?.email || "U")
    .charAt(0)
    .toUpperCase();

  const sidebarItems = [
    { icon: <SettingsIcon />, path: "/profile", label: "Settings" },
    { icon: <HelpIcon />, path: "/help", label: "Help" },
    { icon: <UpgradeIcon />, path: "/upgrade", label: "Upgrade" },
    { icon: <LogoutIcon />, path: "/logout", label: "Logout" },
  ];

  const parseDietTypes = (dietType: string | null | undefined): string[] => {
    if (!dietType) return [];
    return dietType
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const parseAllergies = (allergies: string | null | undefined): string[] => {
    if (!allergies) return [];
    return allergies
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFBFC]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#34A853] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <aside className="fixed left-0 top-0 z-40 pt-30 hidden h-screen w-16 flex-col items-center border-r border-gray-100 bg-white py-6 lg:flex">
        {sidebarItems.map((item, i) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={i}
              onClick={() => {
                if (item.path === "/logout") {
                  signOut();
                } else {
                  nav(item.path);
                }
              }}
              className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl transition-colors cursor-pointer ${
                isActive
                  ? "bg-[#DDF3D8] text-[#34A853]"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              }`}
              title={item.label}
            >
              {item.icon}
            </button>
          );
        })}
      </aside>

      <div className="min-h-screen lg:ml-16">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Profile - Overview
              </h1>
              <p className="mt-1 text-sm text-gray-500">{today}</p>
            </div>
          </div>

          {/* Profile Card with Banner */}
          <div className="mb-8 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="h-16 bg-linear-to-r from-[#DDF3D8] to-[#E8F5A3]" />

            <div className="relative px-6 pb-6">
              <div className="-mt-10 flex items-end justify-between">
                <Avatar
                  src={me?.user?.avatar_url || null}
                  letter={avatarLetter}
                  size="xl"
                />
                <button
                  onClick={() => nav("/profile/edit")}
                  className="rounded-lg bg-white border border-[#34A853]/50 px-6 py-1.5 text-sm font-medium text-[#34A853] transition cursor-pointer"
                >
                  Edit
                </button>
              </div>
              <div className="mt-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {displayName}
                </h2>
                <p className="text-sm text-gray-500">{email}</p>
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700">
                {me?.user?.username || "Username"}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Age
              </label>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700">
                {me?.profile?.age || "18"}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Gender
              </label>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700">
                {me?.profile?.gender || "Not set"}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Country / Region
              </label>
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700">
                {me?.profile?.country_region || "Not set"}
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-6 md:grid-cols-3">
            <InfoCard title="Body metrics">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Height</span>
                  <span className="text-sm font-medium text-gray-900">
                    {me?.profile?.height_cm
                      ? `${me.profile.height_cm} cm`
                      : "Not set"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Current weight</span>
                  <span className="text-sm font-medium text-gray-900">
                    {me?.profile?.weight_kg
                      ? `${me.profile.weight_kg} kg`
                      : "Not set"}
                  </span>
                </div>
              </div>
            </InfoCard>

            <InfoCard title="Activity & schedule">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Activity level</span>
                  <span className="text-sm font-medium text-gray-900">
                    {me?.profile?.activity_level || "Not set"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Workout days</span>
                  <span className="text-sm font-medium text-gray-900">
                    {me?.profile?.workout_days_per_week
                      ? `${me.profile.workout_days_per_week} days/week`
                      : "Not set"}
                  </span>
                </div>
              </div>
            </InfoCard>

            <InfoCard title="Goals">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Goal type</span>
                  <span className="max-w-[140px] truncate text-right text-sm font-medium text-gray-900">
                    {me?.profile?.goals || "Not set"}
                  </span>
                </div>
              </div>
            </InfoCard>
          </div>

          <InfoCard title="Diet & preferences">
            <div className="space-y-4">
              <div>
                <span className="mb-2 block text-sm text-gray-500">
                  Diet preferences
                </span>
                <div className="flex flex-wrap gap-2">
                  {parseDietTypes(me?.profile?.diet_type).length > 0 ? (
                    parseDietTypes(me?.profile?.diet_type).map((diet, i) => (
                      <Tag key={i} label={diet} variant="green" />
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">Not set</span>
                  )}
                </div>
              </div>
              <div>
                <span className="mb-2 block text-sm text-gray-500">
                  Allergies
                </span>
                <div className="flex flex-wrap gap-2">
                  {parseAllergies(me?.profile?.allergies).length > 0 ? (
                    parseAllergies(me?.profile?.allergies).map((allergy, i) => (
                      <Tag key={i} label={allergy} variant="red" />
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">None</span>
                  )}
                </div>
              </div>
            </div>
          </InfoCard>
        </div>
      </div>
    </div>
  );
}
