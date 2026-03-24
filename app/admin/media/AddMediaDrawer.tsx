"use client";

import { useState } from "react";
import { X, Image as ImageIcon, Sparkles, UploadCloud, ScanEye, Link as LinkIcon } from "lucide-react";
import { saveMedia } from "./actions";

export default function AddMediaDrawer() {
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [tags, setTags] = useState("");

  // SÜRPRİZ 1: VİSİON AI SİMÜLASYONU
  const simulateVisionAI = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!imageUrl) return alert("Önce bir görsel URL'si girin Başmimar!");
    
    setScanning(true);
    
    // İsme göre zekice etiket uydurma
    setTimeout(() => {
      let generatedTags = "Karavan, Lüks, SkyVan";
      const lowerName = fileName.toLowerCase() || imageUrl.toLowerCase();
      
      if (lowerName.includes("mutfak")) generatedTags = "Mutfak, Tezgah, İç Mekan";
      else if (lowerName.includes("dis") || lowerName.includes("kamp")) generatedTags = "Dış Çekim, Doğa, Kamp, 4x4";
      else if (lowerName.includes("panel") || lowerName.includes("enerji")) generatedTags = "Güneş Paneli, Enerji, Victron";
      
      setTags(generatedTags);
      setScanning(false);
    }, 2000);
  };

  return (
    <div className="p-8 bg-[#0a0a0a] text-white border-l border-white/5 h-full overflow-y-auto custom-scrollbar min-w-[500px] relative">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          Yeni Görsel Yükle <UploadCloud className="h-5 w-5 text-blue-500" />
        </h2>
      </div>

      <form action={saveMedia} onSubmit={() => setLoading(true)} className="space-y-8">
        
        {/* Görsel Önizleme & URL */}
        <div className="space-y-4">
           {imageUrl ? (
             <div className="w-full h-48 rounded-2xl border border-white/10 overflow-hidden relative group">
                <img src={imageUrl} alt="Önizleme" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <ImageIcon className="h-8 w-8 text-white/50" />
                </div>
             </div>
           ) : (
             <div className="w-full h-48 rounded-2xl border-2 border-dashed border-zinc-800 bg-[#050505] flex flex-col items-center justify-center text-zinc-600 gap-3">
               <ImageIcon className="h-8 w-8 opacity-50" />
               <span className="text-xs font-bold uppercase tracking-widest">Görsel URL'si Bekleniyor</span>
             </div>
           )}

           <div className="relative">
              <LinkIcon className="absolute left-4 top-4 h-4 w-4 text-blue-500" />
              <input 
                name="imageUrl" 
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                required 
                placeholder="Resim Bağlantısı (https://...)" 
                className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-xl text-sm outline-none focus:border-blue-500 font-mono text-blue-400" 
              />
           </div>
        </div>

        <div className="space-y-4">
          <input 
            name="fileName" 
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            required 
            placeholder="Dosya Adı (Örn: Mutfak Tasarımı V1)" 
            className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-white/30 font-bold" 
          />
        </div>

        {/* VİSİON AI BÖLÜMÜ */}
        <div className="space-y-4 p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-bold tracking-[0.2em] text-blue-400 uppercase flex items-center gap-2">
              <Sparkles className="h-3 w-3" /> Akıllı Etiketler
            </h3>
            <button 
              type="button" 
              onClick={simulateVisionAI}
              disabled={scanning}
              className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-blue-400 transition-all flex items-center gap-1.5"
            >
              {scanning ? <ScanEye className="h-3 w-3 animate-spin" /> : <ScanEye className="h-3 w-3" />}
              {scanning ? "Fotoğraf Taranıyor..." : "AI Taraması Yap"}
            </button>
          </div>
          <input 
            name="aiTags" 
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            required 
            placeholder="Etiketler (Virgülle ayırın)" 
            className="w-full bg-black/50 border border-white/5 p-4 rounded-xl text-sm outline-none focus:border-blue-500 font-mono text-zinc-300" 
          />
        </div>

        <button type="submit" disabled={loading || scanning} className="w-full py-5 bg-white text-black rounded-xl font-bold tracking-[0.2em] text-[10px] uppercase transition-all hover:bg-zinc-200">
          {loading ? "Arşive Ekleniyor..." : "Kütüphaneye Mühürle"}
        </button>
      </form>
    </div>
  );
}