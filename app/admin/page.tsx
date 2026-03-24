import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  Boxes,
  FileText,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { StatCard } from "./_components/stat-card";

const metrics = [
  { label: "Modeller", value: "-", hint: "Hazırlanıyor" },
  { label: "Paketler", value: "-", hint: "Hazırlanıyor" },
  { label: "Ürünler", value: "-", hint: "Hazırlanıyor" },
  { label: "Kurallar", value: "-", hint: "Hazırlanıyor" },
  { label: "İçerikler", value: "-", hint: "Hazırlanıyor" },
  { label: "Medya", value: "-", hint: "Hazırlanıyor" },
  { label: "Lead'ler", value: "-", hint: "Hazırlanıyor" },
];

const quickLinks = [
  {
    title: "Modeller",
    description: "Şasi ve platform bilgisini yönet",
    href: "/admin/models",
    icon: Truck,
  },
  {
    title: "Paketler",
    description: "Tier ve default donanım setlerini yönet",
    href: "/admin/packages",
    icon: Boxes,
  },
  {
    title: "Ürünler",
    description: "Katalog ve temel mühendislik alanları",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "Kurallar",
    description: "Uyumluluk ve blokaj mantığını kontrol et",
    href: "/admin/rules",
    icon: BrainCircuit,
  },
  {
    title: "İçerik",
    description: "Sayfa, blog ve medya yönetimi",
    href: "/admin/pages",
    icon: FileText,
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin core stabilization
          </div>

          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Yönetilebilir ve stabil admin omurgası
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/58 md:text-base">
            Bu ekran şu anda güvenli statik modda çalışıyor. Önce admin açılışı
            sabitleniyor, sonra veri katmanı kontrollü şekilde geri bağlanacak.
          </p>
        </div>
      </section>

      <section>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <StatCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              hint={metric.hint}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
          <h3 className="text-lg font-semibold tracking-tight text-white">
            Öncelikli operasyon alanları
          </h3>

          <div className="mt-5 grid gap-3">
            {quickLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:bg-white/[0.06]"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-2.5">
                      <Icon className="h-5 w-5 text-white/85" />
                    </div>

                    <div>
                      <div className="text-sm font-medium text-white">
                        {item.title}
                      </div>
                      <div className="mt-1 text-sm text-white/50">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  <ArrowRight className="h-4 w-4 text-white/40 transition group-hover:translate-x-0.5 group-hover:text-white" />
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
          <h3 className="text-lg font-semibold tracking-tight text-white">
            Bu aşamadaki hedef
          </h3>

          <div className="mt-5 space-y-3 text-sm text-white/60">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              Önce /admin sayfası hatasız açılsın.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              Sonra veri bağlantıları modül modül geri eklensin.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              Admin shell ve navigasyon sabit kalsın.
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              Sonraki adım models modülünü üretim standardına geçirmek olacak.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}