"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Home, LockKeyhole, Menu, MonitorUp, X } from "lucide-react";

import { AdminSidebarClient } from "./admin-sidebar-client";

type AdminTopbarProps = {
  databaseStatus: "online" | "degraded";
  databaseNote: string;
};

const quickLinks = [
  {
    label: "Yayındaki Site",
    href: "/tr",
    icon: ExternalLink,
    note: "Canlı yayın yüzeyi",
    locked: false,
  },
  {
    label: "Admin Ana Sayfa",
    href: "/admin",
    icon: Home,
    note: "Operasyon merkezi",
    locked: false,
  },
  {
    label: "Workshop",
    href: "/workshop",
    icon: LockKeyhole,
    note: "Gelecek faz / kilitli",
    locked: true,
  },
];

export function AdminTopbar({
  databaseStatus,
  databaseNote,
}: AdminTopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isOnline = databaseStatus === "online";

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[var(--admin-border)] bg-[var(--admin-bg)]/88 backdrop-blur-xl">
        <div className="px-4 py-3 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label={menuOpen ? "Admin menüyü kapat" : "Admin menüyü aç"}
                aria-expanded={menuOpen}
                aria-controls="admin-mobile-menu"
                onClick={() => setMenuOpen((open) => !open)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)] transition hover:border-[var(--admin-border-strong)] xl:hidden"
              >
                {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--admin-muted)]">
                  Stabilizasyon Aşaması
                </p>
                <div className="mt-1 flex min-w-0 items-center gap-2">
                  <MonitorUp className="hidden h-4 w-4 shrink-0 text-[var(--admin-muted)] sm:block" />
                  <h2 className="truncate text-base font-semibold text-[var(--admin-text)] md:text-lg">
                    Skyvan operasyon çekirdeği
                  </h2>
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
              <div className="hidden min-w-0 items-center justify-end gap-2 lg:flex">
                {quickLinks.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition ${
                        item.locked
                          ? "border-amber-400/20 bg-amber-400/10 text-amber-200 hover:border-amber-300/35"
                          : "border-[var(--admin-border)] bg-[var(--admin-surface)] text-zinc-300 hover:border-[var(--admin-border-strong)] hover:text-[var(--admin-text)]"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{item.label}</span>
                      {item.locked ? (
                        <span className="rounded-full border border-amber-300/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-amber-100">
                          Kilitli
                        </span>
                      ) : (
                        <span className="hidden text-[10px] text-[var(--admin-muted)] 2xl:inline">
                          {item.note}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              <div
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium ${
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
                {isOnline ? "DB Hazır" : "Güvenli Mod"}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 border-t border-[var(--admin-border)] pt-3 text-xs text-[var(--admin-muted)] md:flex-row md:items-center md:justify-between">
            <p className="min-w-0 leading-5">{databaseNote}</p>
            <p className="shrink-0 font-medium text-zinc-400">
              Admin shell · premium temel
            </p>
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
          className={`absolute inset-y-0 left-0 flex w-[min(23rem,calc(100vw-1.5rem))] flex-col border-r border-[var(--admin-border)] bg-[var(--admin-bg)] shadow-2xl transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-start justify-between gap-4 border-b border-[var(--admin-border)] px-5 py-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--admin-muted)]">
                Skyvan
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--admin-text)]">
                Admin Core
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--admin-muted)]">
                Kompakt operasyon menüsü
              </p>
            </div>
            <button
              type="button"
              aria-label="Admin menüyü kapat"
              onClick={() => setMenuOpen(false)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="custom-scrollbar flex-1 overflow-y-auto px-3 py-4">
            <AdminSidebarClient onNavigate={() => setMenuOpen(false)} />
          </div>

          <div className="border-t border-[var(--admin-border)] p-4">
            <div className="grid gap-2">
              {quickLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-sm ${
                      item.locked
                        ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
                        : "border-[var(--admin-border)] bg-[var(--admin-surface)] text-zinc-300"
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--admin-muted)]">
                      {item.note}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
