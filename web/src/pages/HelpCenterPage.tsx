import { useState, useMemo } from "react";
import { SettingsSidebar } from "../components/SettingsSidebar";

const faqCategories = [
  {
    title: "Getting Started",
    questions: [
      {
        q: "How do I create an account?",
        a: "Click the 'Get started' or 'Sign up' button on our homepage. You can sign up using your email address or connect with Google. After signing up, you'll need to complete your profile during onboarding.",
      },
      {
        q: "What information do I need to provide during onboarding?",
        a: "During onboarding, we'll ask for basic information like your age, gender, height, weight, activity level, workout frequency, diet preferences, allergies, and health goals. This helps us personalize your experience and provide better recommendations.",
      },
      {
        q: "Can I skip the onboarding process?",
        a: "Onboarding is required to use VitaTrack's full features. However, you can update your information anytime from your Profile Settings page.",
      },
    ],
  },
  {
    title: "Logging Meals & Workouts",
    questions: [
      {
        q: "How do I log a meal?",
        a: "You can log meals through our AI chatbot. Simply send a message describing your meal (e.g., 'I had 2 slices of whole wheat toast, 1 boiled egg, and a banana for breakfast'). The chatbot will extract the nutrition information and log it for you. You can also upload photos or PDF files of your meals.",
      },
      {
        q: "How accurate is the nutrition information?",
        a: "We use Spoonacular API to fetch nutrition data for your meals. The information is generally accurate, but keep in mind that nutritional values can vary based on preparation methods and portion sizes. For best results, be as specific as possible when describing your meals.",
      },
      {
        q: "How do I log a workout?",
        a: "Similar to meals, you can log workouts through the chatbot. Describe your workout including the exercise name, sets, reps, duration, and calories burned. For example: 'I did 3 sets of 10 push-ups and ran for 30 minutes, burning 300 calories.'",
      },
      {
        q: "Can I edit or delete logged meals and workouts?",
        a: "Currently, you can view your logged meals and workouts on the Dashboard and Progress pages. Edit and delete functionality will be available in a future update.",
      },
    ],
  },
  {
    title: "Dashboard & Progress",
    questions: [
      {
        q: "What information is shown on the Dashboard?",
        a: "The Dashboard displays your daily summary including calories consumed and burned, macronutrient breakdown (protein, carbs, fat), and recent meals and workouts. It provides a quick overview of your day's nutrition and activity.",
      },
      {
        q: "How is my progress tracked?",
        a: "The Progress page shows your weekly and monthly trends for calories, macronutrients, and workouts. You can view charts comparing current and previous periods to see your progress over time.",
      },
      {
        q: "Can I set goals for calories or workouts?",
        a: "Goal setting features are coming soon. For now, you can track your daily intake and activity to understand your current patterns.",
      },
    ],
  },
  {
    title: "AI Chatbot",
    questions: [
      {
        q: "What can the chatbot help me with?",
        a: "Our AI chatbot can help you log meals and workouts, answer nutrition questions, provide meal and workout recommendations based on your goals, and offer general health and fitness advice.",
      },
      {
        q: "How do I use the chatbot?",
        a: "Navigate to the Chatbot page from the main menu. Type your question or describe what you'd like to log, and the chatbot will respond with helpful information or confirm that your data has been logged.",
      },
      {
        q: "Is my conversation data stored?",
        a: "Conversation data is used to provide you with personalized recommendations and to log your meals and workouts. We do not share your personal data with third parties. See our Privacy Policy for more details.",
      },
    ],
  },
  {
    title: "Account & Settings",
    questions: [
      {
        q: "How do I update my profile information?",
        a: "Go to Profile Settings from the main menu. You can update your personal information, health metrics, goals, and preferences at any time.",
      },
      {
        q: "Can I change my email address?",
        a: "Email address changes are currently handled through your account settings. If you signed up with Google, your email is managed through your Google account.",
      },
      {
        q: "How do I delete my account?",
        a: "To delete your account, please contact our support team. Account deletion is permanent and will remove all your data including meal logs, workout logs, and profile information.",
      },
      {
        q: "I forgot my password. How do I reset it?",
        a: "On the Sign In page, click 'Forgot password?' and enter your email address. You'll receive instructions to reset your password via email.",
      },
    ],
  },
  {
    title: "Privacy & Security",
    questions: [
      {
        q: "How is my data protected?",
        a: "We use industry-standard security measures including encryption, secure authentication, and Row Level Security (RLS) to protect your data. Your personal information is never shared with third parties without your consent.",
      },
      {
        q: "What data do you collect?",
        a: "We collect the information you provide during sign-up and onboarding, as well as your meal logs, workout logs, and chatbot interactions. This data is used solely to provide and improve our services. See our Privacy Policy for complete details.",
      },
      {
        q: "Can I export my data?",
        a: "Data export functionality is coming soon. If you need to export your data before this feature is available, please contact support.",
      },
    ],
  },
];

export function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter FAQs based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return faqCategories;
    }

    const query = searchQuery.toLowerCase().trim();
    return faqCategories
      .map((category) => {
        const filteredQuestions = category.questions.filter(
          (faq) =>
            faq.q.toLowerCase().includes(query) ||
            faq.a.toLowerCase().includes(query)
        );
        return filteredQuestions.length > 0
          ? { ...category, questions: filteredQuestions }
          : null;
      })
      .filter((category) => category !== null);
  }, [searchQuery]);

  const hasResults = filteredCategories.length > 0;

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <SettingsSidebar />
      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Help Center
          </h1>
          <p className="mt-2 text-base text-gray-600">
            Find answers to common questions and learn how to get the most out
            of VitaTrack
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-10 text-sm text-gray-900 placeholder-gray-500 focus:border-[#1A381D] focus:outline-none focus:ring-2 focus:ring-[#1A381D] focus:ring-opacity-20"
            />
            <svg
              className="absolute left-3 top-3 h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* FAQ Sections */}
        {hasResults ? (
          <div className="space-y-6">
            {filteredCategories.map((category, categoryIndex) => (
              <section
                key={categoryIndex}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <h2 className="mb-4 text-xl font-bold text-gray-900">
                  {category.title}
                </h2>
                <div className="space-y-4">
                  {category.questions.map((faq, faqIndex) => (
                    <div
                      key={faqIndex}
                      className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
                    >
                      <h3 className="mb-1.5 text-base font-semibold text-gray-900">
                        {faq.q}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              No results found
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              We couldn't find any answers matching "{searchQuery}". Try
              different keywords or{" "}
              <a
                href="mailto:support@vitatrack.com"
                className="text-[#1A381D] hover:underline"
              >
                contact support
              </a>
              .
            </p>
          </div>
        )}

        {/* Contact Support */}
        <div className="mt-10 rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Still need help?</h2>
          <p className="mt-2 text-sm text-gray-600">
            Not what you're looking for? Contact our support team and we'll get
            back to you as soon as possible.
          </p>
          <a
            href="mailto:support@vitatrack.com"
            className="mt-4 inline-block rounded-lg bg-[#1A381D] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#2A4A2D] transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
