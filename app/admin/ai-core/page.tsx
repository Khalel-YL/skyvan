import { count, eq } from "drizzle-orm";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  FileWarning,
  Lock,
  ShieldCheck,
} from "lucide-react";

import { db } from "@/db/db";
import {
  aiDocumentChunks,
  aiKnowledgeDocuments,
} from "@/db/schema";
import {
  getAiKnowledgeReadiness,
  getGovernanceRuntime,
} from "@/app/lib/admin/governance";
import { getAuditRuntimeSummary } from "@/app/lib/admin/audit";

type DocumentRow = {
  id: string;
  title: string;
  docType: "datasheet" | "manual" | "rulebook";
  parsingStatus: "pending" | "processing" | "completed" | "failed";
  s3Key: string;
};

function toneClasses(tone: "success" | "warning" | "danger" | "neutral") {
  if (tone === "success") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }

  if (tone === "warning") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-200";
  }

  if (tone === "danger") {
    return "border-rose-500/20 bg-rose-500/10 text-rose-200";
  }

  return "border-zinc-800 bg-zinc-950/60 text-zinc-200";
}

export default async function AICoreAdminPage() {
  const governance = getGovernanceRuntime();
  const audit = getAuditRuntimeSummary();

  if (!db) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-6">
          <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
            Admin · AI Core Governance
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            AI Governance Merkezi
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
            Veritabanı çevrimdışı olduğu için AI bilgi omurgası okunamadı. Yine de
            governance kilitleri env seviyesinde değerlendirilir.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className={`rounded-3xl border p-5 ${toneClasses("warning")}`}>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5" />
              <div className="text-sm font-medium">Audit yazımı</div>
            </div>
            <div className="mt-3 text-sm">{audit.reason}</div>
          </div>

          <div className={`rounded-3xl border p-5 ${toneClasses("warning")}`}>
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5" />
              <div className="text-sm font-medium">AI completed kilidi</div>
            </div>
            <div className="mt-3 text-sm">
              {governance.allowManualAiReadyStatus
                ? "Manuel completed geçişi açık."
                : "Manuel completed geçişi kapalı."}
            </div>
          </div>

          <div className={`rounded-3xl border p-5 ${toneClasses("neutral")}`}>
            <div className="flex items-center gap-3">
              <BrainCircuit className="h-5 w-5" />
              <div className="text-sm font-medium">AI action sınırı</div>
            </div>
            <div className="mt-3 text-sm">
              AI yalnızca completed + chunk üreten belge mantığıyla değerlendirilmelidir.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [documents, chunkRows] = await Promise.all([
    db
      .select({
        id: aiKnowledgeDocuments.id,
        title: aiKnowledgeDocuments.title,
        docType: aiKnowledgeDocuments.docType,
        parsingStatus: aiKnowledgeDocuments.parsingStatus,
        s3Key: aiKnowledgeDocuments.s3Key,
      })
      .from(aiKnowledgeDocuments),
    db
      .select({
        documentId: aiDocumentChunks.documentId,
        chunkCount: count(),
      })
      .from(aiDocumentChunks)
      .groupBy(aiDocumentChunks.documentId),
  ]);

  const chunkMap = new Map(
    chunkRows.map((row) => [row.documentId, Number(row.chunkCount ?? 0)]),
  );

  const evaluatedDocuments = documents.map((document) => {
    const chunkCount = chunkMap.get(document.id) ?? 0;
    const readiness = getAiKnowledgeReadiness({
      parsingStatus: document.parsingStatus,
      title: document.title,
      s3Key: document.s3Key,
      chunkCount,
    });

    return {
      ...document,
      chunkCount,
      readiness,
    };
  });

  const approvedCount = evaluatedDocuments.filter(
    (item) => item.readiness.approvedForAi,
  ).length;

  const blockedCount = evaluatedDocuments.length - approvedCount;
  const failedCount = evaluatedDocuments.filter(
    (item) => item.parsingStatus === "failed",
  ).length;
  const queueCount = evaluatedDocuments.filter(
    (item) =>
      item.parsingStatus === "pending" || item.parsingStatus === "processing",
  ).length;

  const topBlocked = evaluatedDocuments
    .filter((item) => !item.readiness.approvedForAi)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-6">
        <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
          Admin · AI Core Governance
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          AI Governance Merkezi
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
          Bu ekran AI bilgi tabanının doğrudan ne kadar güvenli okunabilir olduğunu
          gösterir. Hedef: completed görünen her kaydı değil, yalnızca gerçekten
          okunabilir ve chunk üreten kayıtları AI için uygun kabul etmek.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
          <div className="text-xs text-zinc-500">Toplam belge</div>
          <div className="mt-2 text-3xl font-semibold text-white">
            {evaluatedDocuments.length}
          </div>
          <div className="mt-2 text-xs text-zinc-500">
            AI bilgi havuzu kayıtları
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-emerald-200">
          <div className="text-xs text-emerald-300/80">AI için uygun</div>
          <div className="mt-2 text-3xl font-semibold">{approvedCount}</div>
          <div className="mt-2 text-xs text-emerald-300/80">
            completed + chunk + temel alanlar tamam
          </div>
        </div>

        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5 text-amber-200">
          <div className="text-xs text-amber-300/80">Kuyruk</div>
          <div className="mt-2 text-3xl font-semibold">{queueCount}</div>
          <div className="mt-2 text-xs text-amber-300/80">
            pending + processing
          </div>
        </div>

        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5 text-rose-200">
          <div className="text-xs text-rose-300/80">Bloke / riskli</div>
          <div className="mt-2 text-3xl font-semibold">{blockedCount}</div>
          <div className="mt-2 text-xs text-rose-300/80">
            {failedCount} failed kayıt dahil
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
          <div className="flex items-center gap-3">
            <BrainCircuit className="h-5 w-5 text-zinc-300" />
            <h2 className="text-lg font-semibold text-white">
              AI action sınırları
            </h2>
          </div>

          <div className="mt-5 grid gap-3">
            <div className={`rounded-2xl border p-4 ${toneClasses("neutral")}`}>
              <div className="text-sm font-medium">Belge completed kilidi</div>
              <div className="mt-2 text-sm">
                {governance.allowManualAiReadyStatus
                  ? "Manuel completed geçişi açık. Bu yalnızca kontrollü operasyonda kullanılmalı."
                  : "Manuel completed geçişi kapalı. Datasheet aksiyonları completed geçişini guardrail ile sınırlar."}
              </div>
            </div>

            <div className={`rounded-2xl border p-4 ${toneClasses(audit.enabled ? "success" : "warning")}`}>
              <div className="text-sm font-medium">Audit runtime</div>
              <div className="mt-2 text-sm">{audit.reason}</div>
            </div>

            <div className={`rounded-2xl border p-4 ${toneClasses("neutral")}`}>
              <div className="text-sm font-medium">Kritik publish mantığı</div>
              <div className="mt-2 text-sm">
                Pages tarafında SEO’suz doğrudan publish default olarak bloke edilir.
              </div>
            </div>

            <div className={`rounded-2xl border p-4 ${toneClasses(governance.allowCriticalOfferStatusTransitions ? "warning" : "success")}`}>
              <div className="text-sm font-medium">Kritik ticari durumlar</div>
              <div className="mt-2 text-sm">
                {governance.allowCriticalOfferStatusTransitions
                  ? "accepted / rejected / expired geçişleri açık."
                  : "accepted / rejected / expired geçişleri governance kilidi altında."}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-zinc-300" />
            <h2 className="text-lg font-semibold text-white">
              En yakın riskler
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            {topBlocked.length === 0 ? (
              <div className={`rounded-2xl border p-4 ${toneClasses("success")}`}>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  AI giriş kalitesi dengeli görünüyor
                </div>
                <div className="mt-2 text-sm">
                  İlk bakışta bloklanmış örnek görünmüyor.
                </div>
              </div>
            ) : (
              topBlocked.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 ${toneClasses(
                    item.parsingStatus === "failed" ? "danger" : "warning",
                  )}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{item.title}</div>
                      <div className="mt-1 text-xs opacity-80">
                        {item.docType} · {item.parsingStatus} · chunk: {item.chunkCount}
                      </div>
                    </div>

                    {item.parsingStatus === "failed" ? (
                      <FileWarning className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                    )}
                  </div>

                  <ul className="mt-3 space-y-1 text-xs leading-5 opacity-90">
                    {item.readiness.blockers.map((blocker) => (
                      <li key={blocker}>• {blocker}</li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}