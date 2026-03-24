import type { LucideIcon } from "lucide-react";

export type AdminNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

export type DashboardMetric = {
  label: string;
  value: string;
  hint: string;
};

export type DashboardData = {
  metrics: DashboardMetric[];
  health: {
    database: "online" | "degraded";
    note: string;
  };
};