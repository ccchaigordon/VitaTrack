import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./components/RequireAuth";
import { RedirectIfAuth } from "./components/RedirectIfAuth";
import { UserProvider } from "./contexts/UserContext";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { DashboardPage } from "./pages/DashboardPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { ProfileSettingsPage } from "./pages/ProfileSettingsPage";
import { ProfileEditPage } from "./pages/ProfileEditPage";
import { SignInPage } from "./pages/SignInPage";
import { SignUpPage } from "./pages/SignUpPage";
import { ChatApp } from "./pages/ChatApp";
import Navbar from "./components/navbar";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <Navbar />
      {children}
    </UserProvider>
  );
}

export function App() {
  return (
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
            <AuthenticatedLayout>
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

      <Route path="*" element={<Navigate to="/signin" replace />} />
    </Routes>
  );
}
