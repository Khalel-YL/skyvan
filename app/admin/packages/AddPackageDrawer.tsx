"use client";

import { useState } from "react";
import { X, Package, Layers, Link as LinkIcon } from "lucide-react";
import { savePackage } from "./actions";
import Link from "next/link";

export default function AddPackageDrawer({ initialData, availableModels }: { initialData?: any, availableModels: any[] }) {
  const isEdit = !!initialData;
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-8 bg-[#0a0a0a] text-white border-l border-white/5 h-full overflow-y-auto custom-scrollbar min-w-[500px] relative">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold tracking-tight">
          {isEdit ? "Paketi Güncelle" : "Yeni Donanım Paketi"}
        </h2>
        {isEdit && (
          <Link href="/admin/packages" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
            <X className="h-4 w-4 text-zinc-400" />
          </Link>
        )}
      </div>

      <form action={savePackage} onSubmit={() => setLoading(true)} className="space-y-8">
        {isEdit && <input type="hidden" name="id" value={initialData.id} />}

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold tracking-[0.2em] text-blue-500 uppercase flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Şasi / Model Bağlantısı</h3>
          <select name="modelId" defaultValue={initialData?.modelId} required className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-blue-500 font-bold text-amber-500">
            <option value="">-- Araç Modeli Seçin --</option>
            {availableModels.map(m => (
              <option key={m.id} value={m.id}>{m.slug.toUpperCase()} (Max: {m.maxPayloadKg}kg)</option>
            ))}
          </select>
          <p className="text-[9px] text-zinc-500">Bu paket sadece seçilen araç şasisine özel olarak yapılandırılacaktır.</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold tracking-[0.2em] text-amber-500 uppercase flex items-center gap-2"><Package className="h-4 w-4" /> Paket Kimliği</h3>
          <div className="grid grid-cols-2 gap-4">
            <input name="name" defaultValue={initialData?.name} required placeholder="Paket Adı (Örn: Premium)" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-amber-500 font-bold" />
            <input name="slug" defaultValue={initialData?.slug} required placeholder="Kısa Kod (premium-15m3)" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-amber-500 font-mono" />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase flex items-center gap-2"><Layers className="h-4 w-4" /> Hiyerarşi ve Kurallar</h3>
          <div className="grid grid-cols-2 gap-4 items-center">
            <input name="tierLevel" defaultValue={initialData?.tierLevel || 0} required placeholder="Seviye (0, 1, 2...)" type="number" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-white/30" />
            <label className="flex items-center gap-3 bg-white/5 p-4 rounded-xl cursor-pointer hover:bg-white/10 transition-colors border border-white/10">
              <input type="checkbox" name="isDefault" defaultChecked={initialData?.isDefault} className="w-4 h-4 accent-amber-500" />
              <span className="text-sm text-zinc-300 font-medium">Varsayılan Paket</span>
            </label>
          </div>
          <p className="text-[9px] text-zinc-500">Seviye (Tier): Paketin donanım zenginliğini belirtir (Örn: Base=1, Comfort=2, Premium=3).</p>
        </div>

        <button type="submit" disabled={loading} className={`w-full py-5 text-black rounded-xl font-bold tracking-[0.2em] text-[10px] uppercase transition-all shadow-lg ${isEdit ? "bg-amber-400 hover:bg-amber-300 shadow-amber-500/20" : "bg-white hover:bg-neutral-200 shadow-white/10"}`}>
          {loading ? "Sisteme İşleniyor..." : isEdit ? "Değişiklikleri Kaydet" : "Paketi Veritabanına Ekle"}
        </button>
      </form>
    </div>
  );
}