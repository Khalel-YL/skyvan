import Link from "next/link";
import { ArrowRight, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";

import { getAdminBootstrapState } from "@/app/lib/auth/bootstrap";
import { getAdminAccessState, getCurrentAuthState } from "@/app/lib/auth/server";
import {
  buildAccessRedirectUrl,
  getAccessRuntime,
  normalizeAccessReturnPath,
} from "@/app/lib/auth/access";
import { claimInitialAdmin, signInWithAccess, signOutFromAccess } from "./actions";

type AccessPageSearchParams = Promise<{
  code?: string;
  email?: string;
  name?: string;
  next?: string;
}>;

function getMessage(code: string | undefined) {
  switch (code) {
    case "runtime-blocked":
      return {
        tone: "error" as const,
        message:
          "Controlled access runtime yapılandırması eksik. Identity & Access Core fail-closed çalışıyor.",
      };
    case "missing-key":
      return {
        tone: "error" as const,
        message: "Access key zorunludur.",
      };
    case "invalid-key":
      return {
        tone: "error" as const,
        message: "Access key doğrulanamadı.",
      };
    case "invalid-email":
      return {
        tone: "error" as const,
        message: "Geçerli bir e-posta adresi girilmelidir.",
      };
    case "invalid-name":
      return {
        tone: "error" as const,
        message: "Ad alanı boş bırakılabilir veya 2 ile 80 karakter arasında olmalıdır.",
      };
    case "creation-disabled":
      return {
        tone: "error" as const,
        message:
          "Kontrollü provisioning kapalı. Bu e-posta için önce users kaydı açılmalıdır.",
      };
    case "not-allowlisted":
      return {
        tone: "error" as const,
        message:
          "Bu e-posta kontrollü provisioning allowlist içinde olmadığı için giriş reddedildi.",
      };
    case "identity-ambiguous":
      return {
        tone: "error" as const,
        message:
          "Bu e-posta birden fazla users kaydıyla eşleşti. Controlled access entry fail-closed durduruldu.",
      };
    case "identity-conflict":
      return {
        tone: "error" as const,
        message:
          "Derived identity mevcut veriyle çakıştı. Controlled access entry fail-closed durduruldu.",
      };
    case "user-update-failed":
      return {
        tone: "error" as const,
        message: "Mevcut kullanıcı kaydı güncellenemedi.",
      };
    case "user-create-failed":
      return {
        tone: "error" as const,
        message: "Yeni kullanıcı oluşturulamadı.",
      };
    case "sign-in-failed":
      return {
        tone: "error" as const,
        message: "Giriş sırasında beklenmeyen bir hata oluştu.",
      };
    case "signed-in-created":
      return {
        tone: "success" as const,
        message:
          "Kontrollü provisioning ile kullanıcı kimliği oluşturuldu ve session açıldı. Admin rolü ayrıca server-side doğrulanır.",
      };
    case "signed-in-user":
      return {
        tone: "info" as const,
        message:
          "Session açıldı. Ancak bu kullanıcı şu an admin değil; admin alanı kilitli kalır.",
      };
    case "signed-out":
      return {
        tone: "info" as const,
        message: "Session kapatıldı.",
      };
    case "bootstrap-auth-required":
      return {
        tone: "error" as const,
        message:
          "Ownership claim yalnızca authenticated kullanıcı oturumu ile yapılabilir.",
      };
    case "bootstrap-runtime-blocked":
      return {
        tone: "error" as const,
        message:
          "Bootstrap runtime yapılandırması eksik. İlk admin claim fail-closed kaldı.",
      };
    case "bootstrap-secret-required":
      return {
        tone: "error" as const,
        message: "Bootstrap secret zorunludur.",
      };
    case "bootstrap-secret-invalid":
      return {
        tone: "error" as const,
        message: "Bootstrap secret doğrulanamadı.",
      };
    case "bootstrap-closed":
      return {
        tone: "error" as const,
        message:
          "Bootstrap ownership gate kapalı. Sistemde zaten admin bulunduğu için yeni ilk-claim kabul edilmez.",
      };
    case "bootstrap-user-missing":
      return {
        tone: "error" as const,
        message:
          "Session ile çözümlenen kullanıcı users tablosunda bulunamadı.",
      };
    case "bootstrap-claim-failed":
      return {
        tone: "error" as const,
        message: "İlk admin ownership claim işlemi tamamlanamadı.",
      };
    default:
      return null;
  }
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

export default async function AccessPage({
  searchParams,
}: {
  searchParams: AccessPageSearchParams;
}) {
  const params = await searchParams;
  const runtime = getAccessRuntime();
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
    <div className="space-y-6">
      <section className="rounded-[32px] border border-zinc-800 bg-zinc-950/70 p-8 text-white">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
              Controlled Access Entry
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              Interim kontrollü giriş katmanı
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400">
              Bu ekran yeni bir auth framework kurmaz. Mevcut `users` tablosu,
              server-side identity çözümü ve signed session cookie üstünden
              sisteme kontrollü giriş açar. Bu model bugün kullanılabilir ama
              nihai kimlik mimarisi değildir. Ownership bootstrap açıksa ilk
              admin claim de burada explicit secret ve mevcut session ile
              yürütülür; admin yetkisi yine ayrıca role alanında doğrulanır.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-black/30 px-4 py-3 text-sm text-zinc-300">
            {runtime.configured ? "Interim access aktif" : "Interim access blokeli"}
          </div>
        </div>
      </section>

      {notice ? (
        <section className={`rounded-3xl border p-5 text-sm ${noticeClassName(notice.tone)}`}>
          {notice.message}
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-6">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-zinc-300" />
            <h2 className="text-lg font-semibold text-white">Giriş akışı</h2>
          </div>

          <div className="mt-5 space-y-4 text-sm leading-6 text-zinc-400">
            <p>
              Sistem önce access key&apos;i doğrular, sonra e-posta üstünden gerçek
              users kaydını çözer. Kayıt yoksa yalnızca allowlist açıksa yeni
              kullanıcı oluşturur.
            </p>
            <p>
              Session yalnızca doğrulanmış kullanıcı için üretilir. `role=admin`
              değilse admin alanı açılmaz.
            </p>
            <p>
              Bu katman açık signup değildir. Allowlist tabanlı kullanıcı
              oluşturma yalnızca kontrollü provisioning amacıyla vardır.
            </p>
            <p>
              İlk admin ownership claim yalnızca bootstrap gate açıksa, mevcut
              authenticated session varsa ve bootstrap secret doğrulanırsa yapılır.
            </p>
          </div>

          {!auth.isAuthenticated ? (
            <form action={signInWithAccess} className="mt-6 space-y-4">
              <input type="hidden" name="next" value={next} />

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  E-posta
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={emailDefault}
                  autoComplete="email"
                  required
                  className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-700"
                  placeholder="ornek@skyvan.local"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Ad soyad
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={nameDefault}
                  autoComplete="name"
                  className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-700"
                  placeholder="İsteğe bağlı"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white">
                  Access key
                </label>
                <input
                  type="password"
                  name="accessKey"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-700"
                  placeholder="Deployment access key"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
              >
                Session aç
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                Session aktif. Mevcut kullanıcı:{" "}
                <span className="font-medium">
                  {auth.user?.email?.trim() || auth.user?.name?.trim() || auth.openIdPreview}
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                {admin.allowed ? (
                  <Link
                    href={next}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
                  >
                    Admin&apos;e devam et
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                    Session aktif ama admin rolü doğrulanmadı.
                  </div>
                )}

                <form action={signOutFromAccess}>
                  <button
                    type="submit"
                    className="rounded-2xl border border-zinc-800 bg-black px-5 py-3 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
                  >
                    Session kapat
                  </button>
                </form>
              </div>

              <div
                className={`rounded-2xl border p-4 ${
                  bootstrap.canClaim
                    ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
                    : bootstrap.isOpen
                      ? "border-sky-500/20 bg-sky-500/10 text-sky-200"
                      : "border-zinc-800 bg-black/30 text-zinc-300"
                }`}
              >
                <div className="text-sm font-medium">Ownership bootstrap</div>
                <div className="mt-2 text-sm leading-6 opacity-90">
                  {bootstrap.reason}
                </div>

                {bootstrap.canClaim ? (
                  <form action={claimInitialAdmin} className="mt-4 space-y-3">
                    <input type="hidden" name="next" value={next} />

                    <div>
                      <label className="mb-2 block text-sm font-medium text-white">
                        Bootstrap secret
                      </label>
                      <input
                        type="password"
                        name="bootstrapSecret"
                        autoComplete="current-password"
                        required
                        className="w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-zinc-700"
                        placeholder="İlk admin claim secret"
                      />
                    </div>

                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
                    >
                      İlk admin ownership claim
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-zinc-300" />
              <h2 className="text-lg font-semibold text-white">Runtime</h2>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  Interim access runtime
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {runtime.configured ? "Aktif" : "Blocker"}
                </div>
                <div className="mt-2 text-sm leading-6 text-zinc-400">
                  {runtime.reason}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  Controlled provisioning
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {runtime.allowlistEnabled ? "Allowlist açık" : "Kapalı"}
                </div>
                <div className="mt-2 text-sm leading-6 text-zinc-400">
                  {runtime.allowlistEnabled
                    ? `${runtime.allowlistedEmails.length} e-posta kontrollü provisioning ile kullanıcı oluşturabilir.`
                    : "Kontrollü provisioning kapalı. Sadece mevcut users kayıtları giriş yapabilir."}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                  Session / Admin
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {admin.allowed ? "Admin açık" : auth.isAuthenticated ? "Session açık" : "Kilitli"}
                </div>
                <div className="mt-2 text-sm leading-6 text-zinc-400">
                  {admin.reason}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-black/30 p-4">
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
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-6">
            <div className="flex items-center gap-3">
              <LockKeyhole className="h-5 w-5 text-zinc-300" />
              <h2 className="text-lg font-semibold text-white">Güvenlik sınırı</h2>
            </div>

            <div className="mt-5 space-y-3 text-sm leading-6 text-zinc-400">
              <p>
                Bu batch ilk admin ownership claim yolunu açar. Ancak claim
                otomatik değildir; explicit bootstrap gate ve bootstrap secret gerekir.
              </p>
              <p>
                Admin erişimi yalnızca mevcut `users.role` değeri `admin`
                olduğunda açılır.
              </p>
              <p>
                Access key geçersizse, runtime eksikse veya users çözümü
                tutarsızsa sistem fail-closed davranır.
              </p>
              <p>
                İlk claim sonrası app içindeki role yönetimi son adminin
                düşürülmesini engeller; böylece bootstrap kapısı normal akışta tekrar açılmaz.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-zinc-300" />
              <h2 className="text-lg font-semibold text-white">Kimlik hijyeni notu</h2>
            </div>

            <div className="mt-5 space-y-3 text-sm leading-6 text-zinc-400">
              <p>
                `users.email` alanı unique değil. Bu nedenle aynı e-posta birden
                fazla kayıtta görünürse giriş fail-closed durdurulur.
              </p>
              <p>
                `email` değeri boş veya legacy kalan kullanıcılar bu access
                flow ile çözülemez; önce operasyonel olarak netleştirilmeleri gerekir.
              </p>
              <p>
                Legacy `openId` biçimleri desteklenir çünkü mevcut kullanıcı
                çözümü e-posta üstünden yapılır ve bulunan kaydın gerçek `openId`
                değeri kullanılır.
              </p>
            </div>

            <div className="mt-5">
              <Link
                href={buildAccessRedirectUrl({ next: "/admin" })}
                className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-black px-4 py-2.5 text-sm text-zinc-300 transition hover:border-zinc-700 hover:text-white"
              >
                Admin erişimine dön
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
