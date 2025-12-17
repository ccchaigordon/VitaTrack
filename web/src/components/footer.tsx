import NavLogo from "../assets/NavLogo.png";

export default function Footer() {
  return (
    <>
      <div className="z-50 bg-gray-100">
        <div className="max-w-7xl mt-4 md:mt-10 px-4 sm:px-6 text-gray-800 grid grid-cols-2 md:grid-cols-4 mx-auto">
          <div className="p-3 sm:p-5 col-span-2 md:col-span-1">
            <a href="/dashboard">
              <img src={NavLogo} alt="VitaTrack" className="h-6 sm:h-8" />
            </a>
            <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-500">
              Your personal health companion for a better lifestyle.
            </p>
          </div>
          <div className="p-3 sm:p-5">
            <div className="text-xs sm:text-sm uppercase text-[#1A381D] font-bold">
              Features
            </div>
            <a
              className="my-2 sm:my-3 block text-xs sm:text-sm text-gray-600 hover:text-[#34A853] transition-colors"
              href="/dashboard"
            >
              Dashboard
            </a>
            <a
              className="my-2 sm:my-3 block text-xs sm:text-sm text-gray-600 hover:text-[#34A853] transition-colors"
              href="/chatbot"
            >
              Chatbot
            </a>
            <a
              className="my-2 sm:my-3 block text-xs sm:text-sm text-gray-600 hover:text-[#34A853] transition-colors"
              href="/progress"
            >
              Progress Tracker
            </a>
            <a
              className="my-2 sm:my-3 block text-xs sm:text-sm text-gray-600 hover:text-[#34A853] transition-colors"
              href="/resources"
            >
              Resources
            </a>
          </div>
          <div className="p-3 sm:p-5">
            <div className="text-xs sm:text-sm uppercase text-[#1A381D] font-bold">
              Support
            </div>
            <a
              className="my-2 sm:my-3 block text-xs sm:text-sm text-gray-600 hover:text-[#34A853] transition-colors"
              href="/help"
            >
              Help Center
            </a>
            <a
              className="my-2 sm:my-3 block text-xs sm:text-sm text-gray-600 hover:text-[#34A853] transition-colors"
              href="/privacy"
            >
              Privacy Policy
            </a>
            <a
              className="my-2 sm:my-3 block text-xs sm:text-sm text-gray-600 hover:text-[#34A853] transition-colors"
              href="/pricings"
            >
              Pricings
            </a>
          </div>
          <div className="p-3 sm:p-5">
            <div className="text-xs sm:text-sm uppercase text-[#1A381D] font-bold">
              Contact Us
            </div>
            <p className="my-2 sm:my-3 text-xs sm:text-sm text-gray-600">
              11800 Gelugor,
              <br />
              Pulau Pinang, Malaysia
            </p>
            <a
              className="my-2 sm:my-3 block text-xs sm:text-sm text-gray-600 hover:text-[#34A853] transition-colors"
              href="mailto:support@vitatrack.com"
            >
              support@vitatrack.com
            </a>
          </div>
        </div>
      </div>

      <div className="z-50 bg-gray-100 pt-2">
        <div
          className="flex pb-4 sm:pb-5 px-3 m-auto pt-4 sm:pt-5 border-t border-gray-200 text-gray-800 text-xs sm:text-sm flex-col
          max-w-lg items-center"
        >
          <div className="my-3 sm:my-5 text-gray-500">
            © 2026 VitaTrack. All Rights Reserved.
          </div>
        </div>
      </div>
    </>
  );
}
