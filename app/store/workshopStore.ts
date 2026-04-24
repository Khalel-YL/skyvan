import { create } from 'zustand';

interface WorkshopState {
  selectedModel: string | null;
  selectedPackage: string | null;
  setModel: (id: string) => void;
  setPackage: (id: string) => void;
}

// Müşterinin seçimlerini aklında tutacak olan yapay zeka hafızamız
export const useWorkshopStore = create<WorkshopState>((set) => ({
  selectedModel: null,
  selectedPackage: null,
  setModel: (id) => set({ selectedModel: id }),
  setPackage: (id) => set({ selectedPackage: id }),
}));