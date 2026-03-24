import { Edit, Trash2, FileDigit, BrainCircuit, ExternalLink } from "lucide-react";
import { db } from "@/db/db";
import { aiKnowledgeDocuments, products, localizedContent } from "@/db/schema";
import { eq } from "drizzle-orm";
import AddDatasheetDrawer from "./AddDatasheetDrawer";
import { deleteDatasheet } from "./actions";
import Link from "next/link";

export default async function DatasheetsPage({ searchParams }: { searchParams: { edit?: string } }) {
  const allProducts = await db.select({ id: products.id, sku: products.sku, title: localizedContent.title })
    .from(products).leftJoin(localizedContent, eq(products.id, localizedContent.entityId));
  
  const allDocs = await db.select().from(aiKnowledgeDocuments);

let editData: any = null;
const params = await searchParams; // <--- İŞTE BU SATIRI EKLEDİK

if (params.edit) {
  editData = allDocs.find(d => d.id === params.edit);
}

  return (
    <div className="p-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
           <h1 className="text-2xl font-light text-white flex items-center gap-3">
             <FileDigit className="h-6 w-6 text-blue-500" /> Datasheet <span className="font-semibold">Merkezi</span>
           </h1>
           <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 font-bold italic">AI Bilgi Tabanı ve Onaylı Dokümanlar</p>
        </div>
        <AddDatasheetDrawer initialData={editData} availableProducts={allProducts} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allDocs.map((doc: any) => (
          <div key={doc.id} className="bg-[#0a0a0a] border border-zinc-800/50 p-6 rounded-[2rem] hover:border-blue-500/30 transition-all group relative overflow-hidden">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/admin/datasheets?edit=${doc.id}`} className="p-2 bg-zinc-900 rounded-lg hover:text-white"><Edit className="h-4 w-4" /></Link>
                <form action={deleteDatasheet.bind(null, doc.id)}><button className="p-2 bg-zinc-900 rounded-lg hover:text-red-500"><Trash2 className="h-4 w-4" /></button></form>
              </div>
            </div>
            <h3 className="text-white font-bold mb-1 truncate pr-12">{doc.title}</h3>
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-tighter">{doc.docType}</span>
            
            <div className="mt-6 flex items-center justify-between pt-6 border-t border-zinc-900">
              <div className="flex flex-col">
                 <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Analiz Durumu</span>
                 <span className="text-[10px] text-amber-500 font-mono italic">{doc.parsingStatus}</span>
              </div>
              <a href={doc.s3Key} target="_blank" className="p-3 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-colors">
                 <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}