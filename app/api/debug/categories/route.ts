import { NextResponse } from "next/server";

import { getDbOrThrow } from "@/db/db";
import { categories } from "@/db/schema";

export async function GET() {
  const db = getDbOrThrow();

  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
    })
    .from(categories);

  return NextResponse.json(rows);
}
