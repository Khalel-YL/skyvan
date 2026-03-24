import { Search, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { db } from "@/db/db";
import { products, localizedContent, productSpecs } from "@/db/schema";
import { eq } from "drizzle-orm";
import AddProductDrawer from "./AddProductDrawer";
import { deleteProduct, togglePriceVisibility } from "./actions"; 
import Link from "next/link";

export default async function ProductsPage({ searchParams }: { searchParams: { edit?: string } }) {
  // 1. Tüm Ürünleri Çek
  const allProducts = await db
    .select({
      id: products.id,
      sku: products.sku,
      weightKg: products.weightKg,
      basePrice: products.basePrice,
      imageUrl: products.imageUrl,
      datasheetUrl: products.datasheetUrl,
      title: localizedContent.title,
      contentJson: localizedContent.contentJson, 
    })
    .from(products)
    .leftJoin(localizedContent, eq(products.id, localizedContent.entityId));

  // 2. Eğer URL'de '?edit=ID' varsa, o ürünün detaylarını ve teknik spesifikasyonlarını bul
// 2. Eğer URL'de '?edit=ID' varsa, o ürünün detaylarını ve teknik spesifikasyonlarını bul
  let editData: any = null;
  const params = await searchParams; // İŞTE YENİ KURALIMIZ BURADA

  if (params.edit) {
    const foundProduct = allProducts.find((p: any) => p.id === params.edit);
    
    if (foundProduct) {
      // O ürüne ait WATTS, AMPER gibi teknik özellikleri veritabanından çek
      const specs = await db.select().from(productSpecs).where(eq(productSpecs.productId, params.edit));
      editData = { ...foundProduct, specs }; // Drawer'a göndermek için birleştir
    }
  }

  return (
    <div className="p-8 animate-in fade-in duration-500 relative min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-light text-white">Katalog & <span className="font-semibold">Ürünler</span></h1>
        
        {/* Sihirli Dokunuş: Eğer editData doluysa Drawer Güncelleme modunda açılır */}
        <AddProductDrawer initialData={editData} />
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input type="text" placeholder="SKU veya Ürün Adı ara..." className="w-full bg-white/5 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors" />
        </div>
      </div>

      <div className="border border-zinc-800/50 rounded-2xl overflow-hidden bg-[#0a0a0a] shadow-2xl">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-[#050505] border-b border-zinc-800/50 text-zinc-300">
            <tr>
              <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px]">SKU</th>
              <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px]">Ürün Adı</th>
              <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px]">Ağırlık</th>
              <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px]">Fiyat Görünümü</th>
              <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px] text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {allProducts.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">Katalogda henüz bir mühendislik kalemi yok.</td></tr>
            )}

            {allProducts.map((product: any) => {
              const content = product.contentJson as { showPrice?: boolean } | null;
              const isPriceVisible = content?.showPrice !== false;

              return (
                <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs text-blue-400">{product.sku}</td>
                  <td className="px-6 py-4 text-white font-medium">{product.title || "İsimsiz Ürün"}</td>
                  <td className="px-6 py-4 font-mono text-zinc-300">{Number(product.weightKg).toFixed(1)} kg</td>
                  
                  <td className="px-6 py-4">
                    <form action={togglePriceVisibility.bind(null, product.id, isPriceVisible)} className="flex items-center gap-3 font-mono text-white">
                      <button type="submit" className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer z-10 relative">
                        {isPriceVisible ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-zinc-600" />}
                      </button>
                      <span className={`transition-all ${isPriceVisible ? "" : "text-zinc-600 line-through"}`}>
                         {Number(product.basePrice).toLocaleString("tr-TR")} ₺
                      </span>
                    </form>
                  </td>
                  
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                      
                      {/* EDİT BUTONU (Tıklayınca URL'ye ?edit=ID ekler) */}
                      <Link href={`/admin/products?edit=${product.id}`} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all" title="Düzenle">
                        <Edit className="h-4 w-4" />
                      </Link>
                      
                      {/* SİLME BUTONU (Silme motoruyla %100 çalışıyor) */}
                      <form action={deleteProduct.bind(null, product.id)}>
                        <button type="submit" className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer z-10 relative" title="Kalıcı Olarak Sil">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}