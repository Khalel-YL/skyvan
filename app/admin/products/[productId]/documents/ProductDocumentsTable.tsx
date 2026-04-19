import { ArchiveProductDocumentDialog } from "./ArchiveProductDocumentDialog";
import { AiIngestProductDocumentButton } from "./AiIngestProductDocumentButton";
import { EditProductDocumentDrawer } from "./EditProductDocumentDrawer";
import {
  activateProductDocument,
  setDraftProductDocument,
} from "./actions";
import { getProductDocumentTypeLabel } from "./lib";
import type { ProductDocumentListItem } from "./types";

type Props = {
  documents: ProductDocumentListItem[];
  emptyTitle?: string;
  emptyDescription?: string;
};

function getStatusClasses(status: ProductDocumentListItem["status"]) {
  switch (status) {
    case "draft":
      return "border-amber-800 bg-amber-950 text-amber-300";
    case "active":
      return "border-green-800 bg-green-950 text-green-300";
    case "archived":
      return "border-zinc-700 bg-zinc-900 text-zinc-300";
    default:
      return "border-zinc-700 bg-zinc-900 text-zinc-300";
  }
}

function getStatusLabel(status: ProductDocumentListItem["status"]) {
  switch (status) {
    case "draft":
      return "Taslak";
    case "active":
      return "Aktif";
    case "archived":
      return "Arşiv";
    default:
      return status;
  }
}

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getUrlHostLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Harici link";
  }
}

function getTransitionButtonClassName(tone: "success" | "warning") {
  if (tone === "success") {
    return "border-green-800 bg-green-950 text-green-300 hover:border-green-700";
  }

  return "border-blue-800 bg-blue-950 text-blue-300 hover:border-blue-700";
}

export function ProductDocumentsTable({
  documents,
  emptyTitle = "Belge bulunamadı",
  emptyDescription = "Bu ürün için henüz belge kaydı yok.",
}: Props) {
  if (!documents.length) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-8 text-center">
        <h3 className="text-lg font-semibold text-zinc-100">{emptyTitle}</h3>
        <p className="mt-2 text-sm text-zinc-400">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-900/80">
            <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3 font-medium">Belge</th>
              <th className="px-4 py-3 font-medium">Tip</th>
              <th className="px-4 py-3 font-medium">Link</th>
              <th className="px-4 py-3 font-medium">Sıra</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium">Güncelleme</th>
              <th className="px-4 py-3 font-medium">İşlemler</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800">
            {documents.map((document) => (
              <tr key={document.id} className="align-top">
                <td className="px-4 py-4">
                  <div className="font-medium text-zinc-100">
                    {document.title}
                  </div>

                  {document.note ? (
                    <div className="mt-1 max-w-md text-sm text-zinc-400">
                      {document.note}
                    </div>
                  ) : null}
                </td>

                <td className="px-4 py-4 text-sm text-zinc-300">
                  {getProductDocumentTypeLabel(document.type)}
                </td>

                <td className="px-4 py-4">
                  <div className="flex flex-col gap-1">
                    <a
                      href={document.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-fit max-w-[280px] truncate rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
                    >
                      Belgeyi Aç
                    </a>
                    <span className="text-xs text-zinc-500">
                      {getUrlHostLabel(document.url)}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-4 text-sm text-zinc-300">
                  {document.sortOrder}
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                      document.status
                    )}`}
                  >
                    {getStatusLabel(document.status)}
                  </span>
                </td>

                <td className="px-4 py-4 text-sm text-zinc-400">
                  {formatDate(document.updatedAt)}
                </td>

                <td className="px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {document.status === "draft" ? (
                      <>
                        <form
                          action={async () => {
                            await activateProductDocument(
                              document.id,
                              document.productId,
                            );
                          }}
                        >
                          <button
                            type="submit"
                            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition ${getTransitionButtonClassName(
                              "success",
                            )}`}
                          >
                            Aktifleştir
                          </button>
                        </form>
                        <EditProductDocumentDrawer document={document} />
                        <ArchiveProductDocumentDialog document={document} />
                      </>
                    ) : null}

                    {document.status === "active" ? (
                      <>
                        <form
                          action={async () => {
                            await setDraftProductDocument(
                              document.id,
                              document.productId,
                            );
                          }}
                        >
                          <button
                            type="submit"
                            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition ${getTransitionButtonClassName(
                              "warning",
                            )}`}
                          >
                            Taslağa Al
                          </button>
                        </form>
                        <EditProductDocumentDrawer document={document} />
                        <ArchiveProductDocumentDialog document={document} />
                        <AiIngestProductDocumentButton document={document} />
                      </>
                    ) : null}

                    {document.status === "archived" ? (
                      <>
                        <ArchiveProductDocumentDialog document={document} />
                        <EditProductDocumentDrawer document={document} />
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
