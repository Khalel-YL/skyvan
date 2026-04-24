import { ChevronDown } from "lucide-react";

interface CategoryAccordionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export default function CategoryAccordion({
  title,
  isOpen,
  onToggle,
  children,
}: CategoryAccordionProps) {
  return (
    <div className="border-b border-white/10">
      <button
        onClick={onToggle}
        className="group flex w-full items-center justify-between py-5 text-left transition-colors"
      >
        <h2 className="text-xl font-light text-white group-hover:text-white/80">{title}</h2>
        <ChevronDown
          className={`h-5 w-5 text-white/50 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {/* Eğer açıksa içindeki ürünleri (children) göster */}
      {isOpen && <div className="mb-6 grid gap-3 animate-in fade-in duration-300">{children}</div>}
    </div>
  );
}