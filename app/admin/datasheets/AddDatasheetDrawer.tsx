"use client";

import { useState } from "react";
import { X, FileDigit, Link as LinkIcon, FileText } from "lucide-react";
import { saveDatasheet } from "./actions";
import Link from "next/link";

export default function AddDatasheetDrawer({ initialData, availableProducts }: { initialData?: any, availableProducts: any[] }) {
  const isEdit = !!initialData;
  const [loading, setLoading] = useState(false);

  return (
    <div className="p-8 bg-[#0a0a0a] text-white border-l border-white/5 h-full overflow-y-auto custom-scrollbar min-w-[500px] relative">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold tracking-tight">
          {isEdit ? "Dokümanı Güncelle" : "Yeni Teknik Doküman"}
        </h2>
        {isEdit && (
          <Link href="/admin/datasheets" className="p-2 bg-white/5 rounded-lg transition-colors">
            <X className="h-4 w-4 text-zinc-400" />
          </Link>
        )}
      </div>

      <form action={saveDatasheet} onSubmit={() => setLoading(true)} className="space-y-8">
        {isEdit && <input type="hidden" name="id" value={initialData.id} />}

        <div className="space-y-4">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-2">Bağlantılı Ürün (Opsiyonel)</label>
          <select 
            name="productId" 
            defaultValue={initialData?.productId} 
            className="w-full bg-[#111] border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-blue-500 font-bold text-blue-400 appearance-none cursor-pointer"
          >
            <option value="" className="bg-[#111] text-zinc-500">-- Genel Doküman (Ürüne Bağlı Değil) --</option>
            {availableProducts.map((p: any) => (
              <option key={p.id} value={p.id} className="bg-[#111] text-white">
                {p.sku} - {p.title}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-2">Doküman Başlığı</label>
          <input 
            name="title" 
            defaultValue={initialData?.title} 
            required 
            placeholder="Örn: MultiPlus-II 3000VA Datasheet" 
            className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-blue-500" 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-2">Tip</label>
            <select 
              name="docType" 
              defaultValue={initialData?.docType || "datasheet"} 
              className="w-full bg-[#111] border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-blue-500 text-white appearance-none cursor-pointer"
            >
              <option value="datasheet" className="bg-[#111] text-white">Teknik Datasheet</option>
              <option value="manual" className="bg-[#111] text-white">Kullanım Kılavuzu</option>
              <option value="rulebook" className="bg-[#111] text-white">Mühendislik Kural Kitabı</option>
            </select>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-2">PDF Linki (URL)</label>
            <input 
              name="s3Key" 
              defaultValue={initialData?.s3Key} 
              required 
              placeholder="https://..." 
              className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm outline-none focus:border-blue-500 font-mono" 
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full py-5 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.2)]"
        >
          {loading ? "Bilgi İşleniyor..." : "Dokümanı Veritabanına Mühürle"}
        </button>
      </form>
    </div>
  );
}