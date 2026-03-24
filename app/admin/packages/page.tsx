import { Edit, Trash2, Package, CheckCircle2 } from "lucide-react";
import { db } from "@/db/db";
import { packages, models } from "@/db/schema";
import { eq } from "drizzle-orm";
import AddProductDrawer from "./AddPackageDrawer"; // İsim çakışması olmasın diye kontrol et
import { deletePackage } from "./actions";
import Link from "next/link";

export default async function PackagesPage({ searchParams }: { searchParams: { edit?: string } }) {
  const allModels = await db.select().from(models);
  
  const allPackages = await db
    .select({
      id: packages.id,
      name: packages.name,
      slug: packages.slug,
      tierLevel: packages.tierLevel,
      isDefault: packages.isDefault,
      modelId: packages.modelId,
      modelSlug: models.slug,
    })
    .from(packages)
    .leftJoin(models, eq(packages.modelId, models.id));

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
             <Package className="h-6 w-6 text-amber-500" /> Donanım <span className="font-semibold">Paketleri</span>
           </h1>
           <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 font-bold">Base, Comfort ve Premium Hiyerarşisi</p>
        </div>
        
        <AddProductDrawer initialData={editData} availableModels={allModels} />
      </div>

      <div className="border border-zinc-800/50 rounded-2xl overflow-hidden bg-[#0a0a0a] shadow-2xl">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-[#050505] border-b border-zinc-800/50 text-zinc-300">
            <tr>
              <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px]">Paket Adı</th>
              <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px]">Kısa Kod</th>
              <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px]">Bağlı Araç</th>
              <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px]">Seviye</th>
              <th className="px-6 py-5 font-bold uppercase tracking-widest text-[10px] text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {allPackages.map((pkg: any) => (
              <tr key={pkg.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 flex items-center gap-2 text-white font-medium">
                  {pkg.name} {pkg.isDefault && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-zinc-400">{pkg.slug}</td>
                <td className="px-6 py-4 font-mono text-xs text-blue-400 uppercase">{pkg.modelSlug}</td>
                <td className="px-6 py-4 font-mono text-amber-500 text-xs">Tier {pkg.tierLevel}</td>
                <td className="px-6 py-4 text-right text-xs">
                  <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                    <Link href={`/admin/packages?edit=${pkg.id}`} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
                      <Edit className="h-4 w-4" />
                    </Link>
                    <form action={deletePackage.bind(null, pkg.id)}>
                      <button type="submit" className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
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