import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  LogOut,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { getAdminBootstrapState } from "@/app/lib/auth/bootstrap";
import { getAdminAccessState, getCurrentAuthState } from "@/app/lib/auth/server";
import {
  buildAccessRedirectUrl,
  getAccessRuntime,
  normalizeAccessReturnPath,
} from "@/app/lib/auth/access";
import { getSkyvanSessionRuntime } from "@/app/lib/auth/session";
import { claimInitialAdmin, signInWithAccess, signOutFromAccess } from "./actions";

type AccessPageSearchParams = Promise<{
  code?: string;
  email?: string;
  name?: string;
  next?: string;
}>;

type NoticeTone = "success" | "error" | "info" | "warning";

function getMessage(code: string | undefined) {
  switch (code) {
    case "runtime-blocked":
      return {
        tone: "error" as const,
        title: "Access runtime eksik",
        message:
          "Access runtime eksik. Gerekli env yapılandırması tamamlanmadan giriş açılamaz.",
      };
    case "session-runtime-blocked":
      return {
        tone: "error" as const,
        title: "Session üretilemedi",
        message:
          "Session secret eksik olduğu için güvenli oturum üretilemedi.",
      };
    case "db-unavailable":
      return {
        tone: "error" as const,
        title: "Veritabanı doğrulaması kapalı",
        message:
          "Veritabanı doğrulaması yapılamadığı için giriş fail-closed kaldı.",
      };
    case "missing-key":
      return {
        tone: "error" as const,
        title: "Access key gerekli",
        message: "Access key zorunludur.",
      };
    case "invalid-key":
      return {
        tone: "error" as const,
        title: "Access key reddedildi",
        message: "Access key doğrulanamadı.",
      };
    case "invalid-email":
      return {
        tone: "error" as const,
        title: "E-posta geçersiz",
        message: "Geçerli bir e-posta adresi girilmelidir.",
      };
    case "invalid-name":
      return {
        tone: "error" as const,
        title: "Ad alanı geçersiz",
        message: "Ad alanı boş bırakılabilir veya 2 ile 80 karakter arasında olmalıdır.",
      };
    case "creation-disabled":
      return {
        tone: "error" as const,
        title: "Kullanıcı kaydı bulunamadı",
        message: "Bu e-posta için mevcut users kaydı bulunamadı.",
      };
    case "not-allowlisted":
      return {
        tone: "error" as const,
        title: "Provisioning reddedildi",
        message:
          "Bu e-posta kontrollü provisioning allowlist içinde olmadığı için giriş reddedildi.",
      };
    case "identity-ambiguous":
      return {
        tone: "error" as const,
        title: "Kimlik eşleşmesi belirsiz",
        message:
          "Bu e-posta birden fazla kullanıcıyla eşleşti. Giriş güvenlik nedeniyle durduruldu.",
      };
    case "identity-conflict":
      return {
        tone: "error" as const,
        title: "Kimlik çakışması",
        message:
          "Bu e-posta başka bir derived identity ile çakışıyor. Giriş güvenlik nedeniyle durduruldu.",
      };
    case "user-update-failed":
      return {
        tone: "error" as const,
        title: "Kullanıcı güncellenemedi",
        message: "Mevcut kullanıcı kaydı güncellenemedi. Session oluşturulmadı.",
      };
    case "user-create-failed":
      return {
        tone: "error" as const,
        title: "Kullanıcı oluşturulamadı",
        message: "Yeni kullanıcı oluşturulamadı. Session kurulmadı.",
      };
    case "sign-in-failed":
      return {
        tone: "error" as const,
        title: "Giriş tamamlanamadı",
        message:
          "Giriş tamamlanamadı. Access runtime, users eşleşmesi ve session üretimi güvenlik nedeniyle fail-closed kontrol edildi.",
      };
    case "signed-in-admin":
      return {
        tone: "success" as const,
        title: "Admin oturumu açık",
        message: "Admin rolü doğrulandı. Admin Core alanına devam edebilirsiniz.",
      };
    case "signed-in-created":
      return {
        tone: "warning" as const,
        title: "Session açıldı, admin değil",
        message:
          "Kontrollü provisioning ile kullanıcı kimliği oluşturuldu. Admin erişimi için role=admin doğrulaması ayrıca gerekir.",
      };
    case "signed-in-user":
      return {
        tone: "info" as const,
        title: "Session açıldı",
        message:
          "Session açıldı. Ancak bu kullanıcı şu an admin değil; admin alanı kilitli kalır.",
      };
    case "signed-out":
      return {
        tone: "info" as const,
        title: "Session kapatıldı",
        message: "Session kapatıldı.",
      };
    case "bootstrap-auth-required":
      return {
        tone: "error" as const,
        title: "Session gerekli",
        message: "Ownership claim yalnızca authenticated kullanıcı oturumu ile yapılabilir.",
      };
    case "bootstrap-runtime-blocked":
      return {
        tone: "error" as const,
        title: "Bootstrap runtime eksik",
        message:
          "Bootstrap runtime yapılandırması eksik. İlk admin claim fail-closed kaldı.",
      };
    case "bootstrap-secret-required":
      return {
        tone: "error" as const,
        title: "Bootstrap secret gerekli",
        message: "Bootstrap secret zorunludur.",
      };
    case "bootstrap-secret-invalid":
      return {
        tone: "error" as const,
        title: "Bootstrap secret reddedildi",
        message: "Bootstrap secret doğrulanamadı.",
      };
    case "bootstrap-closed":
      return {
        tone: "error" as const,
        title: "Bootstrap kapalı",
        message:
          "Bootstrap ownership gate kapalı. Sistemde zaten admin bulunduğu için yeni ilk-claim kabul edilmez.",
      };
    case "bootstrap-user-missing":
      return {
        tone: "error" as const,
        title: "Session kullanıcısı bulunamadı",
        message: "Session ile çözümlenen kullanıcı users tablosunda bulunamadı.",
      };
    case "bootstrap-claim-failed":
      return {
        tone: "error" as const,
        title: "Ownership claim tamamlanamadı",
        message: "İlk admin ownership claim işlemi tamamlanamadı.",
      };
    default:
      return null;
  }
}

function toneClasses(tone: NoticeTone) {
  if (tone === "success") {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";
  }

  if (tone === "warning") {
    return "border-amber-400/25 bg-amber-400/10 text-amber-200";
  }

  if (tone === "error") {
    return "border-rose-400/25 bg-rose-400/10 text-rose-200";
  }

  return "border-white/15 bg-white/[0.07] text-zinc-200";
}

function stateTone(ok: boolean, waiting = false) {
  if (ok) {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";
  }

  if (waiting) {
    return "border-amber-400/25 bg-amber-400/10 text-amber-200";
  }

  return "border-rose-400/25 bg-rose-400/10 text-rose-200";
}

function StatePanel({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  return (
    <div className={`rounded-[1.25rem] border p-4 ${tone}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-70">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
      <p className="mt-2 text-sm leading-6 opacity-85">{detail}</p>
    </div>
  );
}

export default async function AccessPage({
  searchParams,
}: {
  searchParams: AccessPageSearchParams;
}) {
  const params = await searchParams;
  const runtime = getAccessRuntime();
  const sessionRuntime = getSkyvanSessionRuntime();
  const auth = await getCurrentAuthState();
  const admin = await getAdminAccessState();
  const bootstrap = await getAdminBootstrapState({
    currentUserId: auth.user?.id ?? null,
    currentUserRole: auth.user?.role ?? null,
  });
  const notice = getMessage(params.code);
  const next = normalizeAccessReturnPath(params.next);
  const emailDefault = String(params.email ?? "").trim();
  const nameDefault = String(params.name ?? "").trim();

  return (
    <main className="admin-shell min-h-screen overflow-x-clip bg-[var(--admin-bg)] text-[var(--admin-text)]">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_50%_-12%,rgba(255,255,255,0.16),transparent_34rem)]" />
      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-4 py-6 md:px-8 lg:grid-cols-[minmax(0,0.98fr)_minmax(360px,0.72fr)] lg:items-center lg:py-10">
        <section className="min-w-0">
          <div className="rounded-[2rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_30px_120px_rgba(0,0,0,0.32)] md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[var(--admin-muted)]">
                  Skyvan
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--admin-text)] md:text-5xl">
                  Admin Gateway
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--admin-muted)] md:text-base">
                  Controlled access, signed session ve admin role doğrulaması tek güvenlik sınırında toplanır.
                  Bu ekran public pazarlama yüzeyi değildir; Admin Core giriş kapısıdır.
                </p>
              </div>

              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium ${
                  runtime.configured
                    ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                    : "border-rose-400/25 bg-rose-400/10 text-rose-200"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    runtime.configured ? "bg-emerald-300" : "bg-rose-300"
                  }`}
                />
                {runtime.configured ? "Access runtime aktif" : "Access runtime blocker"}
              </div>
            </div>

            {notice ? (
              <div className={`mt-6 rounded-[1.35rem] border p-4 ${toneClasses(notice.tone)}`}>
                <div className="flex gap-3">
                  {notice.tone === "error" ? (
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-semibold">{notice.title}</p>
                    <p className="mt-1 text-sm leading-6 opacity-85">{notice.message}</p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-7 rounded-[1.6rem] border border-[var(--admin-border)] bg-black/25 p-4 md:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-raised)] text-[var(--admin-text)]">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--admin-text)]">
                    {auth.isAuthenticated ? "Session state" : "Controlled sign in"}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--admin-muted)]">
                    Source of truth server-side users/session/role çözümüdür.
                  </p>
                </div>
              </div>

              {!auth.isAuthenticated ? (
                <form action={signInWithAccess} className="mt-6 grid gap-4">
                  <input type="hidden" name="next" value={next} />

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-[var(--admin-text)]">E-posta</span>
                    <input
                      type="email"
                      name="email"
                      defaultValue={emailDefault}
                      autoComplete="email"
                      required
                      className="w-full rounded-2xl border border-[var(--admin-border)] bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[var(--admin-border-strong)]"
                      placeholder="ornek@skyvan.local"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-[var(--admin-text)]">Ad soyad</span>
                    <input
                      type="text"
                      name="name"
                      defaultValue={nameDefault}
                      autoComplete="name"
                      className="w-full rounded-2xl border border-[var(--admin-border)] bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[var(--admin-border-strong)]"
                      placeholder="İsteğe bağlı"
                    />
                  </label>

                  <label className="grid gap-2">
                    <span className="text-sm font-medium text-[var(--admin-text)]">Access key</span>
                    <input
                      type="password"
                      name="accessKey"
                      autoComplete="current-password"
                      required
                      className="w-full rounded-2xl border border-[var(--admin-border)] bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[var(--admin-border-strong)]"
                      placeholder="Deployment access key"
                    />
                  </label>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
                  >
                    Session aç
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <div className="mt-6 grid gap-4">
                  <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-200">
                    <p className="font-semibold">Session aktif</p>
                    <p className="mt-1 leading-6 opacity-85">
                      {auth.user?.email?.trim() || auth.user?.name?.trim() || auth.openIdPreview}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {admin.allowed ? (
                      <Link
                        href={next}
                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
                      >
                        Admin&apos;e devam et
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
                        Session aktif ama admin rolü doğrulanmadı.
                      </div>
                    )}

                    <form action={signOutFromAccess}>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-2xl border border-[var(--admin-border)] bg-black px-5 py-3 text-sm text-zinc-300 transition hover:border-[var(--admin-border-strong)] hover:text-white"
                      >
                        <LogOut className="h-4 w-4" />
                        Session kapat
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>

            {bootstrap.isOpen || bootstrap.canClaim || !bootstrap.configured ? (
              <div
                className={`mt-5 rounded-[1.35rem] border p-4 ${
                  bootstrap.canClaim
                    ? "border-amber-400/25 bg-amber-400/10 text-amber-200"
                    : bootstrap.isOpen
                      ? "border-white/15 bg-white/[0.07] text-zinc-200"
                      : "border-rose-400/25 bg-rose-400/10 text-rose-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Ownership bootstrap</p>
                    <p className="mt-1 text-sm leading-6 opacity-85">{bootstrap.reason}</p>

                    {bootstrap.canClaim ? (
                      <form action={claimInitialAdmin} className="mt-4 grid gap-3">
                        <input type="hidden" name="next" value={next} />
                        <input
                          type="password"
                          name="bootstrapSecret"
                          autoComplete="current-password"
                          required
                          className="w-full rounded-2xl border border-[var(--admin-border)] bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[var(--admin-border-strong)]"
                          placeholder="İlk admin claim secret"
                        />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
                        >
                          İlk admin ownership claim
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <aside className="grid min-w-0 gap-4">
          <div className="rounded-[2rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 md:p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[var(--admin-text)]" />
              <h2 className="text-lg font-semibold">Runtime & governance</h2>
            </div>

            <div className="mt-5 grid gap-3">
              <StatePanel
                label="Access runtime"
                value={runtime.configured ? "Aktif" : "Blocker"}
                detail={runtime.reason}
                tone={stateTone(runtime.configured)}
              />
              <StatePanel
                label="Session runtime"
                value={sessionRuntime.configured ? "Aktif" : "Blocker"}
                detail={sessionRuntime.reason}
                tone={stateTone(sessionRuntime.configured)}
              />
              <StatePanel
                label="Session state"
                value={auth.isAuthenticated ? "Authenticated" : "Kilitli"}
                detail={auth.reason}
                tone={stateTone(auth.isAuthenticated, auth.status === "session_missing")}
              />
              <StatePanel
                label="Admin role"
                value={admin.allowed ? "Admin açık" : "Fail-closed"}
                detail={admin.reason}
                tone={stateTone(admin.allowed, auth.isAuthenticated)}
              />
              {bootstrap.isOpen || !bootstrap.configured ? (
                <StatePanel
                  label="Bootstrap"
                  value={
                    !bootstrap.configured
                      ? "Blocker"
                      : bootstrap.canClaim
                        ? "Claim açık"
                        : "Session bekliyor"
                  }
                  detail={`${bootstrap.adminCount} admin kayıtlı. ${bootstrap.reason}`}
                  tone={stateTone(bootstrap.canClaim, bootstrap.isOpen)}
                />
              ) : null}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5 md:p-6">
            <div className="flex items-center gap-3">
              <LockKeyhole className="h-5 w-5 text-[var(--admin-text)]" />
              <h2 className="text-lg font-semibold">Security boundary</h2>
            </div>
            <div className="mt-5 space-y-3 text-sm leading-6 text-[var(--admin-muted)]">
              <p>Access key doğrulanmadan session üretilemez.</p>
              <p>Session cookie server-side imzalanır; client-only karar yoktur.</p>
              <p>Admin alanı yalnızca `users.role = admin` olduğunda açılır.</p>
              <p>Bootstrap claim açık signup değildir; explicit secret ve authenticated user gerekir.</p>
              <p>Secret değerleri ve DATABASE_URL bu ekranda gösterilmez.</p>
            </div>

            <Link
              href={buildAccessRedirectUrl({ next: "/admin" })}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-[var(--admin-border)] bg-black px-4 py-2.5 text-sm text-zinc-300 transition hover:border-[var(--admin-border-strong)] hover:text-white"
            >
              Admin erişimine dön
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
