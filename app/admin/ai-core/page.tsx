"use client";

import { useState } from "react";
import { BrainCircuit, UploadCloud, FileText, Database, ShieldCheck, Cpu, AlertTriangle } from "lucide-react";

export default function AICoreAdmin() {
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-10 font-sans">
      
      {/* BAŞLIK */}
      <div className="mb-12 border-b border-white/5 pb-6">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <BrainCircuit className="h-8 w-8 text-blue-500" />
          Yapay Zeka <span className="text-white/30 italic font-light">Eğitim Merkezi</span>
        </h1>
        <p className="text-xs text-white/40 mt-2 uppercase tracking-widest font-mono">SkyVan OS // LLM Knowledge Base</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL: VERİ YÜKLEME (EĞİTİM) */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-6 flex items-center gap-2">
              <UploadCloud className="h-4 w-4" /> Yeni Veri Seti Yükle
            </h2>
            
            <div className="border-2 border-dashed border-white/10 hover:border-blue-500/50 transition-colors rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer bg-white/[0.01]">
              <Database className="h-10 w-10 text-white/20 mb-4" />
              <h3 className="text-sm font-bold mb-2">Kılavuz veya Veri Tablosu Yükle</h3>
              <p className="text-xs text-white/40 mb-6 max-w-sm">
                Victron kullanım kılavuzları, kablo kesit tabloları veya karavan güvenlik standartları (PDF, TXT, CSV).
              </p>
              <button className="px-6 py-3 bg-blue-600 text-white text-[10px] font-bold tracking-[0.2em] uppercase rounded-lg hover:bg-blue-500 transition-colors">
                DOSYA SEÇ
              </button>
            </div>
          </div>

          {/* EĞİTİLMİŞ BELGELER (HAFIZA) */}
          <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl p-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/50 mb-6 flex items-center gap-2">
              <Database className="h-4 w-4" /> Aktif Hafıza (RAG Vector)
            </h2>
            
            <div className="space-y-3">
              {[
                { name: "Victron_Kablo_Kesit_Tablosu_2024.pdf", status: "EMBEDDED", chunks: 142 },
                { name: "Karavan_Gaz_Tesisati_TSE_Kurallari.pdf", status: "EMBEDDED", chunks: 85 },
                { name: "MultiPlus_3000_Datasheet.pdf", status: "PROCESSING", chunks: 0 },
              ].map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-400" />
                    <div>
                      <div className="text-xs font-bold">{doc.name}</div>
                      <div className="text-[10px] text-white/40 font-mono">Vektör Parçası: {doc.chunks}</div>
                    </div>
                  </div>
                  <div className={`text-[9px] font-bold font-mono px-3 py-1 rounded-full ${
                    doc.status === 'EMBEDDED' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500 animate-pulse'
                  }`}>
                    {doc.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* SAĞ: SİSTEM SAĞLIĞI & KURALLAR */}
        <div className="space-y-8">
          
          <div className="bg-blue-900/10 border border-blue-500/20 rounded-2xl p-8">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-blue-500 mb-6 flex items-center gap-2">
              <Cpu className="h-4 w-4" /> AI Motor Durumu
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-blue-500/10 pb-4">
                <span className="text-xs text-blue-400/60">Aktif Model</span>
                <span className="text-xs font-mono font-bold text-blue-400">GPT-4 Turbo (RAG)</span>
              </div>
              <div className="flex justify-between items-center border-b border-blue-500/10 pb-4">
                <span className="text-xs text-blue-400/60">Öğrenilmiş Kural Sayısı</span>
                <span className="text-xs font-mono font-bold text-blue-400">1,204</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-blue-400/60">Atölye (Configurator) Senkronizasyonu</span>
                <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded font-mono">AKTİF</span>
              </div>
            </div>
          </div>

          <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Katı Mühendislik Kuralları</h3>
                <p className="text-xs text-red-400/60 leading-relaxed">
                  Buraya yüklenen veriler Atölye'deki güvenlik duvarını doğrudan etkiler. Eğer AI bir kablo kesitinin yetersiz olduğunu öğrenirse, müşterinin konfigürasyonunu anında bloke edecektir.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}