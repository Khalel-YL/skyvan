"use client";

import { useWorkshopStore } from "../store/workshopStore";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

type WorkshopSelectorModel = {
  id: string;
  baseWeightKg: string | number;
  maxPayloadKg: string | number;
};

type WorkshopSelectorPackage = {
  id: string;
  slug: string;
  isDefault: boolean | null;
};

export default function WorkshopSelector({
  models,
  packages,
}: {
  models: WorkshopSelectorModel[];
  packages: WorkshopSelectorPackage[];
}) {
  const { selectedModel, selectedPackage, setModel, setPackage } = useWorkshopStore();
  const router = useRouter();

  // Her ikisi de seçildiyse butonu aktif et
  const isReady = selectedModel && selectedPackage;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative pb-24">
      
      {/* ARAÇ MODELİ KARTLARI */}
      <div className="col-span-1 lg:col-span-2 space-y-6">
        {models.map((model) => {
          const isSelected = selectedModel === model.id;
          return (
            <div 
              key={model.id} 
              onClick={() => setModel(model.id)}
              className={`border rounded-2xl p-8 transition-all cursor-pointer group relative overflow-hidden ${isSelected ? 'bg-white/10 border-white shadow-[0_0_30px_rgba(255,255,255,0.1)]' : 'bg-[#111] border-white/10 hover:border-white/30'}`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-skyvan-accent/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
              
              <div className="flex items-center justify-between mb-8">
                <div className="text-sm font-mono text-skyvan-muted bg-white/5 px-3 py-1 rounded-md">BAZA ARAÇ</div>
                {isSelected && <CheckCircle2 className="h-6 w-6 text-white animate-in zoom-in" />}
              </div>
              
              <h3 className="text-3xl font-bold text-white mb-2">Fiat Ducato 15m³</h3>
              <p className="text-skyvan-muted mb-8 max-w-md">Geniş iç hacmi ve ideal dingil mesafesiyle karavan dönüşümü için endüstri standardı.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/50 border border-white/5 rounded-xl p-4">
                  <div className="text-xs text-skyvan-muted mb-1">Boş Ağırlık</div>
                  <div className="text-lg font-mono text-white">{Number(model.baseWeightKg).toFixed(0)} kg</div>
                </div>
                <div className="bg-black/50 border border-white/5 rounded-xl p-4">
                  <div className="text-xs text-skyvan-muted mb-1">Max Taşıma Kapasitesi</div>
                  <div className="text-lg font-mono text-white">{Number(model.maxPayloadKg).toFixed(0)} kg</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* PAKETLER KARTLARI */}
      <div className="col-span-1 flex flex-col gap-4">
        {packages.map((pkg) => {
          const isSelected = selectedPackage === pkg.id;
          return (
            <div 
              key={pkg.id} 
              onClick={() => setPackage(pkg.id)}
              className={`p-6 rounded-2xl border cursor-pointer transition-all relative ${isSelected ? 'bg-white/10 border-white shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'bg-[#111] border-white/10 hover:border-white/30'}`}
            >
              {isSelected && <CheckCircle2 className="absolute top-6 right-6 h-5 w-5 text-white animate-in zoom-in" />}
              <div className="flex items-center gap-3 mb-4">
                <h4 className="text-lg font-bold text-white">
                  {pkg.slug === 'base-paket' ? 'Base Paket' : 'Premium Paket'}
                </h4>
                {pkg.isDefault && !isSelected && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
              </div>
              <p className="text-sm text-skyvan-muted pr-6">
                {pkg.slug === 'base-paket' ? 'Minimalist ve organik modern bir yaşam için temel donanımlar.' : 'Tam off-grid yeteneği ve üst düzey enerji bağımsızlığı.'}
              </p>
            </div>
          );
        })}
      </div>

      {/* İLERLEME BUTONU (Sadece ikisi de seçilince görünür) */}
      {isReady && (
        <div className="fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-md border-t border-white/10 p-6 flex justify-center z-50 animate-in slide-in-from-bottom-full duration-500">
          <button 
            onClick={() => router.push('/tasarla/atolye')}
            className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full font-bold hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            Atölyeye Gir (Donanım Seçimi) <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}

    </div>
  );
}
