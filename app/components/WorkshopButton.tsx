import { DraftingCompass } from "lucide-react";
import Link from "next/link";
export default function WorkshopButton() {
  return (
    <Link href="/configurator" className="group relative inline-flex items-center gap-4 rounded-2xl border border-skyvan-border bg-white/5 px-5 py-3.5 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:bg-white/10 hover:border-white/20 hover:shadow-[0_14px_34px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)] active:scale-[0.98]">
      
      {/* İkon Kutusu */}
      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-transform duration-300 group-hover:scale-105 group-hover:bg-white/10">
        <DraftingCompass className="h-5 w-5 text-skyvan-text transition-transform duration-300 group-hover:translate-x-[1.5px]" />
      </span>

      {/* Metinler */}
      <span className="flex flex-col items-start text-left">
        <span className="text-[15px] font-semibold tracking-tight text-skyvan-text">
          Skyvan Atölye
        </span>
        <span className="text-[11.5px] font-medium text-skyvan-muted transition-colors duration-300 group-hover:text-white/80">
          Kendi karavanını tasarla
        </span>
      </span>
    </Link>
  );
}