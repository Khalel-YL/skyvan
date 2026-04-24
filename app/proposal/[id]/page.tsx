import { getDbOrThrow } from "@/db/db";
import { localizedContent } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Compass, Zap } from "lucide-react";
import { notFound } from "next/navigation";
import ProposalClient from "./ProposalClient"; // Standart ve tertemiz import

export default async function ProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const db = getDbOrThrow();
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  const offerData = await db.select().from(localizedContent).where(eq(localizedContent.id, id));
  if (!offerData || offerData.length === 0) return notFound();
  const offer = offerData[0].contentJson as any;

  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-amber-500/30">
        <div className="max-w-4xl mx-auto p-8 md:p-16 animate-in fade-in duration-1000">
            <header className="flex items-center justify-between border-b border-zinc-900 pb-8 mb-12">
                <h1 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-3 italic">
                    <Compass className="text-amber-500" size={32} /> SKYVAN OS
                </h1>
                <p className="text-xs text-zinc-600 font-mono">ID: {id.split("-")[0].toUpperCase()}</p>
            </header>

            <div className="bg-[#080808] border border-zinc-900 rounded-[3rem] p-10 md:p-16 mb-12 relative overflow-hidden shadow-2xl">
                <Zap className="absolute -right-10 -top-10 opacity-5 text-amber-500" size={250} />
                <h2 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-4">Sayın {offer.leadName},</h2>
                <p className="text-2xl md:text-4xl font-light leading-tight text-zinc-300 mb-10">
                    <strong className="text-white font-black">{offer.caravanModel}</strong> projenizi kişiselleştirebilir ve aşağıdan onaylayabilirsiniz.
                </p>

                {/* İşte o canlı, etkileşimli parça! */}
                <ProposalClient offer={offer} id={id} />
            </div>
            
            <footer className="text-center opacity-20 text-[10px] uppercase tracking-[0.5em] mt-10">
                Digital Brain Ecosystem
            </footer>
        </div>
    </div>
  );
}
