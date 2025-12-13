import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";
import { getErrorMessage } from "../utils/errors";

type MeResponse = {
  user: { username: string; full_name: string | null } | null;
  profile: {
    age: number | null;
    gender: string | null;
    country_region: string | null;
    height_cm: number | null;
    weight_kg: number | null;
    activity_level: string | null;
    workout_days_per_week: number | null;
    diet_type: string | null;
    allergies: string | null;
    goals: string | null;
  } | null;
  profileComplete: boolean;
};

function toNumberOrNull(v: string): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function OnboardingPage() {
  const nav = useNavigate();
  const location = useLocation();

  const suggestedUsername = useMemo(() => {
    const state = location.state;
    if (!state || typeof state !== "object") return "";
    const u = (state as { username?: unknown }).username;
    return typeof u === "string" ? u : "";
  }, [location.state]);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [username, setUsername] = useState(suggestedUsername);
  const [usernameLocked, setUsernameLocked] = useState(false);
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [countryRegion, setCountryRegion] = useState("");

  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [activityLevel, setActivityLevel] = useState("");

  const [dietType, setDietType] = useState("");
  const [allergies, setAllergies] = useState("");
  const [goals, setGoals] = useState("");
  const [workoutDaysPerWeek, setWorkoutDaysPerWeek] = useState("");

  useEffect(() => {
    let mounted = true;
    apiFetch<MeResponse>("/me")
      .then((me) => {
        if (!mounted) return;
        if (me.profileComplete) {
          nav("/dashboard", { replace: true });
          return;
        }
        // Pre-fill known values
        const existingUsername = me.user?.username ?? "";
        setUsername(existingUsername || suggestedUsername);
        setUsernameLocked(Boolean(existingUsername));
        setFullName(me.user?.full_name ?? "");
        if (me.profile) {
          if (me.profile.age != null) setAge(String(me.profile.age));
          if (me.profile.gender) setGender(me.profile.gender);
          if (me.profile.country_region)
            setCountryRegion(me.profile.country_region);
          if (me.profile.height_cm != null)
            setHeightCm(String(me.profile.height_cm));
          if (me.profile.weight_kg != null)
            setWeightKg(String(me.profile.weight_kg));
          if (me.profile.activity_level)
            setActivityLevel(me.profile.activity_level);
          if (me.profile.diet_type) setDietType(me.profile.diet_type);
          if (me.profile.allergies) setAllergies(me.profile.allergies);
          if (me.profile.goals) setGoals(me.profile.goals);
          if (me.profile.workout_days_per_week != null)
            setWorkoutDaysPerWeek(String(me.profile.workout_days_per_week));
        }
      })
      .catch((e) => {
        if (!mounted) return;
        setErrorMsg(getErrorMessage(e, "Failed to load onboarding"));
      });
    return () => {
      mounted = false;
    };
  }, [nav, suggestedUsername]);

  function validateStep(current: 1 | 2 | 3): string | null {
    if (current === 1) {
      if (!username.trim()) return "Username is required";
      if (!fullName.trim()) return "Full name is required";
      if (!age.trim()) return "Age is required";
      if (!gender.trim()) return "Gender is required";
      if (!countryRegion.trim()) return "Country/Region is required";
      return null;
    }
    if (current === 2) {
      if (!heightCm.trim()) return "Height is required";
      if (!weightKg.trim()) return "Weight is required";
      if (!activityLevel.trim()) return "Activity level is required";
      return null;
    }
    if (!dietType.trim()) return "Diet type is required";
    if (!allergies.trim()) return 'Allergies is required (put "None" if none)';
    if (!goals.trim()) return "Goals is required";
    if (!workoutDaysPerWeek.trim()) return "Workout days per week is required";
    return null;
  }

  async function saveAllAndFinish() {
    setErrorMsg(null);
    setLoading(true);
    try {
      const payload = {
        username: username.trim(),
        full_name: fullName.trim(),
        age: toNumberOrNull(age),
        gender: gender.trim(),
        country_region: countryRegion.trim(),
        height_cm: toNumberOrNull(heightCm),
        weight_kg: toNumberOrNull(weightKg),
        activity_level: activityLevel.trim(),
        diet_type: dietType.trim(),
        allergies: allergies.trim(),
        goals: goals.trim(),
        workout_days_per_week: toNumberOrNull(workoutDaysPerWeek),
      };

      const res = await apiFetch<{ profileComplete: boolean }>("/me/profile", {
        method: "PUT",
        json: payload,
      });

      nav(res.profileComplete ? "/dashboard" : "/dashboard", { replace: true });
    } catch (e: unknown) {
      setErrorMsg(getErrorMessage(e, "Failed to save onboarding"));
    } finally {
      setLoading(false);
    }
  }

  function next() {
    const err = validateStep(step);
    if (err) {
      setErrorMsg(err);
      return;
    }
    setErrorMsg(null);
    setStep((s) => (s === 1 ? 2 : 3));
  }

  function back() {
    setErrorMsg(null);
    setStep((s) => (s === 3 ? 2 : 1));
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl p-6">
        <div className="text-2xl font-semibold text-slate-900">
          Complete your profile
        </div>
        <div className="mt-1 text-sm text-slate-500">Step {step} of 3</div>

        {errorMsg ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMsg}
          </div>
        ) : null}

        <div className="mt-6 rounded-xl border border-slate-200 p-5">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="text-sm font-medium text-slate-900">
                Basic info
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Username
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={usernameLocked}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Full name
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Age
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    inputMode="numeric"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Gender
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    placeholder="e.g. Male / Female"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Country/Region
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  value={countryRegion}
                  onChange={(e) => setCountryRegion(e.target.value)}
                  required
                />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="text-sm font-medium text-slate-900">
                Body & activity
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Height (cm)
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    inputMode="decimal"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Weight (kg)
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    inputMode="decimal"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Activity level
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  placeholder="e.g. Sedentary / Lightly active / Active"
                  required
                />
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div className="text-sm font-medium text-slate-900">
                Diet & goals
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Diet type
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  value={dietType}
                  onChange={(e) => setDietType(e.target.value)}
                  placeholder="e.g. Balanced / Keto / Vegetarian"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Allergies
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder='e.g. Peanuts (or "None")'
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Goals
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="e.g. Lose weight / Build muscle"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Workout days per week
                </label>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                  value={workoutDaysPerWeek}
                  onChange={(e) => setWorkoutDaysPerWeek(e.target.value)}
                  inputMode="numeric"
                  required
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={back}
            disabled={step === 1 || loading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 disabled:opacity-60"
          >
            Back
          </button>

          {step < 3 ? (
            <button
              onClick={next}
              disabled={loading}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              Next
            </button>
          ) : (
            <button
              onClick={saveAllAndFinish}
              disabled={loading}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              Finish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
