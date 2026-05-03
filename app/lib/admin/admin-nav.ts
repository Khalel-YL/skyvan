import {
  BadgeEuro,
  Blocks,
  BookOpen,
  Bot,
  Boxes,
  FileDigit,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Package,
  Settings2,
  ShieldCheck,
  Truck,
  Users,
  Waypoints,
  Activity,
  type LucideIcon,
} from "lucide-react";

export type AdminNavSection = "stable" | "pipeline";
export type AdminNavGroupId =
  | "overview"
  | "content"
  | "engineering-core"
  | "commercial-operations"
  | "intelligence-governance"
  | "system";

export type AdminNavItem = {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
  enabled: boolean;
  section: AdminNavSection;
  group: AdminNavGroupId;
  badge?: string;
};

export type AdminNavGroup = {
  id: AdminNavGroupId;
  title: string;
  description: string;
  items: AdminNavItem[];
};

export const adminNavItems: AdminNavItem[] = [
  {
    title: "Genel Bakış",
    href: "/admin",
    description: "Genel durum ve sistem sağlığı",
    icon: LayoutDashboard,
    enabled: true,
    section: "stable",
    group: "overview",
  },
  {
    title: "Sayfalar",
    href: "/admin/pages",
    description: "Public sayfalar ve locale içerik yönetimi",
    icon: FileText,
    enabled: true,
    section: "stable",
    group: "content",
  },
  {
    title: "Blog",
    href: "/admin/blog",
    description: "Editoryal içerik ve yayın hazırlığı",
    icon: BookOpen,
    enabled: true,
    section: "stable",
    group: "content",
  },
  {
    title: "Medya",
    href: "/admin/media",
    description: "Gerçek medya referansları ve etiket yüzeyi",
    icon: FolderKanban,
    enabled: true,
    section: "stable",
    group: "content",
  },
  {
    title: "SEO & Ayarlar",
    href: "/admin/settings",
    description: "SEO kapsaması ve runtime governance görünürlüğü",
    icon: Settings2,
    enabled: true,
    section: "stable",
    group: "content",
    badge: "Yeni",
  },
  {
    title: "Araç Modelleri",
    href: "/admin/models",
    description: "Şasi, ağırlık ve temel ölçüler",
    icon: Truck,
    enabled: true,
    section: "stable",
    group: "engineering-core",
  },
  {
    title: "Kategoriler",
    href: "/admin/categories",
    description: "Ürün sınıflandırma omurgası",
    icon: Blocks,
    enabled: true,
    section: "stable",
    group: "engineering-core",
  },
  {
    title: "Ürünler",
    href: "/admin/products",
    description: "Parça ve donanım havuzu",
    icon: Package,
    enabled: true,
    section: "stable",
    group: "engineering-core",
  },
  {
    title: "Paketler",
    href: "/admin/packages",
    description: "Hazır konfigürasyon setleri",
    icon: Boxes,
    enabled: true,
    section: "stable",
    group: "engineering-core",
  },
  {
    title: "Build Versions",
    href: "/admin/build-versions",
    description: "Build ve versiyon bağı omurgası",
    icon: Waypoints,
    enabled: true,
    section: "stable",
    group: "engineering-core",
    badge: "Yeni",
  },
  {
    title: "Lead'ler",
    href: "/admin/leads",
    description: "Müşteri adayı operasyon hattı",
    icon: Users,
    enabled: true,
    section: "stable",
    group: "commercial-operations",
    badge: "CRM",
  },
  {
    title: "Offers",
    href: "/admin/offers",
    description: "Teklif operasyonu ve satış geçişi",
    icon: BadgeEuro,
    enabled: true,
    section: "stable",
    group: "commercial-operations",
    badge: "CRM",
  },
  {
    title: "Siparişler",
    href: "/admin/orders",
    description: "Üretim akışı ve teslim operasyonu",
    icon: Activity,
    enabled: true,
    section: "stable",
    group: "commercial-operations",
    badge: "CRM",
  },
  {
    title: "Kural Motoru",
    href: "/admin/rules",
    description: "Teknik uyumluluk ve blokaj mantığı",
    icon: Settings2,
    enabled: true,
    section: "stable",
    group: "intelligence-governance",
  },
  {
    title: "AI Core",
    href: "/admin/ai-core",
    description: "Governance ve knowledge readiness görünürlüğü",
    icon: Bot,
    enabled: true,
    section: "stable",
    group: "intelligence-governance",
  },
  {
    title: "Audit & Publish",
    href: "/admin/audit",
    description: "Audit logları ve publish revision görünürlüğü",
    icon: ShieldCheck,
    enabled: true,
    section: "stable",
    group: "intelligence-governance",
    badge: "Yeni",
  },
  {
    title: "Datasheet Merkezi",
    href: "/admin/datasheets",
    description: "AI bilgi tabanı belge kayıt merkezi",
    icon: FileDigit,
    enabled: true,
    section: "stable",
    group: "intelligence-governance",
    badge: "Yeni",
  },
  {
    title: "Kullanıcılar",
    href: "/admin/users",
    description: "Mevcut kullanıcı ve rol yönetimi çekirdeği",
    icon: Users,
    enabled: true,
    section: "stable",
    group: "system",
    badge: "Core",
  },
];

const adminNavGroupMeta: Array<Omit<AdminNavGroup, "items">> = [
  {
    id: "overview",
    title: "Overview",
    description: "Operasyon çekirdeği",
  },
  {
    id: "content",
    title: "Content",
    description: "Yayın ve medya kontrolü",
  },
  {
    id: "engineering-core",
    title: "Engineering Core",
    description: "Ürün ve build omurgası",
  },
  {
    id: "commercial-operations",
    title: "Commercial Operations",
    description: "CRM ve satış hattı",
  },
  {
    id: "intelligence-governance",
    title: "Intelligence & Governance",
    description: "AI, kural ve denetim yüzeyi",
  },
  {
    id: "system",
    title: "System",
    description: "Erişim ve kullanıcı yönetimi",
  },
];

export const adminNavGroups: AdminNavGroup[] = adminNavGroupMeta.map((group) => ({
  ...group,
  items: adminNavItems.filter((item) => item.group === group.id),
}));
