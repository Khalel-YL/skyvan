"use client";

import { useState } from "react";
import { X, Truck, Ruler, Weight } from "lucide-react";
import { saveModel } from "./actions";
import Link from "next/link";

export default function AddModelDrawer({ initialData }: { initialData?: any }) {
  const isEdit = !!initialData;
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-8 bg-[#0a0a0a] text-white border-l border-white/5 h-full overflow-y-auto custom-scrollbar min-w-[500px] relative">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold tracking-tight">
          {isEdit ? "Şasi Güncelle" : "Yeni Araç Şasisi Ekle"}
        </h2>
        {isEdit && (
          <Link href="/admin/models" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
            <X className="h-4 w-4 text-zinc-400" />
          </Link>
        )}
      </div>

      <form action={saveModel} onSubmit={() => setLoading(true)} className="space-y-8">
        {isEdit && <input type="hidden" name="id" value={initialData.id} />}

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold tracking-[0.2em] text-blue-500 uppercase flex items-center gap-2"><Truck className="h-4 w-4" /> Temel Kimlik</h3>
          <input name="slug" defaultValue={initialData?.slug} required placeholder="Model Adı (Örn: fiat-ducato-15m3)" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-blue-500 font-mono" />
          <select name="status" defaultValue={initialData?.status || "active"} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-blue-500 text-zinc-400">
            <option value="active">Aktif (Üretimde)</option>
            <option value="draft">Taslak (Hazırlanıyor)</option>
            <option value="archived">Arşivlendi (Üretimden Kalktı)</option>
          </select>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold tracking-[0.2em] text-amber-500 uppercase flex items-center gap-2"><Weight className="h-4 w-4" /> Ağırlık Dinamikleri</h3>
          <div className="grid grid-cols-2 gap-4">
            <input name="baseWeightKg" defaultValue={initialData?.baseWeightKg} required placeholder="Boş Ağırlık (kg)" type="number" step="0.01" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-amber-500" />
            <input name="maxPayloadKg" defaultValue={initialData?.maxPayloadKg} required placeholder="Max Taşıma (kg)" type="number" step="0.01" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-amber-500" />
          </div>
          <p className="text-[9px] text-zinc-500">Yapay Zeka (AI), eklenecek paket ve donanımların "Max Taşıma" kapasitesini aşıp aşmadığını bu değere göre denetler.</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase flex items-center gap-2"><Ruler className="h-4 w-4" /> Fiziksel Boyutlar (Milimetre)</h3>
          <div className="grid grid-cols-1 gap-4">
            <input name="wheelbaseMm" defaultValue={initialData?.wheelbaseMm} required placeholder="Dingil Mesafesi (mm)" type="number" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-white/30" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input name="roofLengthMm" defaultValue={initialData?.roofLengthMm} placeholder="Tavan Uzunluğu (mm)" type="number" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-white/30" />
            <input name="roofWidthMm" defaultValue={initialData?.roofWidthMm} placeholder="Tavan Genişliği (mm)" type="number" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-white/30" />
          </div>
          <p className="text-[9px] text-zinc-500">Tavan ölçüleri, Güneş Paneli dizilimi ve Hekiler (Havalandırma) için geometrik alan hesaplamasında kullanılır.</p>
        </div>

        <button type="submit" disabled={loading} className={`w-full py-5 text-black rounded-xl font-bold tracking-[0.2em] text-[10px] uppercase transition-all ${isEdit ? "bg-amber-400 hover:bg-amber-300" : "bg-white hover:bg-neutral-200"}`}>
          {loading ? "Kaydediliyor..." : isEdit ? "Şasiyi Güncelle" : "Şasiyi Mühürle"}
        </button>
      </form>
    </div>
  );
}