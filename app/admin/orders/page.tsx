import { Users, Phone, Mail, CheckCircle2, Clock, MoreVertical } from "lucide-react";

export default function OrdersPage() {
  return (
    <div className="p-8 animate-in fade-in duration-500 h-full flex flex-col">
      
      {/* Üst Başlık */}
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-2xl font-light text-white flex items-center gap-3">
            <Users className="h-6 w-6 text-white/70" />
            Siparişler & <span className="font-semibold">CRM</span>
          </h1>
          <p className="text-sm text-skyvan-muted mt-2">Müşteri taleplerini ve üretim süreçlerini takip edin.</p>
        </div>
      </div>

      {/* Kanban Board (Sütunlar) */}
      <div className="flex gap-6 overflow-x-auto pb-4 flex-1">
        
        {/* SÜTUN 1: Yeni Talepler */}
        <div className="w-80 shrink-0 flex flex-col bg-white/[0.02] border border-skyvan-border/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-medium text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-skyvan-accent"></span> Yeni Talepler
            </h3>
            <span className="text-xs font-mono text-skyvan-muted bg-white/10 px-2 py-1 rounded-md">2</span>
          </div>
          
          <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
            {/* Kart 1 */}
            <div className="bg-[#0a0a0a] border border-skyvan-border/50 p-4 rounded-xl hover:border-white/20 transition-colors cursor-pointer group">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-mono text-skyvan-muted bg-white/5 px-2 py-1 rounded">#SKV-2026-089</span>
                <button className="text-skyvan-muted hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="h-4 w-4" /></button>
              </div>
              <h4 className="font-semibold text-white mb-1">Ahmet Yılmaz</h4>
              <p className="text-xs text-skyvan-accent mb-4">Premium Paket + 800W Güneş</p>
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white text-xs py-2 rounded-lg transition-colors border border-white/10"><Phone className="h-3 w-3" /> Ara</button>
                <button className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white text-xs py-2 rounded-lg transition-colors border border-white/10"><Mail className="h-3 w-3" /> Mail</button>
              </div>
            </div>
          </div>
        </div>

        {/* SÜTUN 2: İletişimde */}
        <div className="w-80 shrink-0 flex flex-col bg-white/[0.02] border border-skyvan-border/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-medium text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-skyvan-warning"></span> İletişimde (Teklif)
            </h3>
            <span className="text-xs font-mono text-skyvan-muted bg-white/10 px-2 py-1 rounded-md">1</span>
          </div>
          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            {/* Kart 2 */}
            <div className="bg-[#0a0a0a] border border-skyvan-border/50 p-4 rounded-xl hover:border-white/20 transition-colors cursor-pointer group">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-mono text-skyvan-muted bg-white/5 px-2 py-1 rounded">#SKV-2026-088</span>
                <span className="text-[10px] flex items-center gap-1 text-skyvan-warning"><Clock className="h-3 w-3" /> 2 gün önce</span>
              </div>
              <h4 className="font-semibold text-white mb-1">Mert & Ayşe</h4>
              <p className="text-xs text-skyvan-muted mb-3">Teklif gönderildi, dönüş bekleniyor.</p>
              <div className="text-sm font-mono text-white">185.000 ₺</div>
            </div>
          </div>
        </div>

        {/* SÜTUN 3: Üretimde */}
        <div className="w-80 shrink-0 flex flex-col bg-white/[0.02] border border-skyvan-border/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-medium text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Üretimde
            </h3>
            <span className="text-xs font-mono text-skyvan-muted bg-white/10 px-2 py-1 rounded-md">1</span>
          </div>
          <div className="space-y-3 overflow-y-auto flex-1 pr-1">
            {/* Kart 3 */}
            <div className="bg-[#0a0a0a] border border-green-500/30 p-4 rounded-xl relative overflow-hidden cursor-pointer group hover:border-green-500/50 transition-colors">
              <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 rounded-bl-full -z-10"></div>
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-mono text-green-400 bg-green-500/10 px-2 py-1 rounded">#SKV-2026-075</span>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
              <h4 className="font-semibold text-white mb-1">Cem Bey</h4>
              <p className="text-xs text-skyvan-muted mb-3">Aşama: Mobilya Montajı</p>
              
              {/* İlerleme Çubuğu */}
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-green-500 w-[60%] h-full rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}