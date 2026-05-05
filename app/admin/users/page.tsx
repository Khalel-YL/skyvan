import { and, desc, eq, ilike, or } from "drizzle-orm";
import { ShieldAlert, ShieldCheck, UserCog, Users as UsersIcon } from "lucide-react";
import Link from "next/link";

import { db, getDatabaseHealth } from "@/db/db";
import { users } from "@/db/schema";
import { getAuditRuntimeValidation } from "@/app/lib/admin/audit";
import { updateUserRole } from "./actions";

type UserSearchParams = Promise<{
  q?: string;
  role?: string;
  userAction?: string;
  userCode?: string;
}>;

type RoleFilter = "all" | "user" | "admin";

type UserRow = {
  id: string;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

function normalizeRoleFilter(value: string): RoleFilter {
  if (value === "user" || value === "admin") {
    return value;
  }

  return "all";
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function shortenOpenId(value: string) {
  if (value.length <= 18) {
    return value;
  }

  return `${value.slice(0, 10)}…${value.slice(-6)}`;
}

function daysSince(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

function getRoleClassName(role: UserRow["role"]) {
  return role === "admin"
    ? "border-sky-500/20 bg-sky-500/10 text-sky-200"
    : "border-zinc-700 bg-zinc-900 text-zinc-300";
}

function getRoleNotice(params: Awaited<UserSearchParams>) {
  if (params.userAction === "updated") {
    return {
      tone: "success" as const,
      message: "Kullanıcı rolü güncellendi.",
    };
  }

  if (params.userAction === "noop") {
    return {
      tone: "info" as const,
      message: "Kullanıcı zaten seçilen role sahip.",
    };
  }

  if (params.userAction === "error") {
    if (params.userCode === "invalid-id") {
      return {
        tone: "error" as const,
        message: "Geçersiz kullanıcı isteği alındı.",
      };
    }

    if (params.userCode === "invalid-role") {
      return {
        tone: "error" as const,
        message: "Geçersiz rol değeri gönderildi.",
      };
    }

    if (params.userCode === "missing-user") {
      return {
        tone: "error" as const,
        message: "Güncellenecek kullanıcı kaydı bulunamadı.",
      };
    }

    return {
      tone: "error" as const,
      message: "Kullanıcı rolü güncellenirken beklenmeyen bir hata oluştu.",
    };
  }

  return null;
}

function noticeClassName(tone: "success" | "error" | "info") {
  if (tone === "success") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }

  if (tone === "error") {
    return "border-rose-500/20 bg-rose-500/10 text-rose-200";
  }

  return "border-sky-500/20 bg-sky-500/10 text-sky-200";
}

function StatPill({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-3 py-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          {label}
        </span>
        <span className="text-lg font-semibold text-white">{value}</span>
      </div>
      <p className="mt-1 truncate text-xs text-zinc-500">{hint}</p>
    </div>
  );
}

export default async function UsersAdminPage({
  searchParams,
}: {
  searchParams: UserSearchParams;
}) {
  const params = await searchParams;
  const databaseHealth = getDatabaseHealth();
  const auditRuntime = await getAuditRuntimeValidation();
  const query = String(params.q ?? "").trim();
  const roleFilter = normalizeRoleFilter(String(params.role ?? "all"));
  const notice = getRoleNotice(params);

  let userRows: UserRow[] = [];
  let loadWarning: string | null = null;

  if (db) {
    try {
      const whereConditions = [];

      if (roleFilter !== "all") {
        whereConditions.push(eq(users.role, roleFilter));
      }

      if (query) {
        const pattern = `%${query}%`;
        whereConditions.push(
          or(
            ilike(users.name, pattern),
            ilike(users.email, pattern),
            ilike(users.openId, pattern),
          )!,
        );
      }

      userRows = (await db
        .select({
          id: users.id,
          openId: users.openId,
          name: users.name,
          email: users.email,
          loginMethod: users.loginMethod,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
          lastSignedIn: users.lastSignedIn,
        })
        .from(users)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(users.lastSignedIn), desc(users.createdAt))) as UserRow[];
    } catch (error) {
      console.error("users admin page error:", error);
      loadWarning =
        "Kullanıcı kayıtları okunurken beklenmeyen bir hata oluştu. Sayfa güvenli görünür modda kaldı.";
    }
  }

  const stats = {
    total: userRows.length,
    adminCount: userRows.filter((row) => row.role === "admin").length,
    userCount: userRows.filter((row) => row.role === "user").length,
    signedInLast30Days: userRows.filter((row) => {
      const days = daysSince(row.lastSignedIn);
      return days !== null && days <= 30;
    }).length,
    staleCount: userRows.filter((row) => {
      const days = daysSince(row.lastSignedIn);
      return days !== null && days > 30;
    }).length,
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 border-b border-zinc-800 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            ADMIN · KULLANICILAR
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            Kullanıcı ve Rol Çekirdeği
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-400">
            Mevcut kullanıcı kayıtlarını, rol durumunu ve son giriş sinyallerini
            hızlıca izleyin.
          </p>
        </div>
      </header>

      {!db ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {databaseHealth.note}
        </div>
      ) : null}

      {auditRuntime.closureState !== "ready" ? (
        <div
          className={`rounded-2xl border px-3 py-2 text-sm ${
            auditRuntime.closureState === "blocked"
              ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
              : "border-amber-500/20 bg-amber-500/10 text-amber-200"
          }`}
        >
          {auditRuntime.blocker ? `${auditRuntime.blocker} ` : ""}
          Rol değişimi uygulanabilir, ancak iz kaydı doğrulaması tam hazır değil.
          İşlem aktörü: {auditRuntime.actorPreview}
          {auditRuntime.actorRole ? ` · rol ${auditRuntime.actorRole}` : ""}.
        </div>
      ) : null}

      {loadWarning ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {loadWarning}
        </div>
      ) : null}

      {notice ? (
        <div className={`rounded-2xl border px-3 py-2 text-sm ${noticeClassName(notice.tone)}`}>
          {notice.message}
        </div>
      ) : null}

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
        <StatPill
          label="Toplam Kullanıcı"
          value={String(stats.total)}
          hint="Filtreye uyan kullanıcı kayıtları"
        />
        <StatPill
          label="Admin"
          value={String(stats.adminCount)}
          hint="Rolü admin olan kullanıcılar"
        />
        <StatPill
          label="Standart"
          value={String(stats.userCount)}
          hint="Standart role sahip kullanıcılar"
        />
        <StatPill
          label="Son 30 Gün"
          value={String(stats.signedInLast30Days)}
          hint="Yakın dönemde giriş yapan kullanıcılar"
        />
        <StatPill
          label="Sessiz"
          value={String(stats.staleCount)}
          hint="30 günden uzun süredir giriş yapmayanlar"
        />
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Filtreler</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Ad, e-posta, kimlik veya rol ile daralt.
            </p>
          </div>

          <form className="flex flex-col gap-2 md:flex-row">
            <input
              type="text"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Ad, e-posta veya kimlik ara"
              className="min-w-[260px] rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-700"
            />

            <select
              name="role"
              defaultValue={roleFilter}
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition focus:border-zinc-700"
            >
              <option value="all">Tüm roller</option>
              <option value="admin">Admin</option>
              <option value="user">Standart</option>
            </select>

            <button
              type="submit"
              className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              Uygula
            </button>

            <Link
              href="/admin/users"
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
            >
              Sıfırla
            </Link>
          </form>
        </div>
      </section>

      <section className="space-y-3">
        {userRows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/40 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-500">
              <UsersIcon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-medium text-white">Kullanıcı bulunamadı</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Mevcut filtrelerle eşleşen kullanıcı kaydı görünmüyor.
            </p>
          </div>
        ) : (
          userRows.map((userRow) => {
            const lastSeenDays = daysSince(userRow.lastSignedIn);

            return (
              <article
                key={userRow.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3"
              >
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-white">
                        {userRow.name?.trim() || "İsimsiz kullanıcı"}
                      </h2>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs ${getRoleClassName(
                          userRow.role,
                        )}`}
                      >
                        {userRow.role === "admin" ? "Admin" : "Standart"}
                      </span>
                      {lastSeenDays !== null && lastSeenDays > 30 ? (
                        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
                          {lastSeenDays} gündür pasif
                        </span>
                      ) : (
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                          Yakın giriş
                        </span>
                      )}
                    </div>

                    <div className="grid gap-2 text-sm text-zinc-300 md:grid-cols-2 xl:grid-cols-5">
                      <div className="rounded-2xl border border-zinc-900 bg-black/30 px-3 py-2">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                          E-posta
                        </div>
                        <div className="mt-1 text-sm text-zinc-200">
                          {userRow.email?.trim() || "—"}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-zinc-900 bg-black/30 px-3 py-2">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                          OpenID
                        </div>
                        <div className="mt-1 font-mono text-sm text-zinc-200">
                          {shortenOpenId(userRow.openId)}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-zinc-900 bg-black/30 px-3 py-2">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                          Giriş yöntemi
                        </div>
                        <div className="mt-1 text-sm text-zinc-200">
                          {userRow.loginMethod?.trim() || "—"}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-zinc-900 bg-black/30 px-3 py-2">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                          Son giriş
                        </div>
                        <div className="mt-1 text-sm text-zinc-200">
                          {formatDateTime(userRow.lastSignedIn)}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-zinc-900 bg-black/30 px-3 py-2">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                          Oluşturulma
                        </div>
                        <div className="mt-1 text-sm text-zinc-200">
                          {formatDateTime(userRow.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 xl:w-[220px] xl:min-w-[220px] xl:flex-col xl:items-stretch">
                    <form action={updateUserRole}>
                      <input type="hidden" name="id" value={userRow.id} />
                      <input type="hidden" name="role" value="admin" />
                      <input type="hidden" name="returnQ" value={query} />
                      <input type="hidden" name="returnRole" value={roleFilter} />
                      <button
                        type="submit"
                        disabled={userRow.role === "admin"}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-2.5 text-sm font-medium text-sky-200 transition hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Admin yap
                      </button>
                    </form>

                    <form action={updateUserRole}>
                      <input type="hidden" name="id" value={userRow.id} />
                      <input type="hidden" name="role" value="user" />
                      <input type="hidden" name="returnQ" value={query} />
                      <input type="hidden" name="returnRole" value={roleFilter} />
                      <button
                        type="submit"
                        disabled={userRow.role === "user"}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-black px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <UserCog className="h-4 w-4" />
                        Standart yap
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
        <div className="flex items-start gap-3">
          {auditRuntime.closureState === "ready" ? (
            <ShieldCheck className="mt-0.5 h-5 w-5 text-zinc-300" />
          ) : (
            <ShieldAlert className="mt-0.5 h-5 w-5 text-zinc-300" />
          )}
          <div>
            <h2 className="text-sm font-semibold text-white">Kapsam sınırı</h2>
            <p className="mt-1 max-w-4xl text-sm leading-6 text-zinc-400">
              Bu ekran mevcut kullanıcı kayıtları ve rol alanıyla sınırlıdır. Yeni
              yetki tablosu, giriş akışı veya kullanıcı oluşturma akışı eklenmedi.
              Audit aktörü doğrulanmadıysa rol değişimi izlenebilirlik açısından eksik
              kabul edilir.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
