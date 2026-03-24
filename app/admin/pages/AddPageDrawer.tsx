"use client";

import { useState, useEffect } from "react";
import { X, PanelTop, Search, LayoutTemplate, Sparkles, Globe, Wand2, Bot } from "lucide-react";
import { savePage } from "./actions";
import Link from "next/link";

export default function AddPageDrawer({ initialData }: { initialData?: any }) {
  const isEdit = !!initialData;
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false); // AI yüklenme animasyonu için
  const parsedContent = initialData?.contentJson || {};

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(parsedContent.slug || "");
  const [metaDesc, setMetaDesc] = useState(parsedContent.metaDescription || "");
  const [isPublished, setIsPublished] = useState(isEdit ? parsedContent.isPublished : true);

  // OTOMATİK URL (SLUG) OLUŞTURUCU
  useEffect(() => {
    if (!isEdit && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setSlug(generatedSlug);
    }
  }, [title, isEdit]);

  // SÜRPRİZ: YAPAY ZEKA SEO MOTORU SİMÜLASYONU
  const generateAISeo = (e: any) => {
    e.preventDefault();
    if (!title) {
      alert("AI'ın metin yazabilmesi için önce bir 'Sayfa Başlığı' girmelisin kanka!");
      return;
    }
    setAiLoading(true);
    
    // Gerçek bir API'ye bağlanıyormuş gibi 1.5 saniye animasyon gösteriyoruz
    setTimeout(() => {
      const aiGeneratedText = `SkyVan Karavan ${title} detayları. Premium donanım, lüks mühendislik ve bağımsız yaşam standartlarıyla tanışın. Karavan modellerimizi hemen keşfedin.`;
      setMetaDesc(aiGeneratedText);
      setAiLoading(false);
    }, 1500);
  };

  // SEO METRE HESAPLAMALARI
  const seoLength = metaDesc.length;
  const seoColor = seoLength === 0 ? "bg-zinc-800" : seoLength < 100 ? "bg-amber-500" : seoLength <= 160 ? "bg-green-500" : "bg-red-500";
  const seoPercentage = Math.min((seoLength / 160) * 100, 100);
  let seoMessage = "Kısa";
  if (seoLength >= 100 && seoLength <= 160) seoMessage = "Mükemmel Optimizasyon";
  if (seoLength > 160) seoMessage = "Çok Uzun (Google kesecek)";

  return (
    <div className="p-8 bg-[#0a0a0a] text-white border-l border-white/5 h-full overflow-y-auto custom-scrollbar min-w-[550px] relative">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          {isEdit ? "Sayfayı Düzenle" : "Yeni Kurumsal Sayfa"} <Sparkles className="h-5 w-5 text-amber-500" />
        </h2>
        {isEdit && (
          <Link href="/admin/pages" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
            <X className="h-4 w-4 text-zinc-400" />
          </Link>
        )}
      </div>

      <form action={savePage} onSubmit={() => setLoading(true)} className="space-y-8">
        {isEdit && <input type="hidden" name="id" value={initialData.id} />}

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold tracking-[0.2em] text-blue-500 uppercase flex items-center gap-2">
            <PanelTop className="h-4 w-4" /> Sayfa Kimliği
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <input 
              name="title" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required 
              placeholder="Sayfa Başlığı" 
              className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-blue-500 font-bold" 
            />
            <input 
              name="slug" 
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required 
              placeholder="url-kismi" 
              className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-sm outline-none focus:border-blue-500 font-mono text-zinc-400" 
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-bold tracking-[0.2em] text-amber-500 uppercase flex items-center gap-2">
              <Search className="h-4 w-4" /> SEO Açıklaması
            </h3>
            
            {/* YAPAY ZEKA BUTONU BURADA */}
            <button 
              type="button" 
              onClick={generateAISeo}
              disabled={aiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border border-blue-500/20"
            >
              {aiLoading ? <Bot className="h-3 w-3 animate-bounce" /> : <Wand2 className="h-3 w-3" />}
              {aiLoading ? "Yazılıyor..." : "AI ile Üret"}
            </button>
          </div>
          
          <textarea 
            name="metaDescription" 
            value={metaDesc}
            onChange={(e) => setMetaDesc(e.target.value)}
            rows={3} 
            placeholder="Arama motorlarında görünecek çarpıcı metni yazın veya AI'a yazdırın..." 
            className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-amber-500 resize-none transition-all"
          />
          
          {/* SEO İLERLEME ÇUBUĞU */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              <span className={seoLength > 160 ? "text-red-500" : ""}>{seoMessage}</span>
              <span>{seoLength} / 160</span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className={`h-full transition-all duration-500 ${seoColor}`} style={{ width: `${seoPercentage}%` }} />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t border-zinc-900 pt-6">
          <h3 className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase flex items-center gap-2 mb-4">
            <LayoutTemplate className="h-4 w-4" /> Yayın Şalteri
          </h3>
          <label className="flex items-center justify-between bg-[#050505] border border-zinc-800 p-5 rounded-2xl cursor-pointer hover:border-zinc-700 transition-all">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isPublished ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-800 text-zinc-500'}`}>
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-sm text-white font-bold">Sayfayı Yayına Al</span>
                <span className="block text-[10px] text-zinc-500">Bu şalter kapalıysa sayfa 404 hatası verir.</span>
              </div>
            </div>
            <input type="checkbox" name="isPublished" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="sr-only peer" />
            <div className="relative w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>

        <button type="submit" disabled={loading} className={`w-full py-5 text-black rounded-xl font-bold tracking-[0.2em] text-[10px] uppercase transition-all shadow-lg ${isEdit ? "bg-amber-400 hover:bg-amber-300" : "bg-white hover:bg-neutral-200"}`}>
          {loading ? "Sistem İşliyor..." : isEdit ? "Değişiklikleri Mühürle" : "Vitrine Ekle"}
        </button>
      </form>
    </div>
  );
}