import { useNavigate, useLocation } from "react-router-dom";

const SettingsIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const HelpIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const PricingsIcon = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const sidebarItems = [
  { icon: <SettingsIcon />, path: "/profile", label: "Settings" },
  { icon: <HelpIcon />, path: "/help", label: "Help" },
  { icon: <PricingsIcon />, path: "/pricings", label: "Pricings" },
];

export function SettingsSidebar() {
  const nav = useNavigate();
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 z-40 pt-30 hidden h-screen w-16 flex-col items-center border-r border-gray-100 bg-white py-6 lg:flex">
      {sidebarItems.map((item, i) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={i}
            onClick={() => nav(item.path)}
            className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl transition-colors cursor-pointer ${
              isActive
                ? "bg-[#DDF3D8] text-[#34A853]"
                : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            }`}
            title={item.label}
          >
            {item.icon}
          </button>
        );
      })}
    </aside>
  );
}
