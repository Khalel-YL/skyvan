import "server-only";

import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  getDocument,
  GlobalWorkerOptions,
} from "pdfjs-dist/legacy/build/pdf.mjs";

export type PdfTextExtractionResult = {
  ok: boolean;
  text: string | null;
  pageCount: number | null;
  reason: string | null;
  diagnosticCode?: string;
  diagnosticMessage?: string;
};

const SCANNED_PDF_MESSAGE =
  "PDF taranmış görünüyor; okunabilir metin bulunamadı.";
const PDF_EXTRACTION_FAILURE_MESSAGE = "PDF metni çıkarılamadı.";
const PDFJS_LOAD_FAILED = "PDFJS_LOAD_FAILED";
const PDFJS_TEXT_CONTENT_FAILED = "PDFJS_TEXT_CONTENT_FAILED";
const PDFJS_EMPTY_TEXT = "PDFJS_EMPTY_TEXT";
const PDFJS_UNKNOWN_ERROR = "PDFJS_UNKNOWN_ERROR";
const pdfWorkerPath = path.join(
  process.cwd(),
  "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
);

GlobalWorkerOptions.workerSrc = pathToFileURL(pdfWorkerPath).href;

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

function getDiagnosticMessage(error: unknown) {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`.slice(0, 240);
  }

  return String(error).slice(0, 240);
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

    let document: Awaited<typeof loadingTask.promise>;

    try {
      document = await loadingTask.promise;
    } catch (error) {
      return {
        ok: false,
        text: null,
        pageCount: null,
        reason: PDF_EXTRACTION_FAILURE_MESSAGE,
        diagnosticCode: PDFJS_LOAD_FAILED,
        diagnosticMessage: getDiagnosticMessage(error),
      };
    }

    pageCount = document.numPages;

    try {
      const pages: string[] = [];

      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        try {
          const page = await document.getPage(pageNumber);
          const textContent = await page.getTextContent();
          const pageText = normalizePdfText(
            textContent.items.map((item) => getTextItemValue(item)).join(" "),
          );

          if (pageText) {
            pages.push(pageText);
          }

          page.cleanup();
        } catch (error) {
          return {
            ok: false,
            text: null,
            pageCount,
            reason: PDF_EXTRACTION_FAILURE_MESSAGE,
            diagnosticCode: PDFJS_TEXT_CONTENT_FAILED,
            diagnosticMessage: getDiagnosticMessage(error),
          };
        }
      }

      const text = normalizePdfText(pages.join("\n\n"));

      if (!text) {
        return {
          ok: false,
          text: null,
          pageCount,
          reason: SCANNED_PDF_MESSAGE,
          diagnosticCode: PDFJS_EMPTY_TEXT,
          diagnosticMessage: "PDF.js returned no text content.",
        };
      }

      return {
        ok: true,
        text,
        pageCount,
        reason: null,
        diagnosticCode: undefined,
        diagnosticMessage: undefined,
      };
    } finally {
      await document.destroy();
    }
  } catch (error) {
    return {
      ok: false,
      text: null,
      pageCount,
      reason: PDF_EXTRACTION_FAILURE_MESSAGE,
      diagnosticCode: PDFJS_UNKNOWN_ERROR,
      diagnosticMessage: getDiagnosticMessage(error),
    };
  }
}
