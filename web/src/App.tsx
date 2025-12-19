import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./components/RequireAuth";
import { RedirectIfAuth } from "./components/RedirectIfAuth";
import { ScrollToTop } from "./components/ScrollToTop";
import { UserProvider } from "./contexts/UserContext";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { DashboardPage } from "./pages/DashboardPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { ProfileSettingsPage } from "./pages/ProfileSettingsPage";
import { ProfileEditPage } from "./pages/ProfileEditPage";
import { SignInPage } from "./pages/SignInPage";
import { SignUpPage } from "./pages/SignUpPage";
import { ChatApp } from "./pages/ChatApp";
import PricingPage from "./pages/PricingPage";
import ResourcesPage from "./pages/ResourcesPage";
import Navbar from "./components/navbar";
import Footer from "./components/footer";

function AuthenticatedLayout({
  children,
  showFooter = false,
}: {
  children: React.ReactNode;
  showFooter?: boolean;
}) {
  return (
    <UserProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        {showFooter && <Footer />}
      </div>
    </UserProvider>
  );
}

export function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Navigate to="/signin" replace />} />
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
          path="/chatbot"
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
          path="/pricings"
          element={
            <RequireAuth>
              <AuthenticatedLayout showFooter>
                <PricingPage />
              </AuthenticatedLayout>
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </>
  );
}
