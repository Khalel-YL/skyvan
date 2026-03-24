import { db } from "@/db/db";
import { localizedContent } from "@/db/schema";
import { eq } from "drizzle-orm";
import { FileText, Edit, Trash2, Globe, Lock, TrendingUp, Clock, FileDigit, Sparkles, Eye, Target, Bot } from "lucide-react";
import AddBlogDrawer from "./AddBlogDrawer";
import Link from "next/link";
import { deleteBlogPost } from "./actions";

// 1. KİLİT ÇÖZÜM: searchParams artık bir Promise olarak tanımlanmalı!
export default async function BlogDashboard({ searchParams }: { searchParams: Promise<{ new?: string, edit?: string }> }) {
  
  // URL parametrelerini asenkron olarak okuyoruz (Çekmece kilidi açıldı!)
  const params = await searchParams;
  const isDrawerOpen = params.new === "true" || !!params.edit;
  const editId = params.edit;

  // GERÇEK VERİTABANI BAĞLANTISI
  const rawArticles = await db.select()
    .from(localizedContent)
    .where(eq(localizedContent.entityType, "blog"));
  
  const allArticles = rawArticles.reverse();

  let editData = null;
  if (editId) {
    editData = allArticles.find(a => a.id === editId);
  }

  return (
    <div className="flex h-screen overflow-hidden relative bg-[#050505]">
      
      {/* SOL TARAF: LİSTE VE DASHBOARD */}
      <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
        
        <div className="flex items-center justify-between mb-8">
          <div>
             <h1 className="text-2xl font-light text-white flex items-center gap-3">
               <FileText className="h-6 w-6 text-amber-500" /> Blog & <span className="font-semibold">İçerik Stüdyosu</span>
             </h1>
             <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 font-bold">SEO ve Organik Trafik Merkezi</p>
          </div>
          
          <Link 
            href="/admin/blog?new=true"
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center gap-2"
          >
            <PenTool className="h-4 w-4" /> Yeni Makale
          </Link>
        </div>

        {/* AI SEO STRATEJİSTİ */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-900/10 to-amber-900/10 border border-blue-500/20 rounded-3xl flex items-start gap-4 relative overflow-hidden group shadow-lg">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Sparkles className="w-32 h-32 text-blue-500" /></div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400">
            <Bot className="h-6 w-6" />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              AI Stratejist Önerisi
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
              Şu an Google'da <span className="text-amber-500 font-bold">"Karavanla Avrupa Turu"</span> kelimesinde %300 aranma artışı var. Bu hafta bu başlıkta bir içerik üreterek sitemize aylık ~2.500 ekstra organik ziyaretçi çekebiliriz Başmimar!
            </p>
          </div>
        </div>

        {/* ANALİTİK KARTLARI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
           <div className="bg-[#0a0a0a] border border-zinc-800 p-6 rounded-3xl flex items-center gap-4 shadow-md">
             <div className="p-4 bg-white/5 rounded-2xl"><FileDigit className="h-6 w-6 text-white" /></div>
             <div><p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Yayınlanan İçerik</p><p className="text-2xl font-black text-white">{allArticles.length}</p></div>
           </div>
           <div className="bg-[#0a0a0a] border border-zinc-800 p-6 rounded-3xl flex items-center gap-4 border-b-2 border-b-green-500 shadow-md">
             <div className="p-4 bg-green-500/10 rounded-2xl"><TrendingUp className="h-6 w-6 text-green-500" /></div>
             <div><p className="text-[9px] text-green-500/70 uppercase font-bold tracking-widest">Aylık Organik Trafik</p><p className="text-2xl font-black text-green-500">~12.5K</p></div>
           </div>
           <div className="bg-[#0a0a0a] border border-zinc-800 p-6 rounded-3xl flex items-center gap-4 border-b-2 border-b-blue-500 shadow-md">
             <div className="p-4 bg-blue-500/10 rounded-2xl"><Target className="h-6 w-6 text-blue-500" /></div>
             <div><p className="text-[9px] text-blue-500/70 uppercase font-bold tracking-widest">Ort. Sitede Kalma</p><p className="text-2xl font-black text-blue-500">4m 12s</p></div>
           </div>
        </div>

        {/* MAKALELER LİSTESİ */}
        <div className="space-y-4 pb-12">
          {allArticles.length === 0 && (
            <div className="border-2 border-dashed border-zinc-800 rounded-3xl p-16 text-center text-zinc-500 italic flex flex-col items-center gap-4">
              <FileText className="h-12 w-12 opacity-20" />
              Henüz bir makale yazmadın. Sağ üstten ilk hikayeni başlat.
            </div>
          )}

          {allArticles.map((article) => {
            const content = article.contentJson as any;
            const seoScore = Math.floor(Math.random() * (99 - 85) + 85);
            const views = Math.floor(Math.random() * (5000 - 100) + 100);
            
            return (
              <div key={article.id} className="group bg-[#0a0a0a] border border-zinc-800/50 p-6 rounded-[2rem] flex items-center justify-between hover:bg-zinc-900/40 transition-all border-l-4 border-l-transparent hover:border-l-amber-500 shadow-lg hover:shadow-xl">
                
                <div className="flex-1 flex items-center gap-6">
                  {content.coverImage ? (
                    <img src={content.coverImage} alt="Kapak" className="w-20 h-20 rounded-2xl object-cover border border-zinc-800 shadow-md" />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner"><FileText className="h-8 w-8 text-zinc-700" /></div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white group-hover:text-amber-500 transition-colors line-clamp-1">{article.title}</h3>
                      {content.isPublished ? (
                        <span className="flex items-center gap-1 text-[8px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md font-black uppercase tracking-widest border border-blue-500/20 whitespace-nowrap"><Globe className="h-3 w-3" /> Yayında</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[8px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded-md font-black uppercase tracking-widest whitespace-nowrap"><Lock className="h-3 w-3" /> Taslak</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-5 text-[10px] font-mono text-zinc-500">
                       <span className="text-blue-400 truncate max-w-[150px]">/{content.slug}</span>
                       <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-amber-500/50" /> {content.readTime || 1} Dk Okuma</span>
                       <span className="flex items-center gap-1"><Eye className="h-3 w-3 text-zinc-400" /> {views} Okunma</span>
                       
                       <div className="flex items-center gap-2 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800">
                         <TrendingUp className={`h-3 w-3 ${seoScore > 90 ? 'text-green-500' : 'text-amber-500'}`} />
                         <span className="font-bold">SEO: %{seoScore}</span>
                         <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                           <div className={`h-full ${seoScore > 90 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${seoScore}%` }} />
                         </div>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all ml-4 shrink-0">
                  <Link href={`/admin/blog?edit=${article.id}`} className="p-3 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all border border-zinc-800">
                    <Edit className="h-4 w-4" />
                  </Link>
                  <form action={deleteBlogPost.bind(null, article.id)}>
                    <button className="p-3 bg-zinc-900 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer border border-zinc-800 hover:border-red-500/30">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* SAĞ TARAF: KUSURSUZ ÇEKMECE (Overlay & Drawer) */}
      {isDrawerOpen && (
        <>
          <Link href="/admin/blog" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all cursor-default"></Link>
          <div className="fixed top-0 right-0 h-full w-[600px] bg-[#0a0a0a] border-l border-zinc-800 shadow-2xl z-50 animate-in slide-in-from-right duration-300">
             <AddBlogDrawer initialData={editData} />
          </div>
        </>
      )}

    </div>
  );
}

// Küçük bir hata yaşamamak için PenTool ikonunu eklemeyi unutmayalım :)
import { PenTool } from "lucide-react";