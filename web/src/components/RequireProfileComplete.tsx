import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

export function RequireProfileComplete({ children }: PropsWithChildren) {
  const { me, loading } = useUser();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFBFC]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#34A853] border-t-transparent" />
      </div>
    );
  }

  // If profile is not complete, redirect to onboarding
  if (!me?.profileComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
