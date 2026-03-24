import { Search, Edit, Trash2, Truck } from "lucide-react";
import { db } from "@/db/db";
import { models } from "@/db/schema";
import AddModelDrawer from "./AddModelDrawer";
import { deleteModel } from "./actions";
import Link from "next/link";

export default async function ModelsPage({ searchParams }: { searchParams: { edit?: string } }) {
  const allModels = await db.select().from(models);
  
let editData: any = null;
  const params = await searchParams;

  if (params.edit) {
    editData = allModels.find((m: any) => m.id === params.edit);
  }

  return (
    <div className="p-8 animate-in fade-in duration-500 relative min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h1 className="text-2xl font-light text-white flex items-center gap-3">
             <Truck className="h-6 w-6 text-amber-500" /> Araç <span className="font-semibold">Modelleri</span>
           </h1>
           <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 font-bold">Temel Şasi ve Taşıma Kapasitesi Veritabanı</p>
        </div>
        <AddModelDrawer initialData={editData} />
      </div>

      <div className="border border-zinc-800/50 rounded-2xl overflow-hidden bg-[#0a0a0a] shadow-2xl">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-[#050505] border-b border-zinc-800/50 text-zinc-300">
            <tr>
              <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px]">Model Kodu</th>
              <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px]">Boş Ağırlık</th>
              <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px]">Max Yük</th>
              <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px]">Durum</th>
              <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px] text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {allModels.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">Sistemde henüz tanımlı bir araç şasisi bulunmuyor.</td></tr>
            )}

            {allModels.map((model) => (
              <tr key={model.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 font-mono text-xs text-amber-500 font-bold">{model.slug}</td>
                <td className="px-6 py-4 font-mono text-zinc-300">{Number(model.baseWeightKg).toFixed(0)} kg</td>
                <td className="px-6 py-4 font-mono text-blue-400">{Number(model.maxPayloadKg).toFixed(0)} kg</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${model.status === 'active' ? 'bg-green-500/10 text-green-500' : model.status === 'draft' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
                    {model.status}
                  </span>
                </td>
                
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                    <Link href={`/admin/models?edit=${model.id}`} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all" title="Düzenle">
                      <Edit className="h-4 w-4" />
                    </Link>
                    <form action={deleteModel.bind(null, model.id)}>
                      <button type="submit" className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" title="Sil">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}