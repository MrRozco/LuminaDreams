import {
  Clapperboard,
  LayoutDashboard,
  NotebookText,
  Settings2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export interface AppNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const APP_NAV_ITEMS: AppNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Journal", href: "/journal", icon: NotebookText },
  { label: "Insights", href: "/insights", icon: Sparkles },
  { label: "Creations", href: "/creations", icon: Clapperboard },
  { label: "Settings", href: "/settings", icon: Settings2 },
];
