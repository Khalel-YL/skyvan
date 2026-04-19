import { getDbOrThrow } from "@/db/db";
import { leads } from "@/db/schema";
import { desc, isNotNull } from "drizzle-orm";
import { 
  FileSignature, Wallet, Calculator, ArrowRight, 
  FileText, Send, CheckCircle2, XCircle, PenTool
} from "lucide-react";
import { moveOfferStage } from "./actions";

export default async function OffersPage() {
  const db = getDbOrThrow();

  // SİHİR BURADA: Sadece "buildVersionId" (Atölye tasarımı) olan, yani GERÇEK teklif isteyenleri çekiyoruz.
  const rawOffers = await db.select().from(leads).where(isNotNull(leads.buildVersionId)).orderBy(desc(leads.createdAt));

  // Temsili Ciro Hesaplama (Şemanda fiyat yoksa diye, VIP lead sayısını 1.5M ₺ ortalama ile çarpıyoruz - Tamamen motive edici bir Dashboard UI için)
  const averageCaravanPrice = 1500000; 
  const totalPipelineValue = rawOffers.length * averageCaravanPrice;
  const wonValue = rawOffers.filter(o => o.status === 'converted').length * averageCaravanPrice;

  // Kanban Sütunları İçin Veriyi Parçalıyoruz
  const columns = [
    { id: 'new', title: 'Yeni Tasarımlar', icon: <PenTool className="h-4 w-4 text-blue-500" />, color: 'border-blue-500', bg: 'bg-blue-500/10' },
    { id: 'contacted', title: 'Fiyat Çalışılıyor', icon: <Calculator className="h-4 w-4 text-amber-500" />, color: 'border-amber-500', bg: 'bg-amber-500/10' },
    { id: 'converted', title: 'Onaylananlar (Kazanılan)', icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, color: 'border-green-500', bg: 'bg-green-500/10' },
    { id: 'closed', title: 'İptal / Red', icon: <XCircle className="h-4 w-4 text-zinc-600" />, color: 'border-zinc-800', bg: 'bg-zinc-900' },
  ];

  return (
    <div className="p-8 animate-in fade-in slide-in-from-bottom-8 duration-700 min-h-screen flex flex-col">
      
      {/* ÜST FİNANSAL KOKPİT */}
      <div className="flex items-center justify-between mb-10">
        <div>
           <h1 className="text-2xl font-light text-white flex items-center gap-3">
             <FileSignature className="h-6 w-6 text-amber-500" /> Teklif <span className="font-semibold">Panosu</span>
           </h1>
           <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 font-bold">Atölye Tasarımları & Finansal Huni</p>
        </div>
        
        <div className="flex gap-6">
          <div className="bg-[#0a0a0a] border border-zinc-800 px-6 py-3 rounded-2xl flex items-center gap-4">
             <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500"><Wallet className="h-5 w-5" /></div>
             <div>
               <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Borudaki Ciro (Tahmini)</p>
               <p className="text-xl font-black text-white">₺ {(totalPipelineValue / 1000000).toFixed(1)}M</p>
             </div>
          </div>
          <div className="bg-[#0a0a0a] border border-zinc-800 px-6 py-3 rounded-2xl flex items-center gap-4 border-b-2 border-b-green-500">
             <div className="p-3 bg-green-500/10 rounded-xl text-green-500"><CheckCircle2 className="h-5 w-5" /></div>
             <div>
               <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">Kazanılan Ciro</p>
               <p className="text-xl font-black text-green-500">₺ {(wonValue / 1000000).toFixed(1)}M</p>
             </div>
          </div>
        </div>
      </div>

      {/* KANBAN BOARD (SÜTUNLU YAPI) */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-8 custom-scrollbar">
        {columns.map(col => {
          const colOffers = rawOffers.filter(o => (o.status || 'new') === col.id);
          
          return (
            <div key={col.id} className="min-w-[320px] max-w-[320px] flex flex-col gap-4">
              
              {/* Sütun Başlığı */}
              <div className={`flex items-center justify-between p-4 bg-[#0a0a0a] border border-zinc-800 border-t-2 ${col.color} rounded-2xl`}>
                <div className="flex items-center gap-2">
                  {col.icon}
                  <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300">{col.title}</h3>
                </div>
                <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${col.bg}`}>{colOffers.length}</span>
              </div>

              {/* Sütun İçeriği (Kartlar) */}
              <div className="flex flex-col gap-4">
                {colOffers.map(offer => (
                  <div key={offer.id} className="bg-[#0a0a0a] border border-zinc-800/50 p-5 rounded-3xl hover:border-zinc-700 transition-all group shadow-xl">
                    
                    <div className="flex items-start justify-between mb-4">
                       <div>
                         <h4 className="font-bold text-white text-sm">{offer.fullName}</h4>
                         <p className="text-[10px] text-zinc-500 font-mono mt-1">{new Date(offer.createdAt!).toLocaleDateString('tr-TR')} - {offer.phoneNumber}</p>
                       </div>
                       {/* PDF ÜRET SİMÜLASYON BUTONU */}
                       <button className="p-2 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black rounded-lg transition-all" title="Teklif PDF'i Üret">
                         <FileText className="h-4 w-4" />
                       </button>
                    </div>

                    <div className="p-3 bg-zinc-900 rounded-xl mb-4 border border-zinc-800">
                      <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mb-1">Tasarım Kimliği</p>
                      <p className="text-xs text-blue-400 font-mono truncate">{offer.buildVersionId}</p>
                    </div>

                    {/* AŞAMA İLERLETME MOTORU */}
                    <div className="flex items-center justify-between border-t border-zinc-900 pt-4">
                       <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Aşama:</span>
                       <form action={async (formData) => {
                         'use server';
                         await moveOfferStage(offer.id, formData.get('status') as string);
                       }}>
                         <select 
                           name="status"
                           defaultValue={col.id}
                           onChange={(e) => e.target.form?.requestSubmit()}
                           className="bg-black border border-zinc-800 text-[9px] text-zinc-300 font-bold uppercase py-1.5 px-2 rounded-lg outline-none focus:border-blue-500 cursor-pointer"
                         >
                           <option value="new">Yeni Tasarım</option>
                           <option value="contacted">Fiyat Çalışılıyor</option>
                           <option value="converted">Onaylandı (Üretime Al)</option>
                           <option value="closed">Reddedildi</option>
                         </select>
                       </form>
                    </div>

                  </div>
                ))}

                {colOffers.length === 0 && (
                  <div className="border-2 border-dashed border-zinc-900 rounded-3xl p-8 flex flex-col items-center justify-center text-zinc-600">
                    <span className="text-xs font-medium italic">Bu aşamada teklif yok</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
