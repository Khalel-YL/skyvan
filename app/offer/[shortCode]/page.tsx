import { getDbOrThrow } from "@/db/db";
import {
  builds,
  buildSelectedProducts,
  buildVersions,
  models,
  products,
} from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Truck, Zap, Box, BrainCircuit, CheckCircle2, FileText, ArrowLeft, Printer, Hammer } from "lucide-react";
import Link from "next/link";

export default async function OfferPage({ params }: { params: { shortCode: string } }) {
  const db = getDbOrThrow();

  const buildRows = await db
    .select({
      id: builds.id,
      shortCode: builds.shortCode,
      modelName: models.slug,
    })
    .from(builds)
    .innerJoin(models, eq(builds.modelId, models.id))
    .where(eq(builds.shortCode, params.shortCode))
    .limit(1);

  const build = buildRows[0];

  if (!build) {
    return notFound();
  }

  const versionRows = await db
    .select({
      id: buildVersions.id,
      totalWeightKg: buildVersions.totalWeightKg,
      totalPrice: buildVersions.totalPrice,
    })
    .from(buildVersions)
    .where(eq(buildVersions.buildId, build.id))
    .orderBy(desc(buildVersions.createdAt))
    .limit(1);

  const version = versionRows[0];

  if (!version) {
    return notFound();
  }

  const selectedProductRows = await db
    .select({
      quantity: buildSelectedProducts.quantity,
      productSku: products.sku,
      productTitle: products.name,
      productName: products.name,
      productBasePrice: products.basePrice,
    })
    .from(buildSelectedProducts)
    .innerJoin(products, eq(buildSelectedProducts.productId, products.id))
    .where(eq(buildSelectedProducts.buildVersionId, version.id));

  const vehicle = {
    name: build.modelName,
  };

  const selectedProducts = selectedProductRows.map((item) => ({
    quantity: item.quantity,
    product: {
      sku: item.productSku,
      title: item.productTitle,
      name: item.productName,
      basePrice: item.productBasePrice,
    },
  }));

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-16 font-sans">
      
      {/* ÜST BAR */}
      <div className="max-w-5xl mx-auto mb-10 flex justify-between items-center print:hidden">
        <Link href="/workshop" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-all">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Atölyeye Dön</span>
        </Link>
        <button onClick={() => window.print()} className="bg-zinc-900 border border-zinc-800 px-6 py-3 rounded-2xl flex items-center gap-3 hover:bg-zinc-800 transition-all">
            <Printer className="h-4 w-4 text-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest">PDF Kaydet</span>
        </button>
      </div>

      <main className="max-w-5xl mx-auto bg-zinc-950 border border-zinc-900 rounded-[3rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
        
        {/* HEADER */}
        <div className="p-12 md:p-20 border-b border-zinc-900 bg-gradient-to-br from-zinc-900/50 to-transparent flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-5">
                <div className="p-4 bg-blue-600 rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.3)]"><Hammer className="h-8 w-8 text-white" /></div>
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">SkyVan <span className="text-blue-500 font-mono">Atölye</span></h1>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] block mt-1">Teknik Konfigürasyon</span>
                </div>
            </div>
            <div className="text-right">
                <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-[2rem]">
                    <span className="block text-[9px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Referans</span>
                    <span className="text-4xl font-mono font-bold text-white tracking-tighter italic">{build.shortCode}</span>
                </div>
            </div>
        </div>

        {/* ÖZET PANELİ */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-zinc-900">
            <div className="p-10 border-r border-zinc-900 flex items-center gap-6">
                <Truck className="h-10 w-10 text-blue-500 opacity-40" />
                <div>
                    <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Platform</span>
                    <span className="text-sm font-bold text-zinc-100 uppercase">{vehicle?.name}</span>
                </div>
            </div>
            <div className="p-10 flex items-center gap-6">
                <Box className="h-10 w-10 text-amber-500 opacity-40" />
                <div>
                    <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Hesaplanan Kütle</span>
                    <span className="text-sm font-bold text-zinc-100 font-mono">{version.totalWeightKg} KG</span>
                </div>
            </div>
        </div>

        {/* ÜRÜN LİSTESİ */}
        <div className="p-12 md:p-20">
            <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.4em] mb-12 flex items-center gap-3">
                <FileText className="h-4 w-4 text-blue-500" /> Donanım Kalemleri
            </h2>
            
            <div className="space-y-4">
                {selectedProducts.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-6 bg-zinc-900/30 rounded-2xl border border-zinc-900 hover:border-zinc-800 transition-all">
                        <div className="flex items-center gap-8">
                            <span className="text-xs font-mono text-zinc-700 w-6">{(idx + 1).toString().padStart(2, '0')}</span>
                            <div>
                                <span className="block text-[9px] text-blue-500 font-bold uppercase mb-1">{item.product.sku}</span>
                                <span className="text-base font-bold text-zinc-200">{item.product.title || item.product.name}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block text-[9px] text-zinc-600 font-bold uppercase mb-1">Miktar</span>
                            <span className="text-base font-mono font-bold text-zinc-100">x{item.quantity}</span>
                        </div>
                        <div className="w-32 text-right">
                            <span className="block text-[9px] text-zinc-600 font-bold uppercase mb-1">Tutar</span>
                            <span className="text-base font-mono font-bold text-white">{(Number(item.product.basePrice) * item.quantity).toLocaleString('tr-TR')} ₺</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* TOTAL */}
            <div className="mt-20 flex flex-col md:flex-row justify-between items-center bg-zinc-900 p-10 rounded-[3rem] border border-zinc-800 shadow-inner">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-500">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Mühendislik Onayı Verildi</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 max-w-xs leading-relaxed">Bu belge dijital atölye çıktısıdır ve donanım uyumluluğu SkyVan AI tarafından denetlenmiştir.</p>
                </div>
                <div className="text-right">
                    <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-[0.4em] mb-3">Toplam Yatırım Bedeli</span>
                    <span className="text-5xl font-mono font-bold text-white tracking-tighter">
                        {Number(version.totalPrice).toLocaleString('tr-TR')} <span className="text-xl text-zinc-600 ml-1 font-sans">₺</span>
                    </span>
                </div>
            </div>
        </div>

      </main>
    </div>
  );
}
