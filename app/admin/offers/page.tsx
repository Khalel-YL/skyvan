import Link from "next/link";
import { desc, eq } from "drizzle-orm";

import { db } from "@/db/db";
import { offers, leads } from "@/db/schema";

import { AddOfferDrawer } from "./AddOfferDrawer";
import { deleteOffer } from "./actions";

function getStatusColor(status: string) {
  if (status === "accepted") return "text-green-400";
  if (status === "sent") return "text-blue-400";
  if (status === "rejected") return "text-red-400";
  if (status === "expired") return "text-yellow-400";
  return "text-zinc-400";
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  if (!db) {
    return <div className="p-6 text-white">DB yok</div>;
  }

  const params = await searchParams;

  const isDrawerOpen = params.new === "true";

  const rows = await db
    .select({
      id: offers.id,
      offerReference: offers.offerReference,
      status: offers.status,
      totalAmount: offers.totalAmount,
      validUntil: offers.validUntil,
      leadName: leads.fullName,
      createdAt: offers.createdAt,
    })
    .from(offers)
    .leftJoin(leads, eq(offers.leadId, leads.id))
    .orderBy(desc(offers.createdAt));

  const now = new Date();

  const enriched = rows.map((r) => {
    let computedStatus = r.status;

    if (
      r.validUntil &&
      new Date(r.validUntil) < now &&
      r.status !== "accepted"
    ) {
      computedStatus = "expired";
    }

    return {
      ...r,
      computedStatus,
    };
  });

  const leadRows = await db
    .select({
      id: leads.id,
      fullName: leads.fullName,
    })
    .from(leads);

  return (
    <div className="p-6 space-y-6 text-white">

      <div className="flex justify-between">
        <h1 className="text-xl font-semibold">Offers</h1>

        <Link href="/admin/offers?new=true">
          Yeni teklif
        </Link>
      </div>

      {/* PIPELINE */}
      <div className="grid grid-cols-4 gap-4">
        {["draft", "sent", "accepted", "expired"].map((s) => (
          <div
            key={s}
            className="border border-zinc-800 p-4 rounded-xl"
          >
            <p className="text-sm text-zinc-500">{s}</p>
            <p className="text-lg">
              {enriched.filter((e) => e.computedStatus === s).length}
            </p>
          </div>
        ))}
      </div>

      {/* LIST */}
      <div className="space-y-3">
        {enriched.map((o) => (
          <div
            key={o.id}
            className="border border-zinc-800 p-4 rounded-xl flex justify-between"
          >
            <div>
              <p>{o.offerReference}</p>
              <p className="text-sm text-zinc-500">
                {o.leadName}
              </p>
              <p className={getStatusColor(o.computedStatus)}>
                {o.computedStatus}
              </p>
            </div>

            <form
              action={async () => {
                "use server";
                await deleteOffer(o.id);
              }}
            >
              <button>Sil</button>
            </form>
          </div>
        ))}
      </div>

      {isDrawerOpen && (
        <AddOfferDrawer
          leadOptions={leadRows.map((l) => ({
            id: l.id,
            label: l.fullName,
          }))}
        />
      )}
    </div>
  );
}