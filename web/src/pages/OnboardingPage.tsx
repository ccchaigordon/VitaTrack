import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";
import { getErrorMessage } from "../utils/errors";
import NavLogo from "../assets/NavLogo.png";

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

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];

const COUNTRY_OPTIONS = [
  "Malaysia",
  "Singapore",
  "Indonesia",
  "Thailand",
  "Philippines",
  "Vietnam",
  "United States",
  "United Kingdom",
  "Australia",
  "Canada",
  "India",
  "China",
  "Japan",
  "South Korea",
  "Other",
];

const ACTIVITY_LEVELS = [
  "Sedentary",
  "Lightly Active",
  "Moderately Active",
  "Very Active",
  "Extremely Active",
];

const DIET_TYPES = [
  "Balanced",
  "Vegetarian",
  "Vegan",
  "Keto",
  "Paleo",
  "Mediterranean",
  "Low Carb",
  "High Protein",
  "Other",
];

const WORKOUT_DAYS = ["0", "1", "2", "3", "4", "5", "6", "7"];

const stepConfig = {
  1: {
    title: "Onboarding – Basic info",
    subtitle: "Setup your personal info to let us know more about you",
  },
  2: {
    title: "Onboarding – Body & Activity",
    subtitle:
      "Tell us more about your activity for personalized recommendations",
  },
  3: {
    title: "Onboarding – Diet & Goals",
    subtitle: "Tell us more about your diet and fitness goals",
  },
  4: {
    title: "Onboarding – Completed!",
    subtitle: "Welcome aboard! Begin your healthy lifestyle with VitaTrack!",
  },
};

export function OnboardingPage() {
  const nav = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(
    null
  );
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayedTitle, setDisplayedTitle] = useState(stepConfig[1].title);
  const [displayedSubtitle, setDisplayedSubtitle] = useState(
    stepConfig[1].subtitle
  );
  const pendingStep = useRef<1 | 2 | 3 | 4 | null>(null);

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
  }, [nav]);

  function validateStep(current: 1 | 2 | 3 | 4): string | null {
    if (current === 1) {
      if (!fullName.trim()) return "Full Name is required";
      if (!age.trim()) return "Age is required";
      if (!gender) return "Gender is required";
      return null;
    }
    if (current === 2) {
      if (!heightCm.trim()) return "Body Height is required";
      if (!weightKg.trim()) return "Body Weight is required";
      if (!activityLevel) return "Activity Level is required";
      return null;
    }
    if (current === 3) {
      if (!dietType) return "Diet Type is required";
      if (!allergies.trim())
        return 'Allergies is required (enter "None" if none)';
      if (!goals.trim()) return "Goal(s) is required";
      return null;
    }
    return null;
  }

  function animateToStep(nextStep: 1 | 2 | 3 | 4, direction: "left" | "right") {
    if (isAnimating) return;
    setSlideDirection(direction);
    setIsAnimating(true);
    pendingStep.current = nextStep;

    setTimeout(() => {
      setStep(nextStep);
      setDisplayedTitle(stepConfig[nextStep].title);
      setDisplayedSubtitle(stepConfig[nextStep].subtitle);
      setSlideDirection(null);
      setIsAnimating(false);
      pendingStep.current = null;
    }, 300);
  }

  async function saveAllAndFinish() {
    const err = validateStep(3);
    if (err) {
      setErrorMsg(err);
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        age: toNumberOrNull(age),
        gender: gender,
        country_region: countryRegion || null,
        height_cm: toNumberOrNull(heightCm),
        weight_kg: toNumberOrNull(weightKg),
        activity_level: activityLevel,
        diet_type: dietType,
        allergies: allergies.trim(),
        goals: goals.trim(),
        workout_days_per_week: toNumberOrNull(workoutDaysPerWeek) ?? null,
      };

      await apiFetch<{ profileComplete: boolean }>("/me/profile", {
        method: "PUT",
        json: payload,
      });

      animateToStep(4, "left");
    } catch (e: unknown) {
      setErrorMsg(getErrorMessage(e, "Failed to save onboarding"));
    } finally {
      setLoading(false);
    }
  }

  function next() {
    const err = validateStep(step as 1 | 2 | 3);
    if (err) {
      setErrorMsg(err);
      return;
    }
    setErrorMsg(null);
    if (step === 1) animateToStep(2, "left");
    else if (step === 2) animateToStep(3, "left");
  }

  function back() {
    setErrorMsg(null);
    if (step === 3) animateToStep(2, "right");
    else if (step === 2) animateToStep(1, "right");
  }

  function goToDashboard() {
    nav("/dashboard", { replace: true });
  }

  const slideClass =
    slideDirection === "left"
      ? "animate-slide-out-left"
      : slideDirection === "right"
      ? "animate-slide-out-right"
      : "";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-6 sm:py-10">
      <div className="flex items-center gap-2">
        <img
          src={NavLogo}
          alt="VitaTrack"
          className="h-16 w-auto sm:h-24 md:h-30"
        />
      </div>

      {step < 4 && (
        <div className="mt-2 text-xs text-gray-400 sm:mt-4 sm:text-sm">
          {step} / 3
        </div>
      )}

      <div className={`overflow-hidden ${slideClass}`}>
        <h1 className="mt-3 text-center text-lg font-semibold text-gray-900 sm:mt-4 sm:text-xl md:text-2xl">
          {displayedTitle}
        </h1>
        <p className="mt-1 max-w-md text-center text-xs text-gray-500 sm:mt-2 sm:text-sm">
          {displayedSubtitle}
        </p>
      </div>

      {errorMsg && (
        <div className="mt-3 w-full max-w-md rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 sm:mt-4 sm:px-4 sm:text-sm">
          {errorMsg}
        </div>
      )}

      {/* Success Screen */}
      {step === 4 && (
        <div className="mt-8 flex flex-col items-center sm:mt-12">
          <div className="relative flex h-20 w-20 items-center justify-center sm:h-28 sm:w-28">
            <img
              src="../../src/assets/onboarding/onboarding_success.svg"
              alt="Success"
            />
          </div>
          <button
            onClick={goToDashboard}
            className="mt-10 cursor-pointer rounded-lg bg-[#1A381D] px-10 py-2 text-xs font-medium text-white transition-colors hover:bg-[#3d4f3d] sm:mt-16 sm:px-16 sm:py-3 sm:text-sm"
          >
            Let's Start
          </button>
        </div>
      )}

      {/* Form Steps */}
      {step < 4 && (
        <div className="mt-6 w-full max-w-md sm:mt-8">
          {step === 1 && (
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:mb-1.5 sm:text-sm">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900 sm:px-4 sm:py-2.5"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:mb-1.5 sm:text-sm">
                  Age <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900 sm:px-4 sm:py-2.5"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:mb-1.5 sm:text-sm">
                  Gender <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900 sm:px-4 sm:py-2.5"
                  >
                    <option value="" disabled>
                      Select Gender
                    </option>
                    {GENDER_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg
                      className="h-4 w-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:mb-1.5 sm:text-sm">
                  Country / Region
                </label>
                <div className="relative">
                  <select
                    value={countryRegion}
                    onChange={(e) => setCountryRegion(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900 sm:px-4 sm:py-2.5"
                  >
                    <option value="">Select Country / Region</option>
                    {COUNTRY_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg
                      className="h-4 w-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:mb-1.5 sm:text-sm">
                  Body Height (cm) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900 sm:px-4 sm:py-2.5"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:mb-1.5 sm:text-sm">
                  Body Weight (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900 sm:px-4 sm:py-2.5"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:mb-1.5 sm:text-sm">
                  Activity Level <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900 sm:px-4 sm:py-2.5"
                  >
                    <option value="" disabled>
                      Select Activity Level
                    </option>
                    {ACTIVITY_LEVELS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg
                      className="h-4 w-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:mb-1.5 sm:text-sm">
                  Diet Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={dietType}
                    onChange={(e) => setDietType(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900 sm:px-4 sm:py-2.5"
                  >
                    <option value="" disabled>
                      Select Diet Type
                    </option>
                    {DIET_TYPES.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg
                      className="h-4 w-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:mb-1.5 sm:text-sm">
                  Allergies <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900 sm:px-4 sm:py-2.5"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:mb-1.5 sm:text-sm">
                  Goal(s) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900 sm:px-4 sm:py-2.5"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:mb-1.5 sm:text-sm">
                  Workout Days Per Week
                </label>
                <div className="relative">
                  <select
                    value={workoutDaysPerWeek}
                    onChange={(e) => setWorkoutDaysPerWeek(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 outline-none transition-colors focus:border-gray-900 sm:px-4 sm:py-2.5"
                  >
                    <option value="">Select Workout Days Per Week</option>
                    {WORKOUT_DAYS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt} {opt === "1" ? "day" : "days"}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg
                      className="h-4 w-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex justify-center gap-2 sm:mt-10 sm:gap-3">
            {step > 1 && (
              <button
                onClick={back}
                disabled={loading || isAnimating}
                className="min-w-[80px] cursor-pointer rounded-lg border border-[#1A381D] bg-white px-4 py-2 text-xs font-medium text-[#1A381D] transition-colors hover:bg-gray-50 disabled:opacity-60 sm:min-w-[100px] sm:px-8 sm:py-2.5 sm:text-sm"
              >
                Back
              </button>
            )}

            {step < 3 && (
              <button
                onClick={next}
                disabled={loading || isAnimating}
                className="min-w-[80px] cursor-pointer rounded-lg bg-[#1A381D] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#3d4f3d] disabled:opacity-60 sm:min-w-[100px] sm:px-8 sm:py-2.5 sm:text-sm"
              >
                Next
              </button>
            )}

            {step === 3 && (
              <button
                onClick={saveAllAndFinish}
                disabled={loading || isAnimating}
                className="min-w-[80px] cursor-pointer rounded-lg bg-[#1A381D] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#3d4f3d] disabled:opacity-60 sm:min-w-[100px] sm:px-8 sm:py-2.5 sm:text-sm"
              >
                {loading ? "Saving..." : "Finish"}
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideOutLeft {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(-100%); opacity: 0; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
        .animate-slide-out-left {
          animation: slideOutLeft 0.3s ease-out forwards;
        }
        .animate-slide-out-right {
          animation: slideOutRight 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
