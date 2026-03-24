import { db } from "@/db/db";
import { localizedContent } from "@/db/schema";
import { eq } from "drizzle-orm";
import { 
  Image as ImageIcon, Trash2, Tag, ExternalLink, 
  Server, HardDrive, Search, Zap 
} from "lucide-react";
import AddMediaDrawer from "./AddMediaDrawer";
import { deleteMedia } from "./actions";

export default async function MediaLibraryPage() {
  const rawMedia = await db.select()
    .from(localizedContent)
    .where(eq(localizedContent.entityType, "media"));

  const allMedia = rawMedia.reverse();

  const totalImages = allMedia.length;
  const simulatedStorageMB = (totalImages * 3.4).toFixed(1);
  const maxStorageMB = 1024; 
  const storagePercentage = Math.min((Number(simulatedStorageMB) / maxStorageMB) * 100, 100);

  return (
    // EKRANI İKİYE BÖLÜYORUZ: flex items-start
    <div className="flex h-full items-start">
      
      {/* SOL TARAF: KOKPİT VE GALERİ */}
      <div className="flex-1 p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-screen">
        
        {/* ÜST BAŞLIK VE SUNUCU RADARI */}
        <div className="flex items-center justify-between mb-8">
          <div>
             <h1 className="text-2xl font-light text-white flex items-center gap-3 whitespace-nowrap">
               <Server className="h-6 w-6 text-blue-500" /> SkyVan <span className="font-semibold">CDN & Medya</span>
             </h1>
             <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 font-bold">Global İçerik Dağıtım Ağı</p>
          </div>
          
          {/* CDN DEPOLAMA METRESİ */}
          <div className="hidden md:flex items-center gap-4 bg-[#0a0a0a] border border-zinc-800 px-6 py-3 rounded-2xl">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <HardDrive className="h-5 w-5" />
            </div>
            <div className="w-32">
               <div className="flex justify-between text-[9px] font-bold tracking-widest uppercase text-zinc-400 mb-1.5">
                 <span>Alan</span>
                 <span className="text-blue-400">{simulatedStorageMB} MB</span>
               </div>
               <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${storagePercentage}%` }} />
               </div>
            </div>
          </div>
        </div>

        {/* AKILLI ARAMA BARI */}
        <div className="mb-8 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-600" />
            <input 
              type="text" 
              placeholder="Etikete veya dosya adına göre görsel ara... (Örn: Mutfak, Güneş Paneli)" 
              className="w-full bg-[#0a0a0a] border border-zinc-800 py-4 pl-12 pr-4 rounded-2xl text-sm outline-none focus:border-blue-500 text-white transition-all shadow-inner"
            />
          </div>
          <button className="px-6 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-2xl text-xs font-bold uppercase tracking-widest hover:text-white hover:border-zinc-600 transition-all flex items-center gap-2">
             <Zap className="h-4 w-4 text-amber-500" /> Filtrele
          </button>
        </div>

        {/* MEDYA IZGARASI */}
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 pb-12">
          {allMedia.length === 0 && (
            <div className="col-span-full border-2 border-dashed border-zinc-800 rounded-3xl p-16 flex flex-col items-center justify-center text-zinc-600">
              <ImageIcon className="h-12 w-12 mb-4 opacity-30" />
              <span className="text-sm font-bold tracking-widest uppercase">CDN Sunucusu Şu An Boş</span>
              <span className="text-[10px] mt-2 italic">Sağ panelden ilk görseli yükleyerek ateşlemeyi başlat.</span>
            </div>
          )}

          {allMedia.map((media) => {
            const content = media.contentJson as { url: string, tags: string[] } || { url: '', tags: [] };

            return (
              <div key={media.id} className="group relative rounded-3xl overflow-hidden bg-[#0a0a0a] border border-zinc-800 aspect-[4/3] shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
                <img src={content.url} alt={media.title || "Görsel"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
                
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-wrap gap-2">
                      {content.tags && content.tags.map((tag: string) => (
                        <span key={tag} className="flex items-center gap-1 bg-black/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest border border-white/10">
                          <Tag className="h-3 w-3 text-amber-500" /> {tag}
                        </span>
                      ))}
                    </div>
                    <form action={deleteMedia.bind(null, media.id)}>
                      <button className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all backdrop-blur-md cursor-pointer border border-red-500/20">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <h3 className="text-white font-black text-lg drop-shadow-2xl">{media.title}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="flex items-center gap-1 text-[9px] text-green-400 bg-green-400/10 px-2 py-1 rounded-md font-bold uppercase tracking-widest">
                           <Zap className="h-3 w-3" /> CDN Aktif
                        </span>
                        <span className="text-[9px] text-zinc-400 font-mono">{(Math.random() * (4.5 - 1.2) + 1.2).toFixed(1)} MB</span>
                      </div>
                    </div>
                    
                    <a 
                      href={content.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-4 rounded-2xl flex items-center justify-center transition-all backdrop-blur-md bg-white/5 text-white hover:bg-blue-600 hover:border-blue-600 border border-white/10"
                      title="Görseli Yeni Sekmede Aç"
                    >
                      <ExternalLink className="h-5 w-5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SAĞ TARAF: SABİT FORM PANELİ */}
      <div className="shrink-0 h-screen sticky top-0 border-l border-white/5 shadow-2xl z-10">
        <AddMediaDrawer />
      </div>

    </div>
  );
}