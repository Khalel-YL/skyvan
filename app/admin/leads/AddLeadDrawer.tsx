"use client";

import { useState } from "react";
import { X, Zap, CheckCircle2, Bot, Wallet } from "lucide-react";
import { saveLead } from "./action"; 
import { useRouter } from "next/navigation";

// DİKKAT: Burada 'default' yok, doğrudan export function diyoruz.
export function AddLeadDrawer({ initialData }: { initialData?: any }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <div className="h-full bg-black text-white p-8 flex flex-col border-l border-zinc-900 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-500">
      <div className="flex items-center justify-between mb-10 shrink-0 border-b border-zinc-900 pb-6">
        <h2 className="text-xl font-black uppercase italic text-blue-500 flex items-center gap-3">
          <Zap size={22} className="fill-blue-500" /> Siber Lead Girişi
        </h2>
        <button onClick={() => router.push("/admin/leads")} className="p-2 hover:bg-zinc-800 rounded-full transition-colors"><X size={24} /></button>
      </div>

      <form action={saveLead} onSubmit={() => setLoading(true)} className="space-y-6">
        <input type="hidden" name="id" value={initialData?.id || ""} />
        
        <div className="bg-blue-600/5 border border-blue-500/20 p-5 rounded-3xl">
           <div className="flex items-center gap-2 mb-3 text-[10px] font-black text-blue-400 uppercase tracking-widest">
             <Bot size={14} /> AI Müşteri Analizi
           </div>
           <textarea name="notes" defaultValue={initialData?.contentJson?.notes} placeholder="Müşteri taleplerini buraya yaz..." className="w-full bg-transparent border-none text-sm text-zinc-300 focus:ring-0 min-h-[100px] resize-none p-0 outline-none" />
        </div>

        <div className="space-y-4">
            <input name="name" defaultValue={initialData?.title} placeholder="Müşteri Adı Soyadı" className="w-full bg-zinc-900 border border-zinc-800 p-5 rounded-2xl text-sm outline-none focus:border-blue-500" required />
            <input name="phone" defaultValue={initialData?.contentJson?.phone} placeholder="İletişim Numarası" className="w-full bg-zinc-900 border border-zinc-800 p-5 rounded-2xl text-sm outline-none focus:border-blue-500" />
            <div className="relative">
                <Wallet className="absolute left-5 top-5 text-emerald-500/50" size={16} />
                <input name="budget" type="number" defaultValue={initialData?.contentJson?.budget} placeholder="Bütçe ₺" className="w-full bg-zinc-900 border border-emerald-500/20 p-5 pl-14 rounded-2xl text-sm text-emerald-400 font-mono outline-none focus:border-emerald-500" />
            </div>
        </div>
        
        <button type="submit" disabled={loading} className="w-full bg-white text-black py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.4em] hover:bg-zinc-200 transition-all flex items-center justify-center gap-3">
           {loading ? "İŞLENİYOR..." : <><CheckCircle2 size={20} /> VERİLERİ MÜHÜRLE</>}
        </button>
      </form>
    </div>
  );
}