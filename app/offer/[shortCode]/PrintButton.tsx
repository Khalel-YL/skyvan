"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-zinc-900 border border-zinc-800 px-6 py-3 rounded-2xl flex items-center gap-3 hover:bg-zinc-800 transition-all"
    >
      <Printer className="h-4 w-4 text-blue-400" />
      <span className="text-[10px] font-bold uppercase tracking-widest">PDF Kaydet</span>
    </button>
  );
}
