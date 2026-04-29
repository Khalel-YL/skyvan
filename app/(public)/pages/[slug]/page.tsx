import { redirect } from "next/navigation";

export default async function LegacyPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/tr/${slug}`);
}
