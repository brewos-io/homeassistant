import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/lib/mode";
import { isDemoMode } from "@/lib/demo-mode";
import { LogOut, ChevronDown, Coffee, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Demo user for demo mode
const DEMO_USER = {
  id: "demo-user",
  email: "demo@brewos.io",
  name: "Demo User",
  picture: null as string | null,
};

interface UserMenuProps {
  onExitDemo?: () => void;
}

export function UserMenu({ onExitDemo }: UserMenuProps) {
  const navigate = useNavigate();
  const { user: realUser, signOut, devices } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDemo = isDemoMode();
  const user = isDemo ? DEMO_USER : realUser;

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close menu on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsOpen(false);
    if (isDemo && onExitDemo) {
      onExitDemo();
    } else {
      await signOut();
      navigate("/login");
    }
  };

  const handleManageDevices = () => {
    setIsOpen(false);
    navigate("/machines");
  };

  if (!user) return null;

  // Get initials for avatar fallback
  const getInitials = (name: string | null, email: string) => {
    if (name) {
      const parts = name.split(" ");
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(user.name, user.email);
  const displayName = user.name || user.email.split("@")[0];

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 p-1.5 pr-3 rounded-full transition-all",
          "hover:bg-theme-tertiary",
          isOpen && "bg-theme-tertiary"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        {user.picture ? (
          <img
            src={user.picture}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-theme-tertiary"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm font-semibold ring-2 ring-theme-tertiary">
            {initials}
          </div>
        )}
        <ChevronDown
          className={cn(
            "w-4 h-4 text-theme-secondary transition-transform hidden sm:block",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            "absolute right-0 mt-2 w-72 rounded-2xl overflow-hidden",
            "dropdown-menu",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2",
            "duration-200"
          )}
          role="menu"
        >
          {/* User Info Header */}
          <div className="px-4 py-4 border-b border-theme bg-theme-secondary/50">
            <div className="flex items-center gap-3">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={displayName}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-lg"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white text-lg font-semibold ring-2 ring-white shadow-lg">
                  {isDemo ? <Sparkles className="w-6 h-6" /> : initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-theme truncate">
                    {displayName}
                  </p>
                  {isDemo && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-accent text-white rounded">
                      Demo
                    </span>
                  )}
                </div>
                <p className="text-sm text-theme-muted truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* Devices Summary */}
            <button
              onClick={handleManageDevices}
              className="w-full flex items-center gap-3 px-4 py-3 dropdown-item hover:bg-theme-secondary transition-colors"
              role="menuitem"
            >
              <div className="w-9 h-9 rounded-xl bg-theme-secondary flex items-center justify-center">
                <Coffee className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-theme-card">My Machines</p>
                <p className="text-xs text-theme-muted">
                  {isDemo
                    ? "1 machine connected"
                    : devices.length === 0
                    ? "No machines connected"
                    : devices.length === 1
                    ? "1 machine connected"
                    : `${devices.length} machines connected`}
                </p>
              </div>
            </button>

            <div className="my-2 border-t border-theme" />

            {/* Exit Demo / Sign Out */}
            <button
              onClick={handleSignOut}
              className={
                isDemo
                  ? "w-full flex items-center gap-3 px-4 py-3 dropdown-item hover:bg-theme-secondary text-theme-secondary transition-colors"
                  : "w-full flex items-center gap-3 px-4 py-3 dropdown-item hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 transition-colors"
              }
              role="menuitem"
            >
              <div
                className={
                  isDemo
                    ? "w-9 h-9 rounded-xl bg-theme-secondary flex items-center justify-center"
                    : "w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
                }
              >
                <LogOut className="w-5 h-5" />
              </div>
              <span className="font-medium">
                {isDemo ? "Exit Demo" : "Sign Out"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
