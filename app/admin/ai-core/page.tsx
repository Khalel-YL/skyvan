import { count } from "drizzle-orm";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  FileWarning,
  ShieldAlert,
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

type RuntimeTone = "success" | "warning" | "danger" | "neutral";

type RuntimeItem = {
  title: string;
  value: string;
  description: string;
  tone: RuntimeTone;
};

type KnowledgeDocument = {
  id: string;
  productId: string | null;
  title: string;
  docType: string;
  parsingStatus: "pending" | "processing" | "completed" | "failed";
  s3Key: string;
  chunkCount: number;
  readiness: ReturnType<typeof getAiKnowledgeReadiness>;
};

type KnowledgeState = {
  documents: KnowledgeDocument[];
  totalCount: number;
  readyCount: number;
  blockedCount: number;
  failedCount: number;
  queueCount: number;
  completedWithoutChunksCount: number;
  missingProductReferenceCount: number;
  dbAvailable: boolean;
  dbMessage: string | null;
};

function toneClasses(tone: RuntimeTone) {
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

function getRuntimeItems(params: {
  audit: ReturnType<typeof getAuditRuntimeSummary>;
  governance: ReturnType<typeof getGovernanceRuntime>;
}): RuntimeItem[] {
  return [
    {
      title: "Audit yazımı",
      value: params.audit.enabled ? "Aktif" : "Pasif",
      description: params.audit.reason,
      tone: params.audit.enabled ? "success" : "warning",
    },
    {
      title: "Audit actor",
      value: params.governance.hasAuditActor ? "Var" : "Yok",
      description: params.governance.hasAuditActor
        ? "Audit helper actor bilgisiyle çalışabilir."
        : "Actor env eksikse audit safe-degrade modda no-op kalır.",
      tone: params.governance.hasAuditActor ? "success" : "warning",
    },
    {
      title: "Critical offer override",
      value: params.governance.allowCriticalOfferStatusTransitions
        ? "Açık"
        : "Kapalı",
      description: params.governance.allowCriticalOfferStatusTransitions
        ? "accepted / rejected / expired geçişleri override ile açılmış."
        : "Kritik teklif durumları governance kilidi altında.",
      tone: params.governance.allowCriticalOfferStatusTransitions
        ? "warning"
        : "success",
    },
    {
      title: "Direct publish override",
      value: params.governance.allowDirectPublishWithoutSeo ? "Açık" : "Kapalı",
      description: params.governance.allowDirectPublishWithoutSeo
        ? "SEO'suz doğrudan publish override aktif."
        : "SEO'suz publish varsayılan olarak blokeli.",
      tone: params.governance.allowDirectPublishWithoutSeo ? "warning" : "success",
    },
    {
      title: "Manual AI-ready override",
      value: params.governance.allowManualAiReadyStatus ? "Açık" : "Kapalı",
      description: params.governance.allowManualAiReadyStatus
        ? "Completed sınırı override ile manuel açılmış."
        : "Completed sınırına dokunan geçişler governance ile korunuyor.",
      tone: params.governance.allowManualAiReadyStatus ? "warning" : "success",
    },
  ];
}

async function getKnowledgeState(): Promise<KnowledgeState> {
  if (!db) {
    return {
      documents: [],
      totalCount: 0,
      readyCount: 0,
      blockedCount: 0,
      failedCount: 0,
      queueCount: 0,
      completedWithoutChunksCount: 0,
      missingProductReferenceCount: 0,
      dbAvailable: false,
      dbMessage:
        "Veritabanı çevrimdışı olduğu için AI knowledge görünürlüğü şu anda yalnızca runtime seviyesinde gösteriliyor.",
    };
  }

  try {
    const [documents, chunkRows] = await Promise.all([
      db
        .select({
          id: aiKnowledgeDocuments.id,
          productId: aiKnowledgeDocuments.productId,
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

    const evaluatedDocuments: KnowledgeDocument[] = documents.map((document) => {
      const chunkCount = chunkMap.get(document.id) ?? 0;
      const readiness = getAiKnowledgeReadiness({
        docType: document.docType,
        productId: document.productId,
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

    const readyCount = evaluatedDocuments.filter(
      (item) => item.readiness.approvedForAi,
    ).length;

    return {
      documents: evaluatedDocuments,
      totalCount: evaluatedDocuments.length,
      readyCount,
      blockedCount: evaluatedDocuments.length - readyCount,
      failedCount: evaluatedDocuments.filter(
        (item) => item.parsingStatus === "failed",
      ).length,
      queueCount: evaluatedDocuments.filter(
        (item) =>
          item.parsingStatus === "pending" || item.parsingStatus === "processing",
      ).length,
      completedWithoutChunksCount: evaluatedDocuments.filter(
        (item) => item.parsingStatus === "completed" && item.chunkCount <= 0,
      ).length,
      missingProductReferenceCount: evaluatedDocuments.filter(
        (item) => item.docType !== "rulebook" && !item.productId,
      ).length,
      dbAvailable: true,
      dbMessage: null,
    };
  } catch (error) {
    console.error("ai-core governance page error:", error);

    return {
      documents: [],
      totalCount: 0,
      readyCount: 0,
      blockedCount: 0,
      failedCount: 0,
      queueCount: 0,
      completedWithoutChunksCount: 0,
      missingProductReferenceCount: 0,
      dbAvailable: false,
      dbMessage:
        "AI knowledge kayıtları okunurken beklenmeyen bir hata oluştu. Runtime görünürlüğü korunuyor.",
    };
  }
}

export default async function AICoreAdminPage() {
  const governance = getGovernanceRuntime();
  const audit = getAuditRuntimeSummary();
  const runtimeItems = getRuntimeItems({ audit, governance });
  const knowledgeState = await getKnowledgeState();

  const blockedExamples = knowledgeState.documents
    .filter((item) => !item.readiness.approvedForAi)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-6">
        <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
          Admin · AI Core Governance
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Governance Görünürlük Merkezi
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
          Bu ekran AI bilgi omurgasının gerçekten okunabilir olup olmadığını ve
          governance override durumlarını birlikte gösterir. Amaç, yalnızca
          okunabilir, chunk üretmiş ve sınırları korunmuş kayıtları AI-ready kabul
          etmektir.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-zinc-300" />
          <h2 className="text-lg font-semibold text-white">Governance runtime</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {runtimeItems.map((item) => (
            <div
              key={item.title}
              className={`rounded-3xl border p-5 ${toneClasses(item.tone)}`}
            >
              <div className="text-[11px] uppercase tracking-[0.18em] opacity-80">
                {item.title}
              </div>
              <div className="mt-3 text-2xl font-semibold">{item.value}</div>
              <div className="mt-3 text-sm leading-6 opacity-90">
                {item.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <BrainCircuit className="h-5 w-5 text-zinc-300" />
          <h2 className="text-lg font-semibold text-white">
            AI knowledge readiness
          </h2>
        </div>

        {!knowledgeState.dbAvailable && knowledgeState.dbMessage ? (
          <div className={`rounded-3xl border p-5 ${toneClasses("warning")}`}>
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5" />
              <div className="text-sm font-medium">Knowledge görünürlüğü fallback modda</div>
            </div>
            <div className="mt-3 text-sm leading-6">{knowledgeState.dbMessage}</div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
            <div className="text-xs text-zinc-500">Toplam belge</div>
            <div className="mt-2 text-3xl font-semibold text-white">
              {knowledgeState.totalCount}
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              AI knowledge kayıtları
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-emerald-200">
            <div className="text-xs text-emerald-300/80">AI-ready</div>
            <div className="mt-2 text-3xl font-semibold">
              {knowledgeState.readyCount}
            </div>
            <div className="mt-2 text-xs text-emerald-300/80">
              completed + chunk + temel alanlar tamam
            </div>
          </div>

          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5 text-rose-200">
            <div className="text-xs text-rose-300/80">Blocked</div>
            <div className="mt-2 text-3xl font-semibold">
              {knowledgeState.blockedCount}
            </div>
            <div className="mt-2 text-xs text-rose-300/80">
              AI için uygun olmayan kayıtlar
            </div>
          </div>

          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-5 text-amber-200">
            <div className="text-xs text-amber-300/80">Pending / processing</div>
            <div className="mt-2 text-3xl font-semibold">
              {knowledgeState.queueCount}
            </div>
            <div className="mt-2 text-xs text-amber-300/80">
              İşleme kuyruğundaki kayıtlar
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
            <div className="text-xs text-zinc-500">Failed</div>
            <div className="mt-2 text-3xl font-semibold text-white">
              {knowledgeState.failedCount}
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              İşleme hatası alan belgeler
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-zinc-300" />
            <h2 className="text-lg font-semibold text-white">
              Operasyonel özet
            </h2>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Audit actor durumu
              </div>
              <div className="mt-2 text-lg font-semibold text-white">
                {governance.hasAuditActor ? "Yapılandırılmış" : "Eksik"}
              </div>
              <div className="mt-2 text-sm text-zinc-400">{audit.reason}</div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                AI-ready oranı
              </div>
              <div className="mt-2 text-lg font-semibold text-white">
                {knowledgeState.totalCount > 0
                  ? `%${Math.round(
                      (knowledgeState.readyCount / knowledgeState.totalCount) * 100,
                    )}`
                  : "%0"}
              </div>
              <div className="mt-2 text-sm text-zinc-400">
                {knowledgeState.readyCount} / {knowledgeState.totalCount} kayıt gerçekten
                knowledge-ready görünüyor.
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Chunk&apos;sız completed
              </div>
              <div className="mt-2 text-lg font-semibold text-white">
                {knowledgeState.completedWithoutChunksCount}
              </div>
              <div className="mt-2 text-sm text-zinc-400">
                Completed görünen ama chunk üretmeyen kayıtlar AI için bloke sayılır.
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-black/20 p-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Eksik ürün bağı
              </div>
              <div className="mt-2 text-lg font-semibold text-white">
                {knowledgeState.missingProductReferenceCount}
              </div>
              <div className="mt-2 text-sm text-zinc-400">
                Rulebook dışındaki belgelerde ürün bağı eksik olduğunda AI-ready düşer.
              </div>
            </div>
          </div>

          <div className={`mt-4 rounded-2xl border p-4 ${toneClasses("neutral")}`}>
            <div className="text-sm font-medium">Yorum sınırı</div>
            <div className="mt-2 text-sm leading-6">
              AI yalnızca approved mantıkta değerlendirilen, completed görünen,
              storage alanı dolu ve chunk üretmiş bilgi kayıtlarıyla konuşmalıdır.
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-zinc-300" />
            <h2 className="text-lg font-semibold text-white">
              Blocked / risk örnekleri
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            {blockedExamples.length === 0 ? (
              <div className={`rounded-2xl border p-4 ${toneClasses("success")}`}>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Görünen örneklerde kritik blocked kayıt yok
                </div>
                <div className="mt-2 text-sm">
                  İlk bakışta AI-ready dışına düşen örnek listesi oluşmadı.
                </div>
              </div>
            ) : (
              blockedExamples.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 ${toneClasses(
                    item.parsingStatus === "failed" ? "danger" : "warning",
                  )}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {item.title}
                      </div>
                      <div className="mt-1 text-xs opacity-80">
                        {item.docType} · {item.parsingStatus} · chunk: {item.chunkCount}
                        {item.productId ? "" : " · ürün bağı yok"}
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

            {knowledgeState.dbAvailable && knowledgeState.documents.length === 0 ? (
              <div className={`rounded-2xl border p-4 ${toneClasses("neutral")}`}>
                <div className="text-sm font-medium">Henüz knowledge kaydı yok</div>
                <div className="mt-2 text-sm">
                  AI görünürlüğü için belge eklenip chunk üretimi tamamlandıkça bu alan
                  anlamlı veri göstermeye başlayacak.
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
