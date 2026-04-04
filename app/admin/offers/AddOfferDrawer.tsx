"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { saveOffer } from "./actions";

type LeadOption = {
  id: string;
  label: string;
};

export function AddOfferDrawer({ leadOptions }: { leadOptions: LeadOption[] }) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
      <div className="w-full max-w-xl bg-zinc-950 border-l border-zinc-800 p-5">

        <div className="flex justify-between mb-6">
          <h2 className="text-white text-lg font-semibold">
            Yeni Teklif
          </h2>

          <button onClick={() => router.replace("/admin/offers")}>
            <X />
          </button>
        </div>

        <form action={saveOffer} className="space-y-4">

          <select
            name="leadId"
            required
            className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl"
          >
            <option value="">Lead seç</option>
            {leadOptions.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>

          <input
            name="offerReference"
            placeholder="OFF-001"
            required
            className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl"
          />

          <input
            type="date"
            name="validUntil"
            className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl"
          />

          <input
            name="totalAmount"
            placeholder="Tutar"
            className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl"
          />

          <select
            name="status"
            className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl"
          >
            <option value="draft">Taslak</option>
            <option value="sent">Gönderildi</option>
            <option value="accepted">Kabul</option>
            <option value="rejected">Red</option>
          </select>

          <button
            type="submit"
            className="w-full bg-white text-black p-3 rounded-xl"
          >
            Kaydet
          </button>
        </form>
      </div>
    </div>
  );
}