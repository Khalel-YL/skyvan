"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { adminNavGroups, type AdminNavItem } from "@/app/lib/admin/admin-nav";

type AdminSidebarClientProps = {
  onNavigate?: () => void;
};

function isRouteActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function AdminNavItemRow({
  item,
  active,
  onNavigate,
}: {
  item: AdminNavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const isDisabled = !item.enabled;
  const content = (
    <>
      <span
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border transition ${
          active
            ? "border-[var(--admin-border-strong)] bg-[var(--admin-text)] text-[var(--admin-bg)] shadow-[0_0_28px_rgba(255,255,255,0.16)]"
            : "border-[var(--admin-border)] bg-[var(--admin-surface-raised)] text-[var(--admin-muted)] group-hover:text-[var(--admin-text)]"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={`truncate text-sm font-medium ${
              active ? "text-[var(--admin-text)]" : "text-zinc-200"
            }`}
          >
            {item.title}
          </span>

          {item.badge ? (
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] ${
                active
                  ? "border-white/20 bg-white/12 text-white"
                  : "border-[var(--admin-border)] bg-[var(--admin-surface-raised)] text-[var(--admin-muted)]"
              }`}
            >
              {item.badge}
            </span>
          ) : null}

          {isDisabled ? (
            <span className="shrink-0 rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-muted)]">
              Kilitli
            </span>
          ) : null}
        </span>

        <span className="mt-1 block max-h-10 overflow-hidden text-[11px] leading-5 text-[var(--admin-muted)]">
          {item.description}
        </span>
      </span>

      {active ? (
        <span className="mt-2 h-7 w-1 shrink-0 rounded-full bg-[var(--admin-text)]" aria-hidden="true" />
      ) : null}
    </>
  );

  const className = `group relative flex w-full min-w-0 items-start gap-3 rounded-[1.15rem] border px-3 py-3 text-left transition ${
    active
      ? "border-[var(--admin-border-strong)] bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(255,255,255,0.055))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_48px_rgba(0,0,0,0.22)]"
      : "border-transparent bg-transparent hover:border-[var(--admin-border)] hover:bg-[var(--admin-surface)]"
  } ${isDisabled ? "cursor-not-allowed opacity-55" : ""}`;

  if (isDisabled) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link href={item.href} className={className} aria-current={active ? "page" : undefined} onClick={onNavigate}>
      {content}
    </Link>
  );
}

export function AdminSidebarClient({ onNavigate }: AdminSidebarClientProps) {
  const pathname = usePathname();

  return (
    <nav className="space-y-6" aria-label="Admin navigation">
      {adminNavGroups.map((group) => {
        const activeInGroup = group.items.some((item) => isRouteActive(pathname, item.href));

        return (
          <section
            key={group.id}
            className={`rounded-[1.4rem] border p-2.5 transition ${
              activeInGroup
                ? "border-[var(--admin-border-strong)] bg-[var(--admin-surface)]"
                : "border-transparent bg-transparent"
            }`}
          >
            <div className="mb-2 flex items-center justify-between gap-3 px-2">
              <div className="min-w-0">
                <p
                  className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${
                    activeInGroup ? "text-[var(--admin-text)]" : "text-zinc-600"
                  }`}
                >
                  {group.title}
                </p>
                <p className="mt-1 truncate text-[11px] text-[var(--admin-muted)]">{group.description}</p>
              </div>
              {activeInGroup ? (
                <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--admin-text)]" aria-hidden="true" />
              ) : null}
            </div>

            <div className="space-y-1">
              {group.items.map((item) => (
                <AdminNavItemRow
                  key={item.href}
                  item={item}
                  active={isRouteActive(pathname, item.href)}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </section>
        );
      })}
    </nav>
  );
}
