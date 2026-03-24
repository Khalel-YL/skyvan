import { db } from "@/db/db";
import { localizedContent } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Target, Wallet, Activity, Trash2, Zap, Plus } from "lucide-react";
import Link from "next/link";
import { deleteLead } from "./action"; 
// DİKKAT: Süslü parantez içine aldık!
import { AddLeadDrawer } from "./AddLeadDrawer"; 

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ edit?: string, new?: string }> }) {
  const params = await searchParams;
  
  const allLeads = await db.select().from(localizedContent).where(eq(localizedContent.entityType, "lead"));
  const leads = allLeads.reverse();

  const isDrawerOpen = params.new === "true" || !!params.edit;
  
  let editData = null;
  if (params.edit) {
    editData = allLeads.find(a => a.id === params.edit);
  }

  const totalBudget = leads.reduce((a,c) => a + (Number((c.contentJson as any).budget) || 0), 0);

  return (
    <div className="p-8 pb-32 min-h-screen bg-[#020202] text-white">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
         <div className="bg-[#080808] border border-zinc-900 p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl border-b-4 border-b-blue-600">
            <Target className="absolute -right-4 -top-4 opacity-5 text-blue-500" size={120} />
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2">Aktif Radar</p>
            <h4 className="text-4xl font-black">{leads.length}</h4>
         </div>
         <div className="bg-[#080808] border border-zinc-900 p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl border-b-4 border-b-emerald-600">
            <Wallet className="absolute -right-4 -top-4 opacity-5 text-emerald-500" size={120} />
            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mb-2">Tahmini Hacim</p>
            <h4 className="text-4xl font-black text-emerald-400">₺{totalBudget.toLocaleString()}</h4>
         </div>
      </div>

      <div className="flex items-center justify-between mb-10">
        <h1 className="text-2xl font-black italic tracking-tighter flex items-center gap-3 uppercase">
           <Zap className="text-blue-500 fill-blue-500" /> CRM Intelligence
        </h1>
        <Link href="/admin/leads?new=true" className="bg-white text-black px-10 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-2">
          <Plus size={16} /> Yeni Lead Tanımla
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {leads.map((lead) => {
          const info = lead.contentJson as any;
          return (
            <div key={lead.id} className="bg-[#080808] border border-zinc-900 p-8 rounded-[3rem] group hover:border-zinc-700 transition-all relative shadow-xl border-l-4 border-l-transparent hover:border-l-blue-500">
              <div className="flex items-start justify-between mb-6">
                 <h3 className="text-lg font-bold text-white tracking-tight leading-tight">{lead.title}</h3>
                 <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500"><Activity size={20} /></div>
              </div>
              <p className="text-2xl font-black text-white mb-8 italic font-mono">₺{Number(info.budget).toLocaleString()}</p>
              
              <div className="flex items-center gap-2 pt-6 border-t border-zinc-900">
                <Link href={`/admin/leads?edit=${lead.id}`} className="flex-1 bg-zinc-900 hover:bg-zinc-800 p-4 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest transition-all">Analiz</Link>
                <form action={async () => { "use server"; await deleteLead(lead.id); }}>
                  <button className="p-4 text-zinc-800 hover:text-red-500 transition-colors active:scale-90"><Trash2 size={18} /></button>
                </form>
              </div>
            </div>
          );
        })}
      </div>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <Link href="/admin/leads" className="absolute inset-0 bg-black/95 backdrop-blur-md cursor-default"></Link>
          <div className="relative w-full max-w-[550px] h-full">
             <AddLeadDrawer initialData={editData} />
          </div>
        </div>
      )}
    </div>
  );
}