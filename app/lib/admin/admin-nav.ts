import {
  Blocks,
  Bot,
  Boxes,
  LayoutDashboard,
  Package,
  Settings2,
  Truck,
  Wrench,
} from "lucide-react";

export type AdminNavItem = {
  title: string;
  href: string;
  description: string;
  icon: typeof LayoutDashboard;
  enabled: boolean;
};

export const adminNavItems: AdminNavItem[] = [
  {
    title: "Dashboard",
    href: "/admin",
    description: "Genel durum ve sistem sağlığı",
    icon: LayoutDashboard,
    enabled: true,
  },
  {
    title: "Araç Modelleri",
    href: "/admin/models",
    description: "Şasi, ağırlık ve temel ölçüler",
    icon: Truck,
    enabled: true,
  },
  {
    title: "Kategoriler",
    href: "/admin/categories",
    description: "Ürün omurgası",
    icon: Blocks,
    enabled: false,
  },
  {
    title: "Ürünler",
    href: "/admin/products",
    description: "Parça ve donanım havuzu",
    icon: Package,
    enabled: false,
  },
  {
    title: "Paketler",
    href: "/admin/packages",
    description: "Hazır konfigürasyonlar",
    icon: Boxes,
    enabled: false,
  },
  {
    title: "Kural Motoru",
    href: "/admin/rules",
    description: "Teknik uyumluluk denetimleri",
    icon: Settings2,
    enabled: false,
  },
  {
    title: "AI Katmanı",
    href: "/admin/ai",
    description: "Bilgi ve açıklama sistemi",
    icon: Bot,
    enabled: false,
  },
  {
    title: "Workshop",
    href: "/admin/workshop",
    description: "Atölye görünümü ve ilerleme",
    icon: Wrench,
    enabled: false,
  },
];