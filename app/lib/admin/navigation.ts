import {
  Activity,
  BookOpen,
  Boxes,
  BrainCircuit,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Package,
  ScrollText,
  Truck,
  Users,
  Wrench,
} from "lucide-react";

import type { AdminNavGroup } from "./types";

export const adminNavigation: AdminNavGroup[] = [
  {
    title: "Genel",
    items: [
      {
        title: "Genel Bakış",
        href: "/admin",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "İçerik",
    items: [
      {
        title: "Sayfalar",
        href: "/admin/pages",
        icon: FileText,
      },
      {
        title: "Blog",
        href: "/admin/blog",
        icon: BookOpen,
      },
      {
        title: "Medya",
        href: "/admin/media",
        icon: FolderKanban,
      },
    ],
  },
  {
    title: "Ticari Operasyon",
    items: [
      {
        title: "Müşteri Adayları",
        href: "/admin/leads",
        icon: Users,
      },
      {
        title: "Teklifler",
        href: "/admin/offers",
        icon: ScrollText,
      },
      {
        title: "Siparişler",
        href: "/admin/orders",
        icon: Activity,
      },
    ],
  },
  {
    title: "Teknik Omurga",
    items: [
      {
        title: "Modeller",
        href: "/admin/models",
        icon: Truck,
      },
      {
        title: "Paketler",
        href: "/admin/packages",
        icon: Boxes,
      },
      {
        title: "Ürünler",
        href: "/admin/products",
        icon: Package,
      },
      {
        title: "Kurallar",
        href: "/admin/rules",
        icon: BrainCircuit,
      },
      {
        title: "Datasheet Merkezi",
        href: "/admin/datasheets",
        icon: Wrench,
      },
      {
        title: "AI Core",
        href: "/admin/ai-core",
        icon: BrainCircuit,
      },
    ],
  },
];
