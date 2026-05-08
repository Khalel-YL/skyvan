import "server-only";

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export type PdfTextExtractionResult = {
  ok: boolean;
  text: string | null;
  pageCount: number | null;
  reason: string | null;
};

const SCANNED_PDF_MESSAGE =
  "PDF taranmış görünüyor; okunabilir metin bulunamadı.";
const PDF_EXTRACTION_FAILURE_MESSAGE = "PDF metni çıkarılamadı.";

function normalizePdfText(value: string) {
  return value
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function getTextItemValue(item: unknown) {
  if (
    typeof item === "object" &&
    item !== null &&
    "str" in item &&
    typeof item.str === "string"
  ) {
    return item.str;
  }

  return "";
}

export async function extractPdfText(
  buffer: ArrayBuffer | Uint8Array,
): Promise<PdfTextExtractionResult> {
  const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let pageCount: number | null = null;

  try {
    const loadingTask = getDocument({
      data,
      useWorkerFetch: false,
    });

    const document = await loadingTask.promise;
    pageCount = document.numPages;

    try {
      const pages: string[] = [];

      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const pageText = normalizePdfText(
          textContent.items.map((item) => getTextItemValue(item)).join(" "),
        );

        if (pageText) {
          pages.push(pageText);
        }

        page.cleanup();
      }

      const text = normalizePdfText(pages.join("\n\n"));

      if (!text) {
        return {
          ok: false,
          text: null,
          pageCount,
          reason: SCANNED_PDF_MESSAGE,
        };
      }

      return {
        ok: true,
        text,
        pageCount,
        reason: null,
      };
    } finally {
      await document.destroy();
    }
  } catch {
    return {
      ok: false,
      text: null,
      pageCount,
      reason: PDF_EXTRACTION_FAILURE_MESSAGE,
    };
  }
}
