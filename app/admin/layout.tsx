import type { ReactNode } from "react";
import Link from "next/link";

import { getAdminHealth } from "@/app/lib/admin/admin-health";
import { getAdminBootstrapState } from "@/app/lib/auth/bootstrap";
import { getAdminAccessState } from "@/app/lib/auth/server";
import { AdminShell } from "./_components/admin-shell";

function getAccessStatusLabel(status: string) {
  switch (status) {
    case "secret_missing":
      return "Session secret eksik";
    case "session_missing":
      return "Session cookie yok";
    case "session_invalid":
      return "Session geçersiz";
    case "session_expired":
      return "Session süresi dolmuş";
    case "db_unavailable":
      return "Database doğrulaması yok";
    case "user_missing":
      return "Kullanıcı eşleşmedi";
    case "authenticated":
      return "Kimlik doğrulandı";
    default:
      return status;
  }
}

function getAccessToneClasses(allowed: boolean, isAuthenticated: boolean) {
  if (allowed) {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }

  if (isAuthenticated) {
    return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  }

  return "border-rose-500/20 bg-rose-500/10 text-rose-200";
}

function getAccessHeadline(allowed: boolean, isAuthenticated: boolean) {
  if (allowed) {
    return "Admin oturumu doğrulandı";
  }

  if (isAuthenticated) {
    return "Kimlik doğrulandı ama admin erişimi reddedildi";
  }

  return "Identity & Access Core admin içeriğini kilitledi";
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const health = getAdminHealth();
  const access = await getAdminAccessState();
  const bootstrap = await getAdminBootstrapState({
    currentUserId: access.user?.id ?? null,
    currentUserRole: access.user?.role ?? null,
  });

  return (
    <AdminShell
      databaseStatus={health.status}
      databaseNote={health.note}
    >
      {access.allowed ? (
        children
      ) : (
        <div className="space-y-6">
          <section
            className={`rounded-3xl border p-6 ${getAccessToneClasses(
              access.allowed,
              access.isAuthenticated,
            )}`}
          >
            <div className="text-xs uppercase tracking-[0.24em] opacity-80">
              Admin · Identity & Access Core
            </div>
            <h1 className="mt-3 text-2xl font-semibold text-white">
              {getAccessHeadline(access.allowed, access.isAuthenticated)}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 opacity-90">
              Interim controlled access flow aktiftir. Admin içeriği yalnızca
              signed session cookie, server-side user çözümleme ve admin rolü
              birlikte doğrulandığında açılır. İlk ownership claim gerekiyorsa
              bu da explicit bootstrap gate üzerinden yürür.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/access?next=%2Fadmin"
                className="inline-flex items-center rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
              >
                {bootstrap.isOpen ? "Ownership claim ekranını aç" : "Controlled access ekranını aç"}
              </Link>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Session durumu
              </div>
              <div className="mt-2 text-lg font-semibold text-white">
                {getAccessStatusLabel(access.status)}
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-400">
                {access.reason}
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                OpenID preview
              </div>
              <div className="mt-2 text-lg font-semibold text-white">
                {access.openIdPreview ?? "Tanımlı değil"}
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-400">
                Signed session çözümlenebilirse request bu kimliğe bağlanır.
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Role / kullanıcı
              </div>
              <div className="mt-2 text-lg font-semibold text-white">
                {access.user ? access.user.role : "Doğrulanmadı"}
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-400">
                {access.user?.email?.trim() ||
                  access.user?.name?.trim() ||
                  "Users tablosuna bağlı kullanıcı yok."}
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Ownership bootstrap
              </div>
              <div className="mt-2 text-lg font-semibold text-white">
                {!bootstrap.configured
                  ? "Blocker"
                  : bootstrap.isOpen
                    ? bootstrap.canClaim
                      ? "Claim açık"
                      : "Session bekliyor"
                    : "Kapalı"}
              </div>
              <div className="mt-2 text-sm leading-6 text-zinc-400">
                {bootstrap.adminCount} admin kayıtlı. {bootstrap.reason}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-6">
            <h2 className="text-lg font-semibold text-white">Bu ne anlama geliyor?</h2>
            <div className="mt-3 space-y-3 text-sm leading-6 text-zinc-400">
              <p>
                Admin route&apos;ları artık fail-closed çalışır. Geçerli signed session
                yoksa veya kullanıcı admin değilse içerik render edilmez.
              </p>
              <p>
                Interim controlled access flow session&apos;ı güvenli şekilde üretir.
                Eğer sistemde henüz admin yoksa ilk ownership claim `/access`
                ekranında explicit bootstrap secret ile yapılabilir.
              </p>
            </div>
          </section>
        </div>
      )}
    </AdminShell>
  );
}
