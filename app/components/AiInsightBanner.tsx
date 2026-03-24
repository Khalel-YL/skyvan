import { Cpu, Wrench } from "lucide-react";

interface AiInsightBannerProps {
  message: string;
  onFix: () => void;
}

export default function AiInsightBanner({ message, onFix }: AiInsightBannerProps) {
  return (
    <div className="mb-6 flex items-start gap-4 rounded-xl border border-skyvan-warning/30 bg-skyvan-warning/10 p-4 animate-in fade-in slide-in-from-top-4 duration-500">
      
      {/* AI İkonu */}
      <div className="flex shrink-0 items-center justify-center rounded-full bg-skyvan-warning/20 p-2 text-skyvan-warning">
        <Cpu className="h-5 w-5" />
      </div>

      {/* Mesaj */}
      <div className="flex-1">
        <h4 className="mb-1 text-sm font-semibold tracking-wide text-skyvan-warning">SKYVAN AI MÜHENDİSLİK UYARISI</h4>
        <p className="text-sm leading-relaxed text-skyvan-text/80">{message}</p>
      </div>

      {/* 1-Tıkla Düzelt Butonu */}
      <button
        onClick={onFix}
        className="flex shrink-0 items-center gap-2 rounded-lg bg-skyvan-warning px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-105 active:scale-95"
      >
        <Wrench className="h-4 w-4" />
        Sistemi Düzelt
      </button>
    </div>
  );
}