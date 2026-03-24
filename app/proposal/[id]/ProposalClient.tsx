"use client";

import { useState, useTransition } from "react";
import { PenTool, PartyPopper, ShieldCheck, Loader2, Lock } from "lucide-react";
import confetti from "canvas-confetti";
import { signCaravanProposal } from "./actions"; // Büyülü fonksiyonumuz!

export default function ProposalClient({ offer, id }: { offer: any, id: string }) {
  // Eğer veritabanında "SIGNED" yazıyorsa, sayfa direkt kilitli açılsın
  const isAlreadySigned = offer.status === "SIGNED";
  
  const [signed, setSigned] = useState(isAlreadySigned);
  const [totalPrice, setTotalPrice] = useState(offer.finalPrice || Number(offer.price));
  const [extras, setExtras] = useState<string[]>(offer.selectedExtras || []);
  const [isPending, startTransition] = useTransition(); // Yükleniyor efekti için

const handleExtra = (name: string, price: number) => {
    if (signed || isAlreadySigned) return; // İmzalandıysa butonlar kilitlenir!
    
    if (extras.includes(name)) {
      setExtras(extras.filter(e => e !== name));
      setTotalPrice((prev: number) => prev - price); // TypeScript'i susturduğumuz yer
    } else {
      setExtras([...extras, name]);
      setTotalPrice((prev: number) => prev + price); // TypeScript'i susturduğumuz yer
    }
  };

  const handleSign = () => {
    if (signed || isAlreadySigned) return;

    // Arka planda Server Action çalıştırıyoruz (Veritabanı + Bildirim)
    startTransition(async () => {
      const result = await signCaravanProposal(id, totalPrice, extras);
      
      if (result.success) {
        setSigned(true);
        confetti({
          particleCount: 200,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#ffffff', '#10b981']
        });
      }
    });
  };

  return (
    <div className="space-y-12">
      {isAlreadySigned && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3 text-emerald-500 text-sm font-bold">
          <Lock size={18} /> Bu sözleşme {new Date(offer.signedAt).toLocaleDateString('tr-TR')} tarihinde mühürlenmiştir. Değişiklik yapılamaz.
        </div>
      )}

      {/* SEÇENEKLER */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
        <button 
          onClick={() => handleExtra("Lithium", 45000)}
          disabled={signed || isPending}
          className={`p-6 rounded-3xl border transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed ${extras.includes("Lithium") ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-800 bg-zinc-900/20'}`}
        >
          <h4 className="font-bold text-sm">🔋 400Ah Lityum Batarya Seti</h4>
          <p className="text-xs text-zinc-500 mt-1">+₺45.000</p>
        </button>
        <button 
          onClick={() => handleExtra("OffRoad", 32000)}
          disabled={signed || isPending}
          className={`p-6 rounded-3xl border transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed ${extras.includes("OffRoad") ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800 bg-zinc-900/20'}`}
        >
          <h4 className="font-bold text-sm">🚜 Off-Road Yükseltme Kiti</h4>
          <p className="text-xs text-zinc-500 mt-1">+₺32.000</p>
        </button>
      </div>

      {/* FİYAT VE İMZA */}
      <div className="bg-black/50 p-8 rounded-3xl border border-zinc-800/50 flex flex-col md:flex-row items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Onaylanan Proje Bedeli</p>
          <p className="text-5xl font-black text-white italic font-mono">
            ₺{totalPrice.toLocaleString()}
          </p>
        </div>
        
        {!signed ? (
          <button 
            onClick={handleSign}
            disabled={isPending}
            className="mt-6 md:mt-0 bg-white text-black px-10 py-5 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
          >
            {isPending ? (
              <><Loader2 size={18} className="animate-spin" /> Mühürleniyor...</>
            ) : (
              <><PenTool size={18} /> Teklifi Onayla & İmzala</>
            )}
          </button>
        ) : (
          <div className="mt-6 md:mt-0 flex items-center gap-3 text-emerald-500 font-black italic animate-bounce text-xl">
            <PartyPopper size={24} /> SÖZLEŞME ONAYLANDI!
          </div>
        )}
      </div>

      {signed && (
        <div className="pt-10 border-t border-zinc-900 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex justify-between items-end">
                <div className="space-y-2 print:hidden">
                    <p className="text-[10px] text-zinc-600 uppercase font-black tracking-[0.3em]">Siber Güvenlik Mührü</p>
                    <div className="flex items-center gap-2 text-emerald-500 text-xs">
                        <ShieldCheck size={16} /> 256-bit Şifreli Onay
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] text-zinc-600 uppercase font-black tracking-[0.3em] mb-4">Müşteri Dijital İmzası</p>
                    <div className="text-4xl text-amber-500 italic font-serif leading-none">{offer.leadName}</div>
                    <div className="w-64 h-[1px] bg-zinc-800 mt-4 ml-auto" />
                    <p className="text-[10px] text-zinc-500 mt-2 italic opacity-50 underline decoration-amber-500/30">SkyVan OS tarafından kalıcı olarak doğrulanmıştır.</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}