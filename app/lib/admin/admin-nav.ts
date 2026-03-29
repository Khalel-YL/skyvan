import {
  Blocks,
  Bot,
  Boxes,
  FileDigit,
  FileText,
  LayoutDashboard,
  Package,
  Settings2,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminNavSection = "stable" | "pipeline";

export type AdminNavItem = {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
  enabled: boolean;
  section: AdminNavSection;
  badge?: string;
};

export const adminNavItems: AdminNavItem[] = [
  {
    title: "Genel Bakış",
    href: "/admin",
    description: "Genel durum ve sistem sağlığı",
    icon: LayoutDashboard,
    enabled: true,
    section: "stable",
  },
  {
    title: "Araç Modelleri",
    href: "/admin/models",
    description: "Şasi, ağırlık ve temel ölçüler",
    icon: Truck,
    enabled: true,
    section: "stable",
  },
  {
    title: "Kategoriler",
    href: "/admin/categories",
    description: "Ürün sınıflandırma omurgası",
    icon: Blocks,
    enabled: true,
    section: "stable",
  },
  {
    title: "Ürünler",
    href: "/admin/products",
    description: "Parça ve donanım havuzu",
    icon: Package,
    enabled: true,
    section: "stable",
  },
  {
    title: "Paketler",
    href: "/admin/packages",
    description: "Hazır konfigürasyon setleri",
    icon: Boxes,
    enabled: true,
    section: "stable",
  },
  {
    title: "Kural Motoru",
    href: "/admin/rules",
    description: "Teknik uyumluluk ve blokaj mantığı",
    icon: Settings2,
    enabled: true,
    section: "stable",
  },
  {
    title: "Datasheet Merkezi",
    href: "/admin/datasheets",
    description: "AI bilgi tabanı belge kayıt merkezi",
    icon: FileDigit,
    enabled: true,
    section: "stable",
    badge: "Yeni",
  },
  {
    title: "Sayfalar",
    href: "/admin/pages",
    description: "Vitrin ve içerik yönetimi",
    icon: FileText,
    enabled: false,
    section: "pipeline",
  },
  {
    title: "Lead'ler",
    href: "/admin/leads",
    description: "Müşteri adayı operasyonu",
    icon: Users,
    enabled: false,
    section: "pipeline",
  },
  {
    title: "AI Core",
    href: "/admin/ai-core",
    description: "Parsing ve embedding operasyon katmanı",
    icon: Bot,
    enabled: false,
    section: "pipeline",
  },
];