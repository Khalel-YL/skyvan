"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

const adminNavigation = [
  {
    title: "Genel",
    items: [
      {
        title: "Dashboard",
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
        title: "Lead'ler",
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
        title: "Datasheets",
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
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-black/30 xl:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="border-b border-white/10 px-6 py-6">
          <Link href="/admin" className="block">
            <div className="text-xs uppercase tracking-[0.28em] text-white/45">
              Skyvan
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Admin Core
            </div>
            <div className="mt-2 text-sm text-white/55">
              Veri, kural ve operasyon omurgası
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-6">
            {adminNavigation.map((group) => (
              <div key={group.title}>
                <div className="px-3 pb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white/35">
                  {group.title}
                </div>

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/admin" && pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={[
                          "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition",
                          isActive
                            ? "bg-white text-black"
                            : "text-white/70 hover:bg-white/5 hover:text-white",
                        ].join(" ")}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>
      </div>
    </aside>
  );
}