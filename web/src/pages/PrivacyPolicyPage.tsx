export function PrivacyPolicyPage() {
  const lastUpdated = "December 24, 2025";

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-xs text-gray-500">
            Last updated: {lastUpdated}
          </p>
        </div>

        <div className="prose max-w-none rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <section className="mb-8">
            <p className="text-sm text-gray-700 leading-relaxed">
              At VitaTrack, we are committed to protecting your privacy and
              ensuring the security of your personal information. This Privacy
              Policy explains how we collect, use, disclose, and safeguard your
              information when you use our service.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="mb-3 text-xl font-bold text-gray-900">
              1. Information We Collect
            </h2>
            <div className="space-y-3 text-gray-700">
              <div>
                <h3 className="mb-1.5 text-base font-semibold text-gray-900">
                  1.1 Personal Information
                </h3>
                <p className="text-sm leading-relaxed">
                  When you create an account, we collect information such as:
                </p>
                <ul className="ml-5 mt-1.5 list-disc space-y-1 text-sm text-gray-700">
                  <li>Email address</li>
                  <li>Username</li>
                  <li>Full name (optional)</li>
                  <li>
                    Profile information (age, gender, height, weight, activity
                    level, etc.)
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-1.5 text-base font-semibold text-gray-900">
                  1.2 Health and Fitness Data
                </h3>
                <p className="text-sm leading-relaxed">
                  To provide our services, we collect:
                </p>
                <ul className="ml-5 mt-1.5 list-disc space-y-1 text-sm text-gray-700">
                  <li>Meal logs and nutrition information</li>
                  <li>Workout logs and exercise data</li>
                  <li>Health goals and preferences</li>
                  <li>Dietary restrictions and allergies</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-1.5 text-base font-semibold text-gray-900">
                  1.3 Usage Data
                </h3>
                <p className="text-sm leading-relaxed">
                  We automatically collect information about how you interact
                  with our service, including:
                </p>
                <ul className="ml-5 mt-1.5 list-disc space-y-1 text-sm text-gray-700">
                  <li>Chatbot conversation history</li>
                  <li>Pages visited and features used</li>
                  <li>Device information and browser type</li>
                  <li>IP address and location data (general)</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-6">
            <h2 className="mb-3 text-xl font-bold text-gray-900">
              2. How We Use Your Information
            </h2>
            <p className="mb-3 text-sm text-gray-700 leading-relaxed">
              We use the information we collect to:
            </p>
            <ul className="ml-5 list-disc space-y-1.5 text-sm text-gray-700">
              <li>
                Provide, maintain, and improve our services, including
                personalized meal and workout recommendations
              </li>
              <li>
                Process and store your meal and workout logs for tracking and
                analysis
              </li>
              <li>
                Communicate with you about your account, updates, and support
                requests
              </li>
              <li>
                Analyze usage patterns to enhance user experience and develop
                new features
              </li>
              <li>Ensure the security and integrity of our platform</li>
              <li>Comply with legal obligations and protect our rights</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="mb-3 text-xl font-bold text-gray-900">
              3. Information Sharing and Disclosure
            </h2>
            <p className="mb-3 text-sm text-gray-700 leading-relaxed">
              We do not sell, trade, or rent your personal information to third
              parties. We may share your information only in the following
              circumstances:
            </p>
            <div className="space-y-3 text-gray-700">
              <div>
                <h3 className="mb-1.5 text-base font-semibold text-gray-900">
                  3.1 Service Providers
                </h3>
                <p className="text-sm leading-relaxed">
                  We may share information with trusted third-party service
                  providers who assist us in operating our platform, such as:
                </p>
                <ul className="ml-5 mt-1.5 list-disc space-y-1 text-sm">
                  <li>Cloud hosting and database services (Supabase)</li>
                  <li>Nutrition data providers (Spoonacular API)</li>
                  <li>AI and machine learning services (Google Gemini)</li>
                </ul>
                <p className="mt-1.5 text-sm leading-relaxed">
                  These providers are contractually obligated to protect your
                  information and use it only for the purposes we specify.
                </p>
              </div>
              <div>
                <h3 className="mb-1.5 text-base font-semibold text-gray-900">
                  3.2 Legal Requirements
                </h3>
                <p className="text-sm leading-relaxed">
                  We may disclose your information if required by law, court
                  order, or government regulation, or to protect our rights,
                  property, or safety, or that of our users.
                </p>
              </div>
              <div>
                <h3 className="mb-1.5 text-base font-semibold text-gray-900">
                  3.3 Business Transfers
                </h3>
                <p className="text-sm leading-relaxed">
                  In the event of a merger, acquisition, or sale of assets, your
                  information may be transferred to the new entity, subject to
                  the same privacy protections.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-6">
            <h2 className="mb-3 text-xl font-bold text-gray-900">
              4. Data Security
            </h2>
            <p className="mb-3 text-sm text-gray-700 leading-relaxed">
              We implement industry-standard security measures to protect your
              information:
            </p>
            <ul className="ml-5 list-disc space-y-1.5 text-sm text-gray-700">
              <li>
                Encryption of data in transit and at rest using SSL/TLS
                protocols
              </li>
              <li>
                Row Level Security (RLS) to ensure users can only access their
                own data
              </li>
              <li>Secure authentication and authorization mechanisms</li>
              <li>Regular security audits and updates</li>
              <li>
                Limited access to personal information on a need-to-know basis
              </li>
            </ul>
            <p className="mt-3 text-sm text-gray-700 leading-relaxed">
              However, no method of transmission over the internet or electronic
              storage is 100% secure. While we strive to protect your
              information, we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="mb-3 text-xl font-bold text-gray-900">
              5. Your Rights and Choices
            </h2>
            <p className="mb-3 text-sm text-gray-700 leading-relaxed">
              You have the following rights regarding your personal information:
            </p>
            <ul className="ml-5 list-disc space-y-1.5 text-sm text-gray-700">
              <li>
                <strong>Access:</strong> You can access and review your personal
                information through your account settings
              </li>
              <li>
                <strong>Update:</strong> You can update or correct your
                information at any time from your profile settings
              </li>
              <li>
                <strong>Delete:</strong> You can request deletion of your
                account and associated data by contacting our support team
              </li>
              <li>
                <strong>Data Portability:</strong> You can request a copy of
                your data in a machine-readable format (coming soon)
              </li>
              <li>
                <strong>Opt-out:</strong> You can opt out of certain data
                processing activities, though this may limit service
                functionality
              </li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="mb-3 text-xl font-bold text-gray-900">
              6. Cookies and Tracking Technologies
            </h2>
            <p className="mb-3 text-sm text-gray-700 leading-relaxed">
              We use cookies and similar tracking technologies to:
            </p>
            <ul className="ml-5 list-disc space-y-1.5 text-sm text-gray-700">
              <li>Maintain your session and authentication state</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze usage patterns and improve our services</li>
            </ul>
            <p className="mt-3 text-sm text-gray-700 leading-relaxed">
              You can control cookies through your browser settings, but this
              may affect your ability to use certain features of our service.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="mb-3 text-xl font-bold text-gray-900">
              7. Children's Privacy
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              Our service is not intended for children under the age of 13. We
              do not knowingly collect personal information from children under
              13. If we become aware that we have collected information from a
              child under 13, we will take steps to delete such information
              promptly. If you believe we have collected information from a
              child under 13, please contact us immediately.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="mb-3 text-xl font-bold text-gray-900">
              8. International Data Transfers
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              Your information may be transferred to and processed in countries
              other than your country of residence. These countries may have
              data protection laws that differ from those in your country. By
              using our service, you consent to the transfer of your information
              to these countries.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="mb-3 text-xl font-bold text-gray-900">
              9. Changes to This Privacy Policy
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time to reflect
              changes in our practices or for other operational, legal, or
              regulatory reasons. We will notify you of any material changes by
              posting the new Privacy Policy on this page and updating the "Last
              updated" date. We encourage you to review this Privacy Policy
              periodically.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="mb-3 text-xl font-bold text-gray-900">
              10. Contact Us
            </h2>
            <p className="mb-3 text-sm text-gray-700 leading-relaxed">
              If you have any questions, concerns, or requests regarding this
              Privacy Policy or our data practices, please contact us:
            </p>
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              <p className="font-semibold">VitaTrack Support</p>
              <p className="mt-1">Email: privacy@vitatrack.com</p>
              <p className="mt-1">Support: support@vitatrack.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
