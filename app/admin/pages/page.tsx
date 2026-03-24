import { db } from "@/db/db";
import { localizedContent } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { Edit, Trash2, PanelTop, Search, Globe, Lock } from "lucide-react";
import AddPageDrawer from "./AddPageDrawer";
import { deletePage } from "./actions";
import Link from "next/link";

export default async function PagesCMS({ searchParams }: { searchParams: { edit?: string } }) {
  // Sadece "page" tipindeki içerikleri çekiyoruz (Ürünleri vs. karıştırmıyoruz)
  const allPages = await db.select()
    .from(localizedContent)
    .where(eq(localizedContent.entityType, "page"));

  let editData = null;
  if (searchParams.edit) {
    editData = allPages.find(p => p.id === searchParams.edit);
  }

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-screen">
      
      <div className="flex items-center justify-between mb-10">
        <div>
           <h1 className="text-2xl font-light text-white flex items-center gap-3">
             <PanelTop className="h-6 w-6 text-blue-500" /> Vitrin <span className="font-semibold">Sayfaları (CMS)</span>
           </h1>
           <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 font-bold">Kurumsal İçerik ve SEO Yönetimi</p>
        </div>
        <AddPageDrawer initialData={editData} />
      </div>

      <div className="border border-zinc-800/50 rounded-3xl overflow-hidden bg-[#0a0a0a] shadow-2xl">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-[#050505] border-b border-zinc-800/50 text-zinc-300">
            <tr>
              <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px]">Sayfa Başlığı</th>
              <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px]">URL (Slug)</th>
              <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px]">SEO Durumu</th>
              <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px]">Yayın</th>
              <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px] text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {allPages.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500 italic">Sitede henüz oluşturulmuş bir sayfa yok.</td></tr>
            )}

            {allPages.map((page: any) => {
              const content = page.contentJson || {};
              const hasSeo = !!content.metaDescription;

              return (
                <tr key={page.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 text-white font-bold">{page.title}</td>
                  <td className="px-6 py-4 font-mono text-xs text-blue-400">/{content.slug}</td>
                  
                  <td className="px-6 py-4">
                    {hasSeo ? (
                      <span className="flex items-center gap-2 text-[10px] font-bold uppercase text-green-500"><Search className="h-3 w-3" /> Optimize Edildi</span>
                    ) : (
                      <span className="flex items-center gap-2 text-[10px] font-bold uppercase text-amber-500">Eksik Meta Tag</span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4">
                    {content.isPublished ? (
                      <span className="p-2 bg-blue-500/10 text-blue-500 rounded-lg inline-flex" title="Yayında"><Globe className="h-4 w-4" /></span>
                    ) : (
                      <span className="p-2 bg-zinc-800 text-zinc-500 rounded-lg inline-flex" title="Taslak"><Lock className="h-4 w-4" /></span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                      <Link href={`/admin/pages?edit=${page.id}`} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
                        <Edit className="h-4 w-4" />
                      </Link>
                      <form action={deletePage.bind(null, page.id)}>
                        <button className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer">
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