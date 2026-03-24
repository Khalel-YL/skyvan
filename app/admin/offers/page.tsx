import { db } from "@/db/db";
import { localizedContent } from "@/db/schema";
import { eq } from "drizzle-orm";
import { FileSignature, Plus, Clock, Handshake, Trophy, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteOffer } from "./actions"; 
import { AddOfferDrawer } from "./AddOfferDrawer"; 

export default async function OffersPage({ searchParams }: { searchParams: Promise<{ edit?: string, new?: string }> }) {
  const params = await searchParams;
  
  const allOffers = await db.select().from(localizedContent).where(eq(localizedContent.entityType, "offer"));
  const offers = allOffers.reverse();

  const isDrawerOpen = params.new === "true" || !!params.edit;
  let editData = null;
  if (params.edit) editData = allOffers.find(a => a.id === params.edit);

  // Kanban Kolonları İçin Filtreleme
  const pendingOffers = offers.filter(o => (o.contentJson as any)?.status === "pending");
  const negotiatingOffers = offers.filter(o => (o.contentJson as any)?.status === "negotiating");
  const wonOffers = offers.filter(o => (o.contentJson as any)?.status === "won");

  // Teklif Kartı Bileşeni (Görsel Şölen)
  const OfferCard = ({ offer, colorClass }: { offer: any, colorClass: string }) => (
    <div className={`bg-[#0a0a0a] border border-zinc-900 p-6 rounded-3xl relative shadow-xl hover:border-zinc-700 transition-all border-l-4 ${colorClass}`}>
      <h3 className="text-sm font-bold text-white mb-1">{offer.contentJson.leadName}</h3>
      <p className="text-xs text-zinc-500 mb-4">{offer.contentJson.caravanModel}</p>
      <p className="text-xl font-black text-white italic font-mono mb-6">₺{Number(offer.contentJson.price).toLocaleString()}</p>
      <div className="flex items-center gap-2 pt-4 border-t border-zinc-900/50">
        <Link href={`/admin/offers?edit=${offer.id}`} className="flex-1 bg-zinc-900 hover:bg-zinc-800 py-3 rounded-xl text-center text-[10px] font-black uppercase tracking-widest transition-all">Düzenle</Link>
        <form action={async () => { "use server"; await deleteOffer(offer.id); }}>
          <button className="p-3 text-zinc-700 hover:text-red-500 transition-colors bg-zinc-900 rounded-xl"><Trash2 size={16} /></button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="p-8 pb-32 min-h-screen bg-[#020202] text-white">
      
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-2xl font-black italic tracking-tighter flex items-center gap-3 uppercase">
           <FileSignature className="text-amber-500" /> Teklif & Sözleşme Panosu
        </h1>
        <Link href="/admin/offers?new=true" className="bg-white text-black px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl flex items-center gap-2">
          <Plus size={16} /> Yeni Teklif
        </Link>
      </div>

      {/* KANBAN BOARD MİMARİSİ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KOLON 1: BEKLEYENLER */}
        <div className="bg-[#050505] border border-zinc-900/50 rounded-[2.5rem] p-6 min-h-[500px]">
           <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-900">
             <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2"><Clock size={16} className="text-amber-500"/> Beklemede</h2>
             <span className="bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-xs font-bold">{pendingOffers.length}</span>
           </div>
           <div className="space-y-4">
             {pendingOffers.map(offer => <OfferCard key={offer.id} offer={offer} colorClass="border-l-amber-500" />)}
           </div>
        </div>

        {/* KOLON 2: MÜZAKERE */}
        <div className="bg-[#050505] border border-zinc-900/50 rounded-[2.5rem] p-6 min-h-[500px]">
           <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-900">
             <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2"><Handshake size={16} className="text-blue-500"/> Müzakere</h2>
             <span className="bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full text-xs font-bold">{negotiatingOffers.length}</span>
           </div>
           <div className="space-y-4">
             {negotiatingOffers.map(offer => <OfferCard key={offer.id} offer={offer} colorClass="border-l-blue-500" />)}
           </div>
        </div>

        {/* KOLON 3: ONAYLANDI */}
        <div className="bg-[#050505] border border-zinc-900/50 rounded-[2.5rem] p-6 min-h-[500px]">
           <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-900">
             <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2"><Trophy size={16} className="text-emerald-500"/> Kazanılan</h2>
             <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-bold">{wonOffers.length}</span>
           </div>
           <div className="space-y-4">
             {wonOffers.map(offer => <OfferCard key={offer.id} offer={offer} colorClass="border-l-emerald-500" />)}
           </div>
        </div>

      </div>

      {/* SİBER ÇEKMECE */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <Link href="/admin/offers" className="absolute inset-0 bg-black/95 backdrop-blur-md cursor-default"></Link>
          <div className="relative w-full max-w-[550px] h-full">
             <AddOfferDrawer initialData={editData} />
          </div>
        </div>
      )}
    </div>
  );
}