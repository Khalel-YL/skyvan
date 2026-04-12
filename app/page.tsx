import Link from "next/link";
import {
  ArrowRight,
  BatteryCharging,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const highlights = [
  "Konfigürasyon",
  "Teknik doğrulama",
  "Admin kontrol omurgası",
  "Üretim hazırlığı",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.04),transparent_24%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8 md:px-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-white/40">
              Skyvan
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-tight">
              Caravan Operating System
            </div>
          </div>

          <nav className="flex items-center gap-3">
            <Link
              href="/admin"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Admin
            </Link>
            <Link
              href="/workshop"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Workshop
            </Link>
          </nav>
        </header>

        <section className="flex flex-1 items-center py-16 md:py-24">
          <div className="grid w-full gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60">
                <Sparkles className="h-3.5 w-3.5" />
                AI destekli karavan mimarisi
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl">
                Mühendislik, seçim ve üretim kontrolü tek omurgada.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-white/60">
                Skyvan; araç seçimi, ürün kategorizasyonu, teknik doğrulama,
                admin onayı ve üretime geçiş akışını tek sistem altında toplar.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-90"
                >
                  Admin’e gir
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/offers"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  Teklif akışı
                </Link>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-6">
              <div className="text-xs uppercase tracking-[0.24em] text-white/35">
                Core signals
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <ShieldCheck className="h-4 w-4" />
                    Teknik uyumsuzluklar bloklanır
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/55">
                    Kural motoru, datasheet ve admin onayı aynı sistemde çalışır.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <BatteryCharging className="h-4 w-4" />
                    Enerji ve donanım kararları izlenebilir
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/55">
                    AI açıklama üretir; nihai teknik karar sistem ve admin
                    kontrolündedir.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {highlights.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/65"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
