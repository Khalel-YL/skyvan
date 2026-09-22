"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ExternalLink, LockKeyhole, Menu, X } from "lucide-react";

import { adminNavItems } from "@/app/lib/admin/admin-nav";
import { AdminSidebarClient } from "./admin-sidebar-client";

type AdminTopbarProps = {
  databaseStatus: "online" | "degraded";
  databaseNote: string;
};

const quickLinks = [
  {
    label: "Yayındaki site",
    href: "/tr",
    icon: ExternalLink,
    note: "Canlı",
    locked: false,
  },
  {
    label: "Workshop",
    href: "/workshop",
    icon: LockKeyhole,
    note: "Gelecek faz",
    locked: true,
  },
];

function isRouteActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getPageTitle(pathname: string) {
  return (
    adminNavItems.find((item) => isRouteActive(pathname, item.href))?.title ??
    "Admin"
  );
}

export function AdminTopbar({
  databaseStatus,
  databaseNote,
}: AdminTopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isOnline = databaseStatus === "online";
  const pageTitle = getPageTitle(pathname);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--admin-border)] bg-[var(--admin-bg)]/90 backdrop-blur-xl">
        <div className="flex min-h-14 items-center gap-3 px-4 py-2.5 md:px-6">
          <button
            type="button"
            aria-label={menuOpen ? "Admin menüyü kapat" : "Admin menüyü aç"}
            aria-expanded={menuOpen}
            aria-controls="admin-mobile-menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] transition hover:border-[var(--admin-border-strong)] xl:hidden"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--admin-muted)]">
              Skyvan Admin
            </p>
            <h2 className="truncate text-base font-semibold text-[var(--admin-text)]">
              {pageTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 lg:flex">
              {quickLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-medium transition ${
                      item.locked
                        ? "border-amber-400/20 bg-amber-400/10 text-amber-200 hover:border-amber-300/35"
                        : "border-[var(--admin-border)] bg-[var(--admin-surface)] text-zinc-300 hover:border-[var(--admin-border-strong)] hover:text-[var(--admin-text)]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                    {item.locked ? (
                      <span className="rounded-full border border-amber-300/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-amber-100">
                        Kilitli
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>

            <div
              title={databaseNote}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-xs font-medium ${
                isOnline
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                  : "border-amber-500/25 bg-amber-500/10 text-amber-300"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isOnline ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              <span className="hidden sm:inline">
                {isOnline ? "DB hazır" : "Güvenli mod"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div
        id="admin-mobile-menu"
        className={`fixed inset-0 z-50 xl:hidden ${menuOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          aria-label="Admin menü kaplama alanını kapat"
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          className={`absolute inset-y-0 left-0 flex w-[min(21rem,calc(100vw-1.5rem))] flex-col border-r border-[var(--admin-border)] bg-[var(--admin-bg)] shadow-2xl transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between gap-4 border-b border-[var(--admin-border)] px-4 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--admin-muted)]">
                Skyvan
              </p>
              <h2 className="mt-1 text-lg font-semibold text-[var(--admin-text)]">
                Admin
              </h2>
            </div>
            <button
              type="button"
              aria-label="Admin menüyü kapat"
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto px-2.5 py-3">
            <AdminSidebarClient onNavigate={() => setMenuOpen(false)} />
          </div>

          <div className="grid gap-2 border-t border-[var(--admin-border)] p-3">
            {quickLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm ${
                    item.locked
                      ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
                      : "border-[var(--admin-border)] bg-[var(--admin-surface)] text-zinc-300"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--admin-muted)]">
                    {item.locked ? "Kilitli" : item.note}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
