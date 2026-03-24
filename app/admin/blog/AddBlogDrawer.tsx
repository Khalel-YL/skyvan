"use client";

import { useState, useEffect } from "react";
import { X, Image as ImageIcon, Sparkles, Globe, Bot, Clock, PenTool } from "lucide-react";
import { saveBlogPost } from "./actions";
import Link from "next/link";

export default function AddBlogDrawer({ initialData }: { initialData?: any }) {
  const isEdit = !!initialData;
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  
  const parsedContent = initialData?.contentJson || {};

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(parsedContent.slug || "");
  const [coverImage, setCoverImage] = useState(parsedContent.coverImage || "");
  const [content, setContent] = useState(parsedContent.content || "");
  const [isPublished, setIsPublished] = useState(isEdit ? parsedContent.isPublished : true);

  useEffect(() => {
    if (!isEdit && title) {
      const generatedSlug = title.toLowerCase().replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
    }
  }, [title, isEdit]);

  // AKILLI VE UZUN AI GHOSTWRITER
  const generateAIArticle = () => {
    if (!title) return alert("Başlık atmadan makale yazamam Başmimar!");
    setAiLoading(true);
    
    setTimeout(() => {
      const keyword = title.toLowerCase();
      let dynamicTech = "premium karavan donanımları";
      
      // Sen Renogy yazarsan Renogy, Victron yazarsan Victron anlatan akıllı algoritma
      if(keyword.includes("renogy")) dynamicTech = "Renogy akıllı enerji yönetimi ve lityum akü sistemleri";
      else if(keyword.includes("victron")) dynamicTech = "Victron Energy invertör ve güneş paneli altyapısı";
      else if(keyword.includes("kış") || keyword.includes("soğuk")) dynamicTech = "Aqua Hot ısıtma sistemleri ve poliüretan yalıtım teknolojisi";

      const aiText = `## ${title}\n\nKaravan dünyasına adım atmak, özgürlüğe açılan en büyük kapıdır. Bu yazımızda, karavan severlerin en çok merak ettiği **${title}** konusunu tüm mühendislik detaylarıyla ele alıyoruz.\n\n### 1. Neden Bu Konu Kritik?\nDoğada tam bağımsız kalabilmek ve ev konforundan ödün vermemek için doğru donanıma sahip olmak şart. SkyVan mühendisleri olarak, tam da bu noktada devreye giriyoruz. Amacımız sadece bir araç değil, yaşanabilir bir habitat üretmek.\n\n> "İyi bir karavan, medeniyetten uzaklaştığınızda bile medeniyetin konforunu size sunabilendir."\n\n### 2. Mühendislik ve Teknoloji Farkımız\nÜretim bandımızda kullandığımız **${dynamicTech}** sayesinde sistemleriniz asla yarı yolda kalmaz. Geleneksel karavanların aksine, sistemlerimiz birbiriyle entegre ve dijital ekranlardan takip edilebilir şekilde tasarlanır.\n\n* **Kesintisiz Kullanım:** Uzun süreli kamp deneyimleri için optimize edilmiştir.\n* **Güvenlik:** Tüm elektrik ve su tesisatımız yanmaz marin standartlarındadır.\n* **Akıllı Kontrol:** Ekran üzerinden her şeyi anlık görebilirsiniz.\n\n### Sonuç Olarak\nSkyVan kalitesiyle üretilmiş bir araçta sınırları sadece siz çizersiniz. Daha detaylı bilgi almak veya Atölye'deki tasarım süreçlerimizi incelemek için bizimle iletişime geçmekten çekinmeyin!`;
      
      setContent(aiText);
      setAiLoading(false);
    }, 2500);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readTime = Math.ceil(wordCount / 200) || 1;

  return (
    <div className="p-8 bg-[#0a0a0a] text-white h-full overflow-y-auto custom-scrollbar flex flex-col relative">
      <div className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-6">
        <h2 className="text-xl font-light tracking-tight flex items-center gap-3">
          <PenTool className="h-5 w-5 text-amber-500" /> {isEdit ? "Makaleyi Düzenle" : "Yeni İçerik Üret"}
        </h2>
        <Link href="/admin/blog" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          <X className="h-4 w-4 text-zinc-400" />
        </Link>
      </div>

      {/* onClick yerine onSubmit kullanmıyoruz, native form submiti Next.js'e bırakıyoruz ki redirect çalışsın */}
      <form action={saveBlogPost} onSubmit={() => setLoading(true)} className="space-y-6 flex-1 flex flex-col">
        {isEdit && <input type="hidden" name="id" value={initialData.id} />}

        <input 
          name="title" value={title} onChange={(e) => setTitle(e.target.value)} required 
          placeholder="Etkileyici Bir Başlık At..." 
          className="w-full bg-transparent border-none text-3xl font-black outline-none placeholder:text-zinc-700 focus:ring-0" 
        />
        
        <div className="flex gap-4">
          <input 
            name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required 
            placeholder="url-kismi" className="flex-1 bg-zinc-900/50 border border-zinc-800 p-3 rounded-xl text-xs outline-none focus:border-blue-500 font-mono text-zinc-500" 
          />
          <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 px-4 rounded-xl text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            <Clock className="h-3 w-3 text-amber-500" /> {readTime} Dk Okuma
          </div>
        </div>

        {/* YENİ GÖRSEL ÖNİZLEME ALANI */}
        <div className="space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Kapak Görseli</span>
          {coverImage && (
            <div className="w-full h-32 rounded-xl overflow-hidden border border-zinc-800 relative group">
              <img src={coverImage} alt="Kapak" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                <span className="text-xs font-bold">Medya CDN'den Bağlandı</span>
              </div>
            </div>
          )}
          <div className="relative">
            <ImageIcon className="absolute left-4 top-4 h-4 w-4 text-zinc-500" />
            <input 
              name="coverImage" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} 
              placeholder="Medya Kütüphanesinden Kopyaladığın Linki Yapıştır..." 
              className="w-full bg-[#111] border border-zinc-800 p-4 pl-12 rounded-xl text-sm outline-none focus:border-amber-500 text-zinc-300" 
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col border border-zinc-800 rounded-2xl overflow-hidden bg-[#050505]">
          <div className="flex items-center justify-between bg-[#111] border-b border-zinc-800 p-3">
             <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-2">İçerik Editörü (Markdown)</span>
             <button 
               type="button" onClick={generateAIArticle} disabled={aiLoading}
               className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
             >
               {aiLoading ? <Bot className="h-3 w-3 animate-bounce" /> : <Sparkles className="h-3 w-3" />}
               {aiLoading ? "AI Makale Yazıyor..." : "AI Hayalet Yazar"}
             </button>
          </div>
          <textarea 
            name="content" value={content} onChange={(e) => setContent(e.target.value)} required 
            placeholder="Makaleni buraya yaz veya AI Hayalet Yazar'a devret..." 
            className="w-full h-full min-h-[250px] bg-transparent p-6 text-sm outline-none resize-none leading-relaxed text-zinc-300 custom-scrollbar"
          />
        </div>

        <div className="flex items-center justify-between pt-4 pb-12">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`p-2 rounded-lg transition-colors ${isPublished ? 'bg-blue-500/20 text-blue-500' : 'bg-zinc-800 text-zinc-500'}`}>
              <Globe className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">Yayına Al</span>
            <input type="checkbox" name="isPublished" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="hidden" />
          </label>

          <button type="submit" disabled={loading} className="px-8 py-4 bg-white text-black rounded-xl font-black tracking-[0.2em] text-[10px] uppercase transition-all hover:bg-zinc-200 shadow-xl">
            {loading ? "Mühürleniyor..." : isEdit ? "Değişiklikleri Kaydet" : "Makaleyi Yayınla"}
          </button>
        </div>
      </form>
    </div>
  );
}