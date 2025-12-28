import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { RequireAuth } from "./components/RequireAuth";
import { RedirectIfAuth } from "./components/RedirectIfAuth";
import { RequireProfileComplete } from "./components/RequireProfileComplete";
import { ScrollToTop } from "./components/ScrollToTop";
import { DocumentTitle } from "./components/DocumentTitle";
import { UserProvider } from "./contexts/UserContext";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { DashboardPage } from "./pages/DashboardPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { ProfileSettingsPage } from "./pages/ProfileSettingsPage";
import { ProfileEditPage } from "./pages/ProfileEditPage";
import { SignInPage } from "./pages/SignInPage";
import { SignUpPage } from "./pages/SignUpPage";
import { ChatApp } from "./pages/ChatApp";
import { ProgressDashboardPage } from "./pages/ProgressDashboardPage";
import PricingPage from "./pages/PricingPage";
import ResourcesPage from "./pages/ResourcesPage";
import RecipeDetailPage from "./pages/RecipeDetailPage";
import { HelpCenterPage } from "./pages/HelpCenterPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import { LandingPage } from "./pages/LandingPage";

function AuthenticatedLayout({
  children,
  showFooter = false,
}: {
  children: React.ReactNode;
  showFooter?: boolean;
}) {
  const location = useLocation();
  const isChatbot = location.pathname.startsWith("/chatbot");

  return (
    <UserProvider>
      <RequireProfileComplete>
        <div
          className={`flex ${isChatbot ? "h-screen" : "min-h-screen"} flex-col`}
        >
          <Navbar />
          <main
            className={`flex-1 min-h-0 flex flex-col ${
              isChatbot ? "overflow-hidden" : "overflow-auto"
            }`}
          >
            {children}
          </main>
          {showFooter && <Footer />}
        </div>
      </RequireProfileComplete>
    </UserProvider>
  );
}

export function App() {
  return (
    <>
      <ScrollToTop />
      <DocumentTitle />
      <Routes>
        <Route
          path="/"
          element={
            <RedirectIfAuth>
              <LandingPage />
            </RedirectIfAuth>
          }
        />
        <Route
          path="/signin"
          element={
            <RedirectIfAuth>
              <SignInPage />
            </RedirectIfAuth>
          }
        />
        <Route
          path="/signup"
          element={
            <RedirectIfAuth>
              <SignUpPage />
            </RedirectIfAuth>
          }
        />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <OnboardingPage />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <AuthenticatedLayout showFooter>
                <DashboardPage />
              </AuthenticatedLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <AuthenticatedLayout>
                <ProfileSettingsPage />
              </AuthenticatedLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <RequireAuth>
              <AuthenticatedLayout>
                <ProfileEditPage />
              </AuthenticatedLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/chatbot/:chatId?"
          element={
            <RequireAuth>
              <AuthenticatedLayout>
                <ChatApp />
              </AuthenticatedLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/resources"
          element={
            <RequireAuth>
              <AuthenticatedLayout showFooter>
                <ResourcesPage />
              </AuthenticatedLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/recipe/:recipeId"
          element={
            <RequireAuth>
              <AuthenticatedLayout>
                <RecipeDetailPage />
              </AuthenticatedLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/progress"
          element={
            <RequireAuth>
              <AuthenticatedLayout>
                <ProgressDashboardPage />
              </AuthenticatedLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/pricings"
          element={
            <RequireAuth>
              <AuthenticatedLayout showFooter>
                <PricingPage />
              </AuthenticatedLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/help"
          element={
            <RequireAuth>
              <AuthenticatedLayout showFooter>
                <HelpCenterPage />
              </AuthenticatedLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/privacy"
          element={
            <RequireAuth>
              <AuthenticatedLayout showFooter>
                <PrivacyPolicyPage />
              </AuthenticatedLayout>
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
