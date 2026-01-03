import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";
import { getErrorMessage } from "../utils/errors";
import NavLogo from "../assets/NavLogo.png";
import DIET_TYPES_DATA from "../data/dietTypes.json";

type MeResponse = {
  user: { username: string | null; full_name: string | null } | null;
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

const GENDER_OPTIONS = ["Male", "Female"];

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

const DIET_TYPES = DIET_TYPES_DATA;

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

  const [username, setUsername] = useState("");
  const [usernameExists, setUsernameExists] = useState(false);
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;

    async function loadOnboardingData() {
      try {
        // Ensure we have a valid session first
        const { getSupabase } = await import("../services/supabase");
        const supabase = getSupabase();
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError || !sessionData.session) {
          if (!mounted) return;
          setErrorMsg("Session expired. Please sign in again.");
          setTimeout(() => {
            nav("/", { replace: true });
          }, 2000);
          return;
        }

        const me = await apiFetch<MeResponse>("/me");
        if (!mounted) return;

        if (me.profileComplete) {
          nav("/home", { replace: true });
          return;
        }
        const existingUsername = me.user?.username?.trim() ?? "";
        if (existingUsername) {
          setUsername(existingUsername);
          setUsernameExists(true);
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
      } catch (e) {
        if (!mounted) return;
        const errorMsg = getErrorMessage(e, "Failed to load onboarding");

        // If it's an authentication error, redirect to sign in
        if (
          errorMsg.toLowerCase().includes("token") ||
          errorMsg.toLowerCase().includes("session") ||
          errorMsg.toLowerCase().includes("unauthorized")
        ) {
          setErrorMsg("Session expired. Redirecting to sign in...");
          setTimeout(() => {
            nav("/", { replace: true });
          }, 2000);
        } else {
          setErrorMsg(errorMsg);
        }
      }
    }

    loadOnboardingData();

    return () => {
      mounted = false;
    };
  }, [nav]);

  function validateStep(current: 1 | 2 | 3 | 4): string | null {
    const errors: Record<string, string> = {};

    if (current === 1) {
      if (!usernameExists && !username.trim()) {
        errors.username = "Username is required";
      }
      if (!fullName.trim()) {
        errors.fullName = "Full Name is required";
      }
      if (!age.trim()) {
        errors.age = "Age is required";
      } else {
        const ageNum = parseInt(age, 10);
        if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
          errors.age = "Age must be between 13 and 120";
        }
      }
      if (!gender) {
        errors.gender = "Gender is required";
      }
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        return "Please fill in all required fields correctly";
      }
      return null;
    }
    if (current === 2) {
      if (!heightCm.trim()) {
        errors.heightCm = "Body Height is required";
      } else {
        const heightNum = parseFloat(heightCm);
        if (isNaN(heightNum) || heightNum < 50 || heightNum > 300) {
          errors.heightCm = "Height must be between 50 and 300 cm";
        }
      }
      if (!weightKg.trim()) {
        errors.weightKg = "Body Weight is required";
      } else {
        const weightNum = parseFloat(weightKg);
        if (isNaN(weightNum) || weightNum < 20 || weightNum > 500) {
          errors.weightKg = "Weight must be between 20 and 500 kg";
        }
      }
      if (!activityLevel) {
        errors.activityLevel = "Activity Level is required";
      }
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        return "Please fill in all required fields correctly";
      }
      return null;
    }
    if (current === 3) {
      if (!dietType) {
        errors.dietType = "Diet Type is required";
      }
      if (!allergies.trim()) {
        errors.allergies = 'Allergies is required (enter "None" if none)';
      }
      if (!goals.trim()) {
        errors.goals = "Goal(s) is required";
      }
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        return "Please fill in all required fields correctly";
      }
      return null;
    }
    setFieldErrors({});
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
      const payload: Record<string, unknown> = {
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
      if (!usernameExists && username.trim()) {
        payload.username = username.trim();
      }

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

  async function next() {
    const err = validateStep(step as 1 | 2 | 3);
    if (err) {
      setErrorMsg(err);
      return;
    }
    setErrorMsg(null);

    // Check username availability before proceeding
    if (step === 1 && !usernameExists && username.trim()) {
      setLoading(true);
      try {
        const result = await apiFetch<{ available: boolean; message?: string }>(
          `/check-username?username=${encodeURIComponent(username.trim())}`
        );
        if (!result.available) {
          setErrorMsg(result.message || "This username is already taken");
          setLoading(false);
          return;
        }
      } catch (e: unknown) {
        setErrorMsg(getErrorMessage(e, "Failed to check username"));
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    if (step === 1) animateToStep(2, "left");
    else if (step === 2) animateToStep(3, "left");
  }

  function back() {
    setErrorMsg(null);
    setFieldErrors({});
    if (step === 3) animateToStep(2, "right");
    else if (step === 2) animateToStep(1, "right");
  }

  function goToHome() {
    nav("/home", { replace: true });
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
              src="../assets/Onboarding/onboarding_success.svg"
              alt="Success"
            />
          </div>
          <button
            onClick={goToHome}
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
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (fieldErrors.username) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.username;
                        return next;
                      });
                    }
                  }}
                  disabled={usernameExists}
                  placeholder={usernameExists ? "" : "Choose a unique username"}
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none transition-colors sm:px-4 sm:py-2.5 ${
                    usernameExists
                      ? "bg-gray-100 text-gray-500 border-gray-300"
                      : fieldErrors.username
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-300 focus:border-gray-900"
                  }`}
                />
                {usernameExists && (
                  <p className="mt-1 text-xs text-gray-500">
                    Username cannot be changed once set
                  </p>
                )}
                {fieldErrors.username && (
                  <p className="mt-1 text-xs text-red-500">
                    {fieldErrors.username}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:mb-1.5 sm:text-sm">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fieldErrors.fullName) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.fullName;
                        return next;
                      });
                    }
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none transition-colors sm:px-4 sm:py-2.5 ${
                    fieldErrors.fullName
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-300 focus:border-gray-900"
                  }`}
                />
                {fieldErrors.fullName && (
                  <p className="mt-1 text-xs text-red-500">
                    {fieldErrors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:mb-1.5 sm:text-sm">
                  Age <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={age}
                  onChange={(e) => {
                    setAge(e.target.value);
                    if (fieldErrors.age) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.age;
                        return next;
                      });
                    }
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none transition-colors sm:px-4 sm:py-2.5 ${
                    fieldErrors.age
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-300 focus:border-gray-900"
                  }`}
                />
                {fieldErrors.age && (
                  <p className="mt-1 text-xs text-red-500">{fieldErrors.age}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:mb-1.5 sm:text-sm">
                  Gender <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={gender}
                    onChange={(e) => {
                      setGender(e.target.value);
                      if (fieldErrors.gender) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.gender;
                          return next;
                        });
                      }
                    }}
                    className={`w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-10 text-sm text-gray-900 outline-none transition-colors sm:px-4 sm:py-2.5 ${
                      fieldErrors.gender
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-300 focus:border-gray-900"
                    }`}
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
                {fieldErrors.gender && (
                  <p className="mt-1 text-xs text-red-500">
                    {fieldErrors.gender}
                  </p>
                )}
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
                  onChange={(e) => {
                    setHeightCm(e.target.value);
                    if (fieldErrors.heightCm) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.heightCm;
                        return next;
                      });
                    }
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none transition-colors sm:px-4 sm:py-2.5 ${
                    fieldErrors.heightCm
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-300 focus:border-gray-900"
                  }`}
                />
                {fieldErrors.heightCm && (
                  <p className="mt-1 text-xs text-red-500">
                    {fieldErrors.heightCm}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:mb-1.5 sm:text-sm">
                  Body Weight (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={weightKg}
                  onChange={(e) => {
                    setWeightKg(e.target.value);
                    if (fieldErrors.weightKg) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.weightKg;
                        return next;
                      });
                    }
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none transition-colors sm:px-4 sm:py-2.5 ${
                    fieldErrors.weightKg
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-300 focus:border-gray-900"
                  }`}
                />
                {fieldErrors.weightKg && (
                  <p className="mt-1 text-xs text-red-500">
                    {fieldErrors.weightKg}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:mb-1.5 sm:text-sm">
                  Activity Level <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={activityLevel}
                    onChange={(e) => {
                      setActivityLevel(e.target.value);
                      if (fieldErrors.activityLevel) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.activityLevel;
                          return next;
                        });
                      }
                    }}
                    className={`w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-10 text-sm text-gray-900 outline-none transition-colors sm:px-4 sm:py-2.5 ${
                      fieldErrors.activityLevel
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-300 focus:border-gray-900"
                    }`}
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
                {fieldErrors.activityLevel && (
                  <p className="mt-1 text-xs text-red-500">
                    {fieldErrors.activityLevel}
                  </p>
                )}
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
                    onChange={(e) => {
                      setDietType(e.target.value);
                      if (fieldErrors.dietType) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.dietType;
                          return next;
                        });
                      }
                    }}
                    className={`w-full appearance-none rounded-lg border bg-white px-3 py-2 pr-10 text-sm text-gray-900 outline-none transition-colors sm:px-4 sm:py-2.5 ${
                      fieldErrors.dietType
                        ? "border-red-300 focus:border-red-500"
                        : "border-gray-300 focus:border-gray-900"
                    }`}
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
                {fieldErrors.dietType && (
                  <p className="mt-1 text-xs text-red-500">
                    {fieldErrors.dietType}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:mb-1.5 sm:text-sm">
                  Allergies <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => {
                    setAllergies(e.target.value);
                    if (fieldErrors.allergies) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.allergies;
                        return next;
                      });
                    }
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none transition-colors sm:px-4 sm:py-2.5 ${
                    fieldErrors.allergies
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-300 focus:border-gray-900"
                  }`}
                />
                {fieldErrors.allergies && (
                  <p className="mt-1 text-xs text-red-500">
                    {fieldErrors.allergies}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700 sm:mb-1.5 sm:text-sm">
                  Goal(s) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={goals}
                  onChange={(e) => {
                    setGoals(e.target.value);
                    if (fieldErrors.goals) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.goals;
                        return next;
                      });
                    }
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none transition-colors sm:px-4 sm:py-2.5 ${
                    fieldErrors.goals
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-300 focus:border-gray-900"
                  }`}
                />
                {fieldErrors.goals && (
                  <p className="mt-1 text-xs text-red-500">
                    {fieldErrors.goals}
                  </p>
                )}
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
