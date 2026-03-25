import type { ProductStatus } from "./types";

function getStatusClasses(status: ProductStatus) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200";
    case "draft":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "archived":
      return "bg-zinc-200 text-zinc-700 border-zinc-300";
    default:
      return "bg-zinc-200 text-zinc-700 border-zinc-300";
  }
}

function getStatusLabel(status: ProductStatus) {
  switch (status) {
    case "active":
      return "Aktif";
    case "draft":
      return "Taslak";
    case "archived":
      return "Arşiv";
    default:
      return status;
  }
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${getStatusClasses(
        status
      )}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}