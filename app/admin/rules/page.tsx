import { Cpu, Plus, AlertTriangle, ArrowRight } from "lucide-react";

export default function RulesPage() {
  return (
    <div className="p-8 animate-in fade-in duration-500">
      
      {/* Üst Başlık */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-light text-white flex items-center gap-3">
            <Cpu className="h-6 w-6 text-skyvan-warning" />
            AI & <span className="font-semibold">Kurallar Motoru</span>
          </h1>
          <p className="text-sm text-skyvan-muted mt-2">Yapay zekanın müşteriye vereceği mühendislik uyarılarını buradan yönetin.</p>
        </div>
        <button className="flex items-center gap-2 bg-white text-black px-4 py-2.5 rounded-lg text-sm font-semibold transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
          <Plus className="h-4 w-4" /> Yeni Kural Ekle
        </button>
      </div>

      {/* Kural Listesi */}
      <div className="space-y-4">
        
        {/* Kural Kartı 1 */}
        <div className="flex items-center justify-between p-6 rounded-xl border border-skyvan-warning/30 bg-skyvan-warning/5 hover:bg-skyvan-warning/10 transition-colors">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-md bg-white/10 text-white text-xs font-mono">premium-paket</span>
              <ArrowRight className="h-4 w-4 text-skyvan-muted" />
              <span className="px-3 py-1 rounded-md bg-white/10 text-white text-xs font-mono">gunes-400w</span>
            </div>
            <div className="h-8 w-px bg-skyvan-border/50"></div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-skyvan-warning" />
                <span className="text-sm font-semibold text-skyvan-warning">Kritik Uyumsuzluk (Soft Block)</span>
              </div>
              <p className="text-xs text-skyvan-muted">"Premium paketin yüksek enerji tüketimi için 400W yetersiz..."</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="text-xs font-medium text-white/50 hover:text-white px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors">Düzenle</button>
          </div>
        </div>

        {/* Kural Kartı 2 */}
        <div className="flex items-center justify-between p-6 rounded-xl border border-skyvan-border/50 bg-white/5 hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-md bg-white/10 text-white text-xs font-mono">base-paket</span>
              <ArrowRight className="h-4 w-4 text-skyvan-muted" />
              <span className="px-3 py-1 rounded-md bg-white/10 text-white text-xs font-mono">klima-220v</span>
            </div>
            <div className="h-8 w-px bg-skyvan-border/50"></div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-white">Zorunlu Gereksinim (Hard Block)</span>
              </div>
              <p className="text-xs text-skyvan-muted">"220V Klima seçimi için en az 3000W Inverter gereklidir."</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="text-xs font-medium text-white/50 hover:text-white px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors">Düzenle</button>
          </div>
        </div>

      </div>

    </div>
  );
}