import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const routeTitles: Record<string, string> = {
  "/": "VitaTrack",
  "/signin": "Sign In - VitaTrack",
  "/signup": "Sign Up - VitaTrack",
  "/auth/callback": "Signing In - VitaTrack",
  "/onboarding": "Onboarding - VitaTrack",
  "/dashboard": "Dashboard - VitaTrack",
  "/profile": "Profile - VitaTrack",
  "/profile/edit": "Edit Profile - VitaTrack",
  "/chatbot": "Chatbot - VitaTrack",
  "/progress": "Progress - VitaTrack",
  "/pricings": "Pricings - VitaTrack",
  "/help": "Help Center - VitaTrack",
  "/privacy": "Privacy Policy - VitaTrack",
};

export function DocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith("/resources")) {
      document.title = "Resources - VitaTrack";
    } else {
      const title = routeTitles[pathname] || "VitaTrack";
      document.title = title;
    }
  }, [pathname]);

  return null;
}
