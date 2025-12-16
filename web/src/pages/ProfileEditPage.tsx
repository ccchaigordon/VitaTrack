import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";
import { getErrorMessage } from "../utils/errors";
import { useUser } from "../contexts/UserContext";

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];

const ACTIVITY_LEVELS = [
  "sedentary",
  "lightly active",
  "moderately active",
  "very active",
  "extremely active",
];

// Normalise activity level for matching
function normalizeActivityLevel(value: string | null | undefined): string {
  if (!value) return "";
  const lower = value.toLowerCase().trim();
  const match = ACTIVITY_LEVELS.find((opt) => opt.toLowerCase() === lower);
  return match || lower;
}

const DIET_TYPES = [
  "Balanced",
  "Vegetarian",
  "Vegan",
  "Keto",
  "Paleo",
  "Mediterranean",
  "Low Carb",
  "High Protein",
  "Gluten-Free",
  "Dairy-Free",
];

const COUNTRIES = [
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

function FormField({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-gray-900 outline-none transition focus:border-[#34A853] focus:ring-2 focus:ring-[#34A853]/20"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </div>
  );
}

function MultiSelectChips({
  selected,
  options,
  onChange,
  variant = "green",
}: {
  selected: string[];
  options: string[];
  onChange: (selected: string[]) => void;
  variant?: "green" | "red";
}) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  const activeColors =
    variant === "green"
      ? "border-[#34A853] bg-[#34A853] text-white"
      : "border-red-400 bg-red-400 text-white";
  const inactiveColors =
    variant === "green"
      ? "border-gray-200 bg-white text-gray-700 hover:border-[#34A853]/50"
      : "border-gray-200 bg-white text-gray-700 hover:border-red-300";

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
            selected.includes(opt) ? activeColors : inactiveColors
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function ProfileEditPage() {
  const nav = useNavigate();
  const { me, loading: contextLoading, refetch } = useUser();
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [workoutDays, setWorkoutDays] = useState("");
  const [dietTypes, setDietTypes] = useState<string[]>([]);
  const [allergies, setAllergies] = useState("");
  const [goals, setGoals] = useState("");

  useEffect(() => {
    if (!contextLoading && me && !initialized) {
      if (me.user) {
        setFullName(me.user.full_name || "");
      }
      if (me.profile) {
        setAge(me.profile.age?.toString() || "");
        setGender(me.profile.gender || "");
        setCountry(me.profile.country_region || "");
        setHeight(me.profile.height_cm?.toString() || "");
        setWeight(me.profile.weight_kg?.toString() || "");
        setActivityLevel(normalizeActivityLevel(me.profile.activity_level));
        setWorkoutDays(me.profile.workout_days_per_week?.toString() || "");
        setDietTypes(
          me.profile.diet_type
            ?.split(",")
            .map((s) => s.trim())
            .filter(Boolean) || []
        );
        setAllergies(me.profile.allergies || "");
        setGoals(me.profile.goals || "");
      }
      setInitialized(true);
    }
  }, [contextLoading, me, initialized]);

  const loading = contextLoading || !initialized;

  async function handleSave() {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSaving(true);

    try {
      const payload = {
        full_name: fullName.trim() || null,
        age: age ? parseInt(age, 10) : null,
        gender: gender || null,
        country_region: country || null,
        height_cm: height ? parseFloat(height) : null,
        weight_kg: weight ? parseFloat(weight) : null,
        activity_level: activityLevel || null,
        workout_days_per_week: workoutDays ? parseInt(workoutDays, 10) : null,
        diet_type: dietTypes.length > 0 ? dietTypes.join(", ") : null,
        allergies: allergies.trim() || null,
        goals: goals.trim() || null,
      };

      await apiFetch("/me/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      await refetch();
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => nav("/profile"), 1500);
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "Failed to update profile"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFBFC]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#34A853] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Edit Profile
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Update your personal information
            </p>
          </div>
          <button
            onClick={() => nav("/profile")}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMsg}
          </div>
        )}

        <div className="space-y-8">
          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              Basic Information
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <FormField label="Full Name">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 outline-none transition focus:border-[#34A853] focus:ring-2 focus:ring-[#34A853]/20"
                />
              </FormField>
              <FormField label="Age">
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Enter your age"
                  min="13"
                  max="120"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 outline-none transition focus:border-[#34A853] focus:ring-2 focus:ring-[#34A853]/20"
                />
              </FormField>
              <FormField label="Gender">
                <SelectField
                  value={gender}
                  onChange={setGender}
                  options={GENDER_OPTIONS}
                  placeholder="Select gender"
                />
              </FormField>
              <FormField label="Country / Region">
                <SelectField
                  value={country}
                  onChange={setCountry}
                  options={COUNTRIES}
                  placeholder="Select country"
                />
              </FormField>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              Body Metrics
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <FormField label="Height (cm)">
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="e.g., 170"
                  min="50"
                  max="300"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 outline-none transition focus:border-[#34A853] focus:ring-2 focus:ring-[#34A853]/20"
                />
              </FormField>
              <FormField label="Weight (kg)">
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g., 70"
                  min="20"
                  max="500"
                  step="0.1"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 outline-none transition focus:border-[#34A853] focus:ring-2 focus:ring-[#34A853]/20"
                />
              </FormField>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              Activity & Schedule
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <FormField label="Activity Level">
                <div className="relative">
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-gray-900 outline-none transition focus:border-[#34A853] focus:ring-2 focus:ring-[#34A853]/20"
                  >
                    <option value="">Select activity level</option>
                    {ACTIVITY_LEVELS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </FormField>
              <FormField label="Workout Days per Week">
                <div className="relative">
                  <select
                    value={workoutDays}
                    onChange={(e) => setWorkoutDays(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-10 text-gray-900 outline-none transition focus:border-[#34A853] focus:ring-2 focus:ring-[#34A853]/20"
                  >
                    <option value="">Select days</option>
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "day" : "days"}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </FormField>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">Goals</h2>
            <FormField label="What's your primary goal?">
              <input
                type="text"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="e.g., Weight Loss, Muscle Gain, Improve Fitness"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none transition focus:border-[#34A853] focus:ring-2 focus:ring-[#34A853]/20"
              />
            </FormField>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">
              Diet & Preferences
            </h2>
            <div className="space-y-6">
              <FormField label="Diet Preferences (select all that apply)">
                <MultiSelectChips
                  selected={dietTypes}
                  options={DIET_TYPES}
                  onChange={setDietTypes}
                  variant="green"
                />
              </FormField>
              <FormField label="Allergies (comma-separated)">
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g., Nuts, Dairy, Gluten (or 'None' if no allergies)"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 outline-none transition focus:border-[#34A853] focus:ring-2 focus:ring-[#34A853]/20"
                />
              </FormField>
            </div>
          </section>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => nav("/profile")}
              className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-[#1A381D] px-6 py-2 text-sm font-medium text-white transition hover:bg-[#0F2310] disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
