"use client";

import { useState } from "react";
import { X, FileSignature, CheckCircle2, Truck, User, Banknote, ListStart } from "lucide-react";
import { saveOffer } from "./actions";
import { useRouter } from "next/navigation";

export function AddOfferDrawer({ initialData }: { initialData?: any }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <div className="h-full bg-black text-white p-8 flex flex-col border-l border-zinc-900 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-500">
      <div className="flex items-center justify-between mb-10 shrink-0 border-b border-zinc-900 pb-6">
        <h2 className="text-xl font-black uppercase italic text-amber-500 flex items-center gap-3">
          <FileSignature size={22} className="text-amber-500" /> Teklif Jeneratörü
        </h2>
        <button onClick={() => router.push("/admin/offers")} className="p-2 hover:bg-zinc-800 rounded-full transition-colors"><X size={24} /></button>
      </div>

      <form action={saveOffer} onSubmit={() => setLoading(true)} className="space-y-6">
        <input type="hidden" name="id" value={initialData?.id || ""} />
        
        <div className="space-y-4">
            <div className="relative">
                <User className="absolute left-5 top-5 text-zinc-500" size={16} />
                <input name="leadName" defaultValue={initialData?.contentJson?.leadName} placeholder="Müşteri Adı (Lead)" className="w-full bg-zinc-900 border border-zinc-800 p-5 pl-14 rounded-2xl text-sm outline-none focus:border-amber-500" required />
            </div>

            <div className="relative">
                <Truck className="absolute left-5 top-5 text-zinc-500" size={16} />
                <input name="caravanModel" defaultValue={initialData?.contentJson?.caravanModel} placeholder="Örn: 15m³ Ducato - Premium Paket" className="w-full bg-zinc-900 border border-zinc-800 p-5 pl-14 rounded-2xl text-sm outline-none focus:border-amber-500" required />
            </div>

            <div className="relative">
                <Banknote className="absolute left-5 top-5 text-emerald-500/50" size={16} />
                <input name="price" type="number" defaultValue={initialData?.contentJson?.price} placeholder="Teklif Tutarı (₺)" className="w-full bg-zinc-900 border border-emerald-500/20 p-5 pl-14 rounded-2xl text-sm text-emerald-400 font-mono outline-none focus:border-emerald-500" required />
            </div>

            <div className="relative">
                <ListStart className="absolute left-5 top-5 text-zinc-500" size={16} />
                <select name="status" defaultValue={initialData?.contentJson?.status || "pending"} className="w-full bg-zinc-900 border border-zinc-800 p-5 pl-14 rounded-2xl text-sm outline-none focus:border-amber-500 appearance-none text-zinc-300">
                    <option value="pending">⏳ Beklemede (Yeni Teklif)</option>
                    <option value="negotiating">🤝 Müzakere Aşamasında</option>
                    <option value="won">🏆 Onaylandı (Kazanıldı)</option>
                </select>
            </div>
        </div>
        
        <button type="submit" disabled={loading} className="w-full bg-white text-black py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] hover:bg-zinc-200 transition-all flex items-center justify-center gap-3 mt-8">
           {loading ? "HAZIRLANIYOR..." : <><CheckCircle2 size={20} /> TEKLİFİ OLUŞTUR</>}
        </button>
      </form>
    </div>
  );
}