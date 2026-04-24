import { Check } from "lucide-react";

interface ProductCardProps {
  name: string;
  description: string;
  price: number;
  weight: number;
  isSelected: boolean;
  onClick: () => void;
}

export default function ProductCard({
  name,
  description,
  price,
  weight,
  isSelected,
  onClick,
}: ProductCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer rounded-xl border p-4 transition-all duration-300 ${
        isSelected
          ? "border-white/50 bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
          : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="pr-4">
          <h3 className="font-semibold text-white">{name}</h3>
          <p className="mt-1 text-xs text-white/60 leading-relaxed">{description}</p>
        </div>
        
        {/* Seçili İkonu */}
        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors ${isSelected ? "bg-white text-black" : "border border-white/20"}`}>
          {isSelected && <Check className="h-3 w-3" />}
        </div>
      </div>
      
      {/* Alt Bilgi Barı (Ağırlık ve Fiyat) */}
      <div className="mt-4 flex items-center justify-between text-xs font-medium">
        <span className="text-white/50 font-mono">{weight.toFixed(1)} kg</span>
        <span className="text-white">+{price.toLocaleString("tr-TR")} ₺</span>
      </div>
    </div>
  );
}