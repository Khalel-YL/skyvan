"use client";

import { useState } from "react";
import { Plus, Trash2, ShieldAlert, Image as ImageIcon, FileText, X } from "lucide-react";
import { createPermanentProduct, updatePermanentProduct } from "./actions"; 
import Link from "next/link";

export default function AddProductDrawer({ initialData }: { initialData?: any }) {
  const isEdit = !!initialData; 
  
  const [specs, setSpecs] = useState(
    initialData?.specs?.length > 0 
      ? initialData.specs.map((s: any) => ({ key: s.specKey, value: s.specValue, unit: s.unit })) 
      : [{ key: "WATTS", value: "", unit: "W" }]
  );
  
  const [loading, setLoading] = useState(false);

  const updateSpec = (index: number, field: string, value: string) => {
    const newSpecs = [...specs];
    newSpecs[index] = { ...newSpecs[index], [field as keyof typeof newSpecs[0]]: value };
    setSpecs(newSpecs);
  };

  const addSpec = () => setSpecs([...specs, { key: "", value: "", unit: "" }]);
  
  // HATA ÇÖZÜMÜ BURADA: _: any ve i: number eklendi
  const removeSpec = (index: number) => setSpecs(specs.filter((_: any, i: number) => i !== index));

  return (
    <div className="p-8 bg-[#0a0a0a] text-white border-l border-white/5 h-full overflow-y-auto custom-scrollbar min-w-[550px] relative">
      
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold tracking-tight">
          {isEdit ? "Ürünü Güncelle" : "Yeni Ürün & Mühendislik Kaydı"}
        </h2>
        {isEdit && (
          <Link href="/admin/products" className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
            <X className="h-4 w-4 text-zinc-400" />
          </Link>
        )}
      </div>

      <form action={isEdit ? updatePermanentProduct : createPermanentProduct} onSubmit={() => setLoading(true)}>
        
        {isEdit && <input type="hidden" name="id" value={initialData.id} />}

        <div className="space-y-6 mb-12">
          <div className="grid grid-cols-2 gap-4">
            <input name="title" defaultValue={initialData?.title} required placeholder="Ürün Adı" className="bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-blue-500 font-bold" />
            <input name="sku" defaultValue={initialData?.sku} required placeholder="SKU (Kod)" className="bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-blue-500 font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input name="price" defaultValue={initialData?.basePrice} required placeholder="Fiyat (₺)" type="number" step="0.01" className="bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-amber-500" />
            <input name="weight" defaultValue={initialData?.weightKg} required placeholder="Ağırlık (kg)" type="number" step="0.01" className="bg-white/5 border border-white/10 p-3 rounded-lg text-sm outline-none focus:border-blue-500" />
          </div>
        </div>

        <div className="mb-12 space-y-4 p-5 bg-white/[0.02] border border-white/5 rounded-xl">
           <div className="relative">
              <ImageIcon className="absolute left-3 top-3 h-4 w-4 text-white/30" />
              <input name="imageUrl" defaultValue={initialData?.imageUrl} type="url" placeholder="Görsel URL Bağlantısı" className="w-full bg-black/50 border border-white/10 p-3 pl-10 rounded-lg text-xs outline-none focus:border-blue-500" />
           </div>
           <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-blue-500/50" />
              <input name="datasheetUrl" defaultValue={initialData?.datasheetUrl} type="url" placeholder="Datasheet PDF URL" className="w-full bg-black/50 border border-white/10 p-3 pl-10 rounded-lg text-xs outline-none focus:border-blue-500" />
           </div>
        </div>

        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase">Teknik Spesifikasyonlar</h3>
            <button type="button" onClick={addSpec} className="text-blue-400 hover:text-blue-300 text-[10px] font-bold flex items-center gap-1 transition-colors">
              <Plus className="h-3 w-3" /> DEĞER EKLE
            </button>
          </div>
          
          <div className="space-y-3">
            {/* HATA ÇÖZÜMÜ BURADA: spec: any ve index: number eklendi */}
            {specs.map((spec: any, index: number) => (
              <div key={index} className="flex gap-2 animate-in fade-in slide-in-from-right-4 duration-500">
                <input value={spec.key} onChange={(e) => updateSpec(index, "key", e.target.value)} placeholder="WATTS" className="flex-1 bg-white/5 border border-white/5 p-2 rounded text-[10px] uppercase font-mono outline-none focus:border-blue-500" />
                <input type="number" value={spec.value} onChange={(e) => updateSpec(index, "value", e.target.value)} placeholder="Değer" className="w-24 bg-white/5 border border-white/5 p-2 rounded text-[10px] outline-none focus:border-blue-500" />
                <input value={spec.unit} onChange={(e) => updateSpec(index, "unit", e.target.value)} placeholder="Birim" className="w-16 bg-white/5 border border-white/5 p-2 rounded text-[10px] outline-none focus:border-blue-500" />
                <button type="button" onClick={() => removeSpec(index)} className="p-2 text-white/20 hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          
          <input type="hidden" name="specsData" value={JSON.stringify(specs)} />
        </div>

        <button type="submit" disabled={loading} className={`w-full py-5 text-black rounded-xl font-bold tracking-[0.2em] text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${isEdit ? "bg-amber-400 hover:bg-amber-300" : "bg-white hover:bg-neutral-200"}`}>
          {loading ? "Yazılıyor..." : isEdit ? "Değişiklikleri Güncelle" : "Mühendislik Verisiyle Kaydet"}
        </button>
      </form>
    </div>
  );
}