"use client";

import { useState, useMemo } from "react";
import { 
  Plus, Minus, Zap, ArrowLeft, Sun, 
  Settings2, Activity, CheckCircle2, 
  AlertOctagon, Box, BrainCircuit, Truck, ShieldAlert, Check, Hammer
} from "lucide-react";
import Link from "next/link";
import { saveEngineeringBuild } from "./actions"; // Kayıt motoru

export default function ConfiguratorClient({ dbProducts, dbModels }: { dbProducts: any[], dbModels: any[] }) {
  
  // --- SİSTEM STATE'LERİ ---
  const [activeVehicle, setActiveVehicle] = useState<any | null>(null);
  const [cart, setCart] = useState<{ product: any; quantity: number }[]>([]);
  const [isApproved, setIsApproved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const availableModels = dbModels && dbModels.length > 0 ? dbModels : [];

  // --- 🧠 MÜHENDİSLİK HESAPLAMA MOTORU ---
  const stats = useMemo(() => {
    let weight = activeVehicle ? Number(activeVehicle.baseWeightKg || 2100) : 0; 
    let solarW = 0, dcdcA = 0, acdcA = 0, genW = 0;
    let batteryAh = 0, inverterW = 0, mpptA = 0;
    
    cart.forEach(item => {
      const p = item.product;
      const q = item.quantity;
      const t = (p.title || p.name || p.sku || "").toLowerCase();

      weight += Number(p.weightKg || 0) * q;

      // Güneş Paneli Tespiti (victron-bs ve standart paneller)
      if (/solar|panel|monokristal|polikristal|güneş|pv|-bs-/i.test(t)) {
          solarW += (Number(t.match(/(\d+)\s*w/i)?.[1]) || 0) * q;
      }
      if (/dcdc|orion|dc to dc|alternatör/i.test(t)) dcdcA += (Number(t.match(/(\d+)\s*a/i)?.[1]) || 0) * q;
      if (/mppt|şarj kontrol/i.test(t)) mpptA += (Number(t.match(/(\d+)\s*a/i)?.[1]) || 0) * q;
      if (/akü|lifepo4|lithium|jel|battery/i.test(t)) batteryAh += (Number(t.match(/(\d+)\s*ah/i)?.[1]) || 0) * q;
      if (/inverter|multiplus|phoenix/i.test(t)) {
          inverterW += (Number(t.match(/(\d{3,4})\s*w/i)?.[1]) || Number(t.match(/(\d{3,4})\s*va/i)?.[1]) || 0) * q;
      }
    });

    return { weight, solarW, dcdcA, acdcA, genW, batteryAh, inverterW, mpptA };
  }, [cart, activeVehicle]);

  // --- 🤖 AI ANALİZ MOTORU ---
  const aiInsights = useMemo(() => {
    const insights: any[] = [];
    if (!activeVehicle) return insights;
    const systemVoltage = 12; 

    if (stats.inverterW > 0) {
      const maxDrawAmps = Math.ceil(stats.inverterW / systemVoltage);
      let cableRec = maxDrawAmps > 200 ? "2x 50mm²" : maxDrawAmps > 100 ? "50mm²" : "35mm²";
      insights.push({ 
        type: "info", 
        title: "Kablolama Reçetesi", 
        message: `${stats.inverterW}W yük için minimum ${cableRec} DC kablo kullanılmalıdır.` 
      });
    }

    if (stats.solarW > 0 && stats.mpptA === 0) {
      insights.push({ 
        type: "critical", 
        title: "Eksik Bileşen: MPPT", 
        message: `${stats.solarW}W Güneş paneli tespit edildi ancak sistemi yönetecek MPPT seçilmedi.` 
      });
    }
    return insights;
  }, [stats, activeVehicle]);

  const maxAllowedWeight = activeVehicle ? (Number(activeVehicle.baseWeightKg) + Number(activeVehicle.maxPayloadKg || 1400)) : 3500;
  const hasCriticalError = stats.weight > maxAllowedWeight || aiInsights.some(i => i.type === "critical");

  // --- SEPET FONKSİYONLARI ---
  const handleAddItem = (product: any) => setCart(prev => {
    const existing = prev.find(item => item.product.id === product.id);
    if (existing) return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
    return [...prev, { product, quantity: 1 }];
  });

  const handleRemoveItem = (productId: string) => setCart(prev => {
    const existing = prev.find(item => item.product.id === productId);
    if (existing && existing.quantity > 1) return prev.map(item => item.product.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
    return prev.filter(item => item.product.id !== productId);
  });

  return (
    <>
      <style jsx global>{`
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #000; }
        ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}</style>

      {/* EKRAN 1: ŞASİ SEÇİM ALANI */}
      {!activeVehicle ? (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
          <div className="mb-14 text-center">
            <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <Hammer className="h-10 w-10 text-blue-500" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">SkyVan <span className="text-blue-500">Atölye</span></h1>
            <p className="text-xs text-zinc-500 uppercase tracking-[0.3em] font-mono">Üretim Hattı Başlatılıyor</p>
          </div>

          <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8">
            {availableModels.map((model: any) => (
              <div 
                key={model.id} 
                onClick={() => setActiveVehicle(model)}
                className="bg-zinc-950 border border-zinc-900 hover:border-blue-500 p-10 rounded-[2.5rem] cursor-pointer transition-all group"
              >
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-4 block">{model.brand} Platform</span>
                <h2 className="text-2xl font-bold mb-8 text-zinc-100 group-hover:text-white transition-colors">{model.name}</h2>
                <div className="space-y-4 mb-10 flex-1">
                    <div className="flex justify-between border-b border-zinc-900 pb-3 text-sm text-zinc-500"><span>Boş Kütle</span><span className="text-zinc-100 font-mono font-bold">{model.baseWeightKg} KG</span></div>
                    <div className="flex justify-between text-sm text-zinc-500 font-bold"><span>Üst Limit</span><span className="text-red-500 font-mono">{(Number(model.baseWeightKg) + Number(model.maxPayloadKg || 1400))} KG</span></div>
                </div>
                <div className="pt-6 border-t border-zinc-900 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-bold uppercase tracking-widest">Hattı Seç</span><ArrowLeft className="h-4 w-4 rotate-180" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (

      /* EKRAN 2: ATÖLYE ANA KOKPİT */
        <div className="h-screen w-full bg-black text-white flex flex-col overflow-hidden font-sans">
          
          {/* TOP NAVIGATION */}
          <header className="h-16 shrink-0 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between px-8 z-50">
            <div className="flex items-center gap-5">
              <button onClick={() => setActiveVehicle(null)} className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 p-2.5 rounded-xl transition-all"><ArrowLeft className="h-5 w-5 text-zinc-400" /></button>
              <div className="h-6 w-px bg-zinc-800"></div>
              <h1 className="text-[11px] font-bold tracking-widest uppercase">SkyVan Atölye <span className="text-blue-500 ml-1">OS</span></h1>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2.5 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <Truck className="h-4 w-4 text-blue-500" /><span className="text-[10px] font-bold text-zinc-300 uppercase tracking-tighter">{activeVehicle.name}</span>
                </div>
                <div className="flex items-center gap-2.5 text-green-500 px-4 py-2"><BrainCircuit className="h-4 w-4" /><span className="text-[10px] font-mono tracking-widest uppercase">AI_CORE_SYNC</span></div>
            </div>
          </header>

          <div className="flex flex-1 flex-row h-[calc(100vh-64px)] w-full overflow-hidden bg-black">
            
            {/* SOL PANEL: ÜRÜN KONFIGÜRASYONU */}
            <div className="flex-1 overflow-y-auto p-8 lg:p-12 border-r border-zinc-900 custom-scrollbar">
              <div className="max-w-4xl mx-auto space-y-4 pb-12">
                {dbProducts.map(product => {
                  const quantity = cart.find(item => item.product.id === product.id)?.quantity || 0;
                  const title = product.title || product.name || product.sku || 'Donanım Kalemi';
                  return (
                    <div key={product.id} className={`bg-zinc-950 border ${quantity > 0 ? 'border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.05)] bg-zinc-900/50' : 'border-zinc-900 hover:border-zinc-800'} rounded-[1.5rem] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all`}>
                      <div className="flex-1 pr-4">
                        <div className="text-[10px] font-bold text-zinc-600 mb-2 uppercase tracking-widest">{product.sku}</div>
                        <h3 className="text-base font-bold text-zinc-200 mb-3">{title}</h3>
                        <div className="flex gap-4 items-center">
                            <span className="text-xs text-zinc-500 flex items-center gap-1.5 bg-black px-3 py-1.5 rounded-lg border border-zinc-900"><Box className="h-3.5 w-3.5 text-zinc-600" /> {product.weightKg || 0} KG</span>
                            <span className="text-xs text-zinc-500 flex items-center gap-1.5 bg-black px-3 py-1.5 rounded-lg border border-zinc-900"><Zap className="h-3.5 w-3.5 text-amber-500" /> {Number(product.basePrice || 0).toLocaleString('tr-TR')} ₺</span>
                        </div>
                      </div>
                      <div className="shrink-0 ml-6">
                        {quantity > 0 ? (
                            <div className="flex items-center gap-2 bg-black border border-zinc-900 rounded-xl p-1.5 shadow-inner">
                                <button onClick={() => handleRemoveItem(product.id)} className="p-2.5 bg-zinc-900 rounded-lg text-zinc-500 hover:text-white transition-all"><Minus className="h-4 w-4"/></button>
                                <span className="w-10 text-center text-lg font-mono font-bold text-blue-500">{quantity}</span>
                                <button onClick={() => handleAddItem(product)} className="p-2.5 bg-zinc-900 rounded-lg text-zinc-500 hover:text-white transition-all"><Plus className="h-4 w-4"/></button>
                            </div>
                        ) : (
                            <button onClick={() => handleAddItem(product)} className="px-8 py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl text-[10px] font-bold tracking-widest uppercase border border-zinc-800 transition-all">Sisteme Dahil Et</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SAĞ PANEL: ATÖLYE TELEMETRİSİ */}
            <aside className="w-[420px] shrink-0 bg-zinc-950 flex flex-col h-full relative z-40 border-l border-zinc-900 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <h2 className="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 mb-8 border-b border-zinc-900 pb-4 flex items-center gap-3"><Settings2 className="h-5 w-5 text-blue-500"/> Atölye Telemetrisi</h2>

                {/* KÜTLE ANALİZİ */}
                <div className="bg-black border border-zinc-900 p-7 rounded-[2rem] mb-6 shadow-inner relative overflow-hidden">
                    <div className="flex justify-between items-center mb-5 relative z-10">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Kütle İndeksi</span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded bg-zinc-950 border border-zinc-900 ${stats.weight > maxAllowedWeight ? 'text-red-500' : 'text-blue-500'}`}>MAX {maxAllowedWeight}</span>
                    </div>
                    <div className="text-5xl font-mono font-bold text-white mb-5 relative z-10 tracking-tighter">
                        {stats.weight.toLocaleString('tr-TR')} <span className="text-sm text-zinc-600 font-sans tracking-widest uppercase ml-1">KG</span>
                    </div>
                    <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-900 relative z-10">
                        <div className={`h-full transition-all duration-1000 ${stats.weight > maxAllowedWeight ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min((stats.weight / maxAllowedWeight) * 100, 100)}%` }}></div>
                    </div>
                </div>

                {/* ENERJİ VERİLERİ */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-black border border-zinc-900 p-6 rounded-[1.5rem] shadow-inner text-center">
                        <div className="text-[10px] font-bold text-zinc-600 uppercase mb-3 flex items-center justify-center gap-2"><Sun className="h-4 w-4 text-amber-500"/> Solar PV</div>
                        <div className="text-3xl font-mono font-bold text-amber-500 tracking-tighter">{stats.solarW}W</div>
                    </div>
                    <div className="bg-black border border-zinc-900 p-6 rounded-[1.5rem] shadow-inner text-center">
                        <div className="text-[10px] font-bold text-zinc-600 uppercase mb-3 flex items-center justify-center gap-2"><Activity className="h-4 w-4 text-blue-500"/> Sürüş Şarjı</div>
                        <div className="text-3xl font-mono font-bold text-blue-500 tracking-tighter">{stats.dcdcA}A</div>
                    </div>
                </div>

                {/* AI MÜHENDİSLİK ANALİZİ */}
                {cart.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-5 flex items-center gap-3"><BrainCircuit className="h-5 w-5 text-blue-500" /> AI Mühendislik Kontrolü</h3>
                    <div className="space-y-3">
                      {aiInsights.length === 0 ? (
                         <div className="p-5 bg-black border border-zinc-900 rounded-[1.25rem] border-l-4 border-l-green-600/50 shadow-inner">
                            <p className="text-[10px] text-zinc-400 uppercase tracking-widest flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-500" /> Mühendislik standartları uygun
                            </p>
                         </div>
                      ) : (
                        aiInsights.map((insight, idx) => (
                          <div key={idx} className={`p-5 rounded-[1.25rem] border ${insight.type === "critical" ? "bg-red-950/20 border-red-900/50 border-l-4 border-l-red-500" : "bg-blue-950/20 border-blue-900/50 border-l-4 border-l-blue-500"}`}>
                            <div className="flex items-center gap-2.5 mb-2">
                              {insight.type === "critical" ? <ShieldAlert className="h-5 w-5 text-red-500" /> : <Check className="h-4 w-4 text-blue-400" />}
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${insight.type === "critical" ? "text-red-500" : "text-blue-400"}`}>{insight.title}</span>
                            </div>
                            <p className={`text-[11px] leading-relaxed ${insight.type === "critical" ? "text-red-200/70" : "text-blue-200/70"}`}>{insight.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* FOOTER: FİYAT VE KAYIT BUTONU */}
              <div className="shrink-0 p-8 border-t border-zinc-900 bg-zinc-950">
                <div className="flex justify-between items-end mb-6">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Atölye Bütçesi</span>
                        <span className="text-[9px] text-blue-500 font-bold uppercase tracking-widest font-mono">ESTIMATE_CALC</span>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-mono font-bold text-white tracking-tighter">
                            {cart.reduce((sum, item) => sum + (Number(item.product.basePrice) * item.quantity), 0).toLocaleString('tr-TR')}
                        </span>
                        <span className="text-sm text-zinc-600 ml-1.5 font-sans tracking-widest">₺</span>
                    </div>
                </div>
                
                <button 
                    disabled={hasCriticalError || isSaving}
                    onClick={async () => {
                        setIsSaving(true);
                        const totalPrice = cart.reduce((sum, item) => sum + (Number(item.product.basePrice) * item.quantity), 0);
                        
                        const result = await saveEngineeringBuild({
                          vehicleId: activeVehicle.id,
                          cart: cart,
                          stats: stats,
                          totalPrice: totalPrice
                        });

                        if (result.success) {
                          setIsApproved(true);
                          setIsSaving(false);
                          // ZORLAMALI YÖNLENDİRME (PENCERE SEVİYESİNDE)
                          setTimeout(() => { 
                            window.location.href = `/offer/${result.shortCode}`; 
                          }, 1000);
                        } else {
                          alert("Kayıt Hatası: " + result.error);
                          setIsSaving(false);
                        }
                    }}
                    className={`w-full py-5 rounded-[1.25rem] font-bold text-[11px] tracking-[0.3em] uppercase transition-all duration-500 flex items-center justify-center gap-3 border shadow-2xl ${
                        hasCriticalError ? "bg-red-950/40 text-red-500 border-red-900 cursor-not-allowed" :
                        isApproved ? "bg-green-600 text-white border-green-500" : 
                        "bg-white text-black border-white hover:bg-zinc-200 active:scale-[0.98]"
                    }`}
                >
                    {hasCriticalError ? <><AlertOctagon className="h-5 w-5" /> Onay Kilitli</> : 
                     isSaving ? <span className="animate-pulse">Atölye Verisi Yazılıyor...</span> :
                     isApproved ? <><CheckCircle2 className="h-5 w-5" /> Kayıt Başarılı</> : "Atölye Projesini Onayla"}
                </button>
              </div>
            </aside>
          </div>
        </div>
      )}
    </>
  );
}