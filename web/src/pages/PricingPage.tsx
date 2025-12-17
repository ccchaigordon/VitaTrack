import { useUser } from "../contexts/UserContext";
import { SettingsSidebar } from "../components/SettingsSidebar";

const CheckIcon = () => (
  <svg
    className="shrink-0 w-5 h-5 text-[#34A853]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const CrossIcon = () => (
  <svg
    className="shrink-0 w-5 h-5 text-gray-300"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

type Feature = {
  name: string;
  free: boolean | string;
  pro: boolean | string;
};

const features: Feature[] = [
  { name: "Personalized Dashboard", free: true, pro: true },
  { name: "AI Health Chatbot", free: "10 messages/day", pro: "Unlimited" },
  { name: "Basic Progress Tracking", free: true, pro: true },
  {
    name: "Food & Meal Logging",
    free: "Manual entry",
    pro: "AI-powered with photo recognition",
  },
  { name: "General Health Resources", free: true, pro: true },
  { name: "Weekly Health Reports", free: false, pro: true },
  { name: "Advanced Analytics & Insights", free: false, pro: true },
  { name: "Custom Meal Plans", free: false, pro: true },
  { name: "Workout Recommendations", free: false, pro: true },
  {
    name: "Goal Setting & Reminders",
    free: "Basic",
    pro: "Advanced with smart scheduling",
  },
  { name: "Export Health Data (PDF/CSV)", free: false, pro: true },
  { name: "Priority Support", free: false, pro: true },
  { name: "Ad-free Experience", free: false, pro: true },
  { name: "Early Access to New Features", free: false, pro: true },
];

export default function PricingPage() {
  const { me } = useUser();
  const currentPlan = me?.plan?.plan_name?.toLowerCase() || "free";

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <SettingsSidebar />

      <div className="min-h-screen lg:ml-16">
        <div className="px-4 py-8 sm:py-16 max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1A381D] mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
              Start free and upgrade when you're ready. No hidden fees, cancel
              anytime.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto mb-16 sm:mb-20">
            {/* Free Plan */}
            <div className="relative bg-white border-2 border-gray-200 rounded-2xl p-6 sm:p-8 flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-[#1A381D] mb-2">Free</h3>
                <p className="text-gray-500 text-sm">
                  Perfect for getting started
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl sm:text-5xl font-bold text-[#1A381D]">
                    RM0
                  </span>
                  <span className="text-gray-500 ml-2">/month</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-gray-700">
                    Personalized Dashboard
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-gray-700">
                    10 AI Chatbot messages/day
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-gray-700">
                    Basic Progress Tracking
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-gray-700">
                    Manual Food Logging
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-gray-700">
                    General Health Resources
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-gray-700">
                    Basic Goal Setting
                  </span>
                </li>
              </ul>

              <button
                disabled={currentPlan === "free"}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                  currentPlan === "free"
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                    : "bg-[#1A381D]/10 text-[#1A381D] hover:bg-[#1A381D]/20 cursor-pointer"
                }`}
              >
                {currentPlan === "free" ? "Current Plan" : "Downgrade to Free"}
              </button>
            </div>

            {/* Pro Plan */}
            <div className="relative bg-linear-to-br from-[#1A381D] to-[#2a5a30] rounded-2xl p-6 sm:p-8 flex flex-col text-white shadow-xl">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#34A853] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide shadow-lg">
                  Most Popular
                </span>
              </div>

              <div className="mb-6 mt-2">
                <h3 className="text-xl font-bold mb-2">Pro</h3>
                <p className="text-white/70 text-sm">
                  For serious health enthusiasts
                </p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline">
                  <span className="text-4xl sm:text-5xl font-bold">
                    RM39.99
                  </span>
                  <span className="text-white/70 ml-2">/month</span>
                </div>
                <p className="text-white/60 text-xs mt-1">
                  Billed monthly. Cancel anytime.
                </p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-white/90">
                    Everything in Free, plus:
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-white/90">
                    <strong>Unlimited</strong> AI Chatbot messages
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-white/90">
                    AI-powered Food Logging with photo recognition
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-white/90">
                    Weekly Health Reports & Analytics
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-white/90">
                    Custom Meal & Workout Plans
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-white/90">
                    Export Data (PDF/CSV)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-sm text-white/90">
                    Priority Support & Ad-free
                  </span>
                </li>
              </ul>

              <button
                disabled={currentPlan === "pro"}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${
                  currentPlan === "pro"
                    ? "bg-white/20 text-white/70 cursor-not-allowed"
                    : "bg-white text-[#1A381D] hover:bg-gray-100 shadow-lg cursor-pointer"
                }`}
              >
                {currentPlan === "pro" ? "Current Plan" : "Upgrade to Pro"}
              </button>
            </div>
          </div>

          {/* Feature Comparison Table */}
          <div className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1A381D] text-center mb-8">
              Compare Plans
            </h2>

            <div className="overflow-y-hidden rounded-2xl border border-gray-200 max-w-4xl mx-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-white">
                    <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">
                      Feature
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-gray-600 w-32">
                      Free
                    </th>
                    <th className="text-center py-4 px-4 text-sm font-semibold text-[#1A381D] w-32 bg-[#34A853]/10">
                      Pro
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, index) => (
                    <tr
                      key={feature.name}
                      className={index % 2 === 0 ? "bg-gray-50/50" : "bg-white"}
                    >
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {feature.name}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center">
                          {typeof feature.free === "boolean" ? (
                            feature.free ? (
                              <CheckIcon />
                            ) : (
                              <CrossIcon />
                            )
                          ) : (
                            <span className="text-xs text-gray-600 text-center">
                              {feature.free}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 bg-[#34A853]/5">
                        <div className="flex items-center justify-center">
                          {typeof feature.pro === "boolean" ? (
                            feature.pro ? (
                              <CheckIcon />
                            ) : (
                              <CrossIcon />
                            )
                          ) : (
                            <span className="text-xs text-[#1A381D] font-medium text-center">
                              {feature.pro}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
