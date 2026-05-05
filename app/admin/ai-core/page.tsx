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
  getAiUsageKnowledgeRecords,
  getGovernanceRuntime,
  type AiKnowledgeUsageRecord,
} from "@/app/lib/admin/governance";
import { getAuditRuntimeValidation } from "@/app/lib/admin/audit";

type RuntimeTone = "success" | "warning" | "danger" | "neutral";

type RuntimeItem = {
  title: string;
  value: string;
  description: string;
  tone: RuntimeTone;
};

type KnowledgeState = {
  documents: AiKnowledgeUsageRecord[];
  totalCount: number;
  readyCount: number;
  blockedCount: number;
  failedCount: number;
  queueCount: number;
  completedWithoutChunksCount: number;
  missingProductReferenceCount: number;
  groundedChunkCount: number;
  sourceRows: AiKnowledgeUsageRecord[];
  dbAvailable: boolean;
  dbMessage: string | null;
};

const parsingStatusLabels: Record<string, string> = {
  pending: "Bekliyor",
  processing: "İşleniyor",
  completed: "Tamamlandı",
  failed: "Hatalı",
};

function getParsingStatusLabel(value: string) {
  return parsingStatusLabels[value] ?? value;
}

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
  audit: Awaited<ReturnType<typeof getAuditRuntimeValidation>>;
  governance: ReturnType<typeof getGovernanceRuntime>;
}): RuntimeItem[] {
  return [
    {
      title: "Audit yazımı",
      value: params.audit.writeActive ? "Aktif" : "Güvenli düşüş",
      description: params.audit.reason,
      tone: params.audit.writeActive
        ? params.audit.closureState === "warning"
          ? "warning"
          : "success"
        : "danger",
    },
    {
      title: "Audit aktörü",
      value:
        params.audit.actorRecordStatus === "resolved"
          ? params.audit.roleAligned
            ? "Doğrulandı"
            : "Rol dikkat istiyor"
          : "Engelli",
      description:
        params.audit.actorRecordStatus === "resolved"
          ? `${params.audit.actorPreview} · rol ${params.audit.actorRole}`
          : params.audit.reason,
      tone:
        params.audit.actorRecordStatus === "resolved"
          ? params.audit.roleAligned
            ? "success"
            : "warning"
          : "danger",
    },
    {
      title: "Kritik teklif kilidi",
      value: params.governance.allowCriticalOfferStatusTransitions
        ? "Açık"
        : "Kapalı",
      description: params.governance.allowCriticalOfferStatusTransitions
        ? "Kritik teklif geçişleri manuel olarak açılmış."
        : "Kritik teklif durumları yönetim kilidi altında.",
      tone: params.governance.allowCriticalOfferStatusTransitions
        ? "warning"
        : "success",
    },
    {
      title: "SEO'suz yayın kilidi",
      value: params.governance.allowDirectPublishWithoutSeo ? "Açık" : "Kapalı",
      description: params.governance.allowDirectPublishWithoutSeo
        ? "SEO'suz doğrudan yayın manuel olarak açık."
        : "SEO'suz yayın varsayılan olarak engelli.",
      tone: params.governance.allowDirectPublishWithoutSeo ? "warning" : "success",
    },
    {
      title: "Manuel AI hazır kilidi",
      value: params.governance.allowManualAiReadyStatus ? "Açık" : "Kapalı",
      description: params.governance.allowManualAiReadyStatus
        ? "Tamamlandı sınırı manuel olarak açılmış."
        : "Tamamlandı sınırına dokunan geçişler korunuyor.",
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
      groundedChunkCount: 0,
      sourceRows: [],
      dbAvailable: false,
      dbMessage:
        "Veritabanı çevrimdışı olduğu için AI bilgi görünürlüğü şu anda yalnızca çalışma seviyesinde gösteriliyor.",
    };
  }

  try {
    const evaluatedDocuments = await getAiUsageKnowledgeRecords();

    const readyCount = evaluatedDocuments.filter(
      (item) => item.readiness.approvedForAi,
    ).length;
    const groundedChunkCount = evaluatedDocuments
      .filter((item) => item.readiness.approvedForAi)
      .reduce((sum, item) => sum + item.chunkCount, 0);

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
        (item) => item.hasMissingProductReference,
      ).length,
      groundedChunkCount,
      sourceRows: evaluatedDocuments
        .filter((item) => item.readiness.approvedForAi)
        .slice(0, 4),
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
      groundedChunkCount: 0,
      sourceRows: [],
      dbAvailable: false,
      dbMessage:
        "AI bilgi kayıtları okunurken beklenmeyen bir hata oluştu. Çalışma görünürlüğü korunuyor.",
    };
  }
}

export default async function AICoreAdminPage() {
  const governance = getGovernanceRuntime();
  const audit = await getAuditRuntimeValidation();
  const runtimeItems = getRuntimeItems({ audit, governance });
  const knowledgeState = await getKnowledgeState();

  const blockedExamples = knowledgeState.documents
    .filter((item) => !item.readiness.approvedForAi)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="border-b border-zinc-800 pb-4">
        <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
          ADMIN · AI CORE
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-white">
          AI Yönetim Görünürlüğü
        </h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-400">
          AI bilgi omurgasının okunabilirliğini ve yönetim kilitlerini kompakt
          biçimde gösterir.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-zinc-300" />
          <h2 className="text-sm font-semibold text-white">Yönetim durumu</h2>
        </div>

        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-5">
          {runtimeItems.map((item) => (
            <div
              key={item.title}
              className={`rounded-2xl border p-3 ${toneClasses(item.tone)}`}
            >
              <div className="text-[11px] uppercase tracking-[0.18em] opacity-80">
                {item.title}
              </div>
              <div className="mt-1 text-lg font-semibold">{item.value}</div>
              <div className="mt-1 line-clamp-2 text-xs leading-5 opacity-90">
                {item.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <BrainCircuit className="h-5 w-5 text-zinc-300" />
          <h2 className="text-lg font-semibold text-white">
            AI bilgi hazırlığı
          </h2>
        </div>

        {!knowledgeState.dbAvailable && knowledgeState.dbMessage ? (
          <div className={`rounded-2xl border p-3 ${toneClasses("warning")}`}>
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5" />
              <div className="text-sm font-medium">Bilgi görünürlüğü güvenli modda</div>
            </div>
            <div className="mt-3 text-sm leading-6">{knowledgeState.dbMessage}</div>
          </div>
        ) : null}

        <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
            <div className="text-xs text-zinc-500">Toplam belge</div>
            <div className="mt-1 text-2xl font-semibold text-white">
              {knowledgeState.totalCount}
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              AI bilgi kayıtları
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-200">
            <div className="text-xs text-emerald-300/80">Kaynaklı kullanım</div>
            <div className="mt-1 text-2xl font-semibold">
              {knowledgeState.readyCount}
            </div>
            <div className="mt-2 text-xs text-emerald-300/80">
              AI için gerçekten kullanılabilir belge sayısı
            </div>
          </div>

          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-rose-200">
            <div className="text-xs text-rose-300/80">Engelli</div>
            <div className="mt-1 text-2xl font-semibold">
              {knowledgeState.blockedCount}
            </div>
            <div className="mt-2 text-xs text-rose-300/80">
              AI için uygun olmayan kayıtlar
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-amber-200">
            <div className="text-xs text-amber-300/80">Bekleyen / işlenen</div>
            <div className="mt-1 text-2xl font-semibold">
              {knowledgeState.queueCount}
            </div>
            <div className="mt-2 text-xs text-amber-300/80">
              İşleme kuyruğundaki kayıtlar
            </div>
          </div>

          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-3 text-sky-200">
            <div className="text-xs text-sky-300/80">Kaynak parçası</div>
            <div className="mt-1 text-2xl font-semibold">
              {knowledgeState.groundedChunkCount}
            </div>
            <div className="mt-2 text-xs text-sky-300/80">
              Uygun belgelerden okunabilir parça toplamı
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
            <div className="text-xs text-zinc-500">Hatalı</div>
            <div className="mt-1 text-2xl font-semibold text-white">
              {knowledgeState.failedCount}
            </div>
            <div className="mt-2 text-xs text-zinc-500">
              İşleme hatası alan belgeler
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-zinc-300" />
            <h2 className="text-sm font-semibold text-white">
              Operasyonel özet
            </h2>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Audit aktörü
              </div>
              <div className="mt-2 text-lg font-semibold text-white">
                {audit.actorRecordStatus === "resolved"
                  ? audit.roleAligned
                    ? "Doğrulandı"
                    : "Rol dikkat istiyor"
                  : "Kapanış engeli"}
              </div>
              <div className="mt-2 text-sm text-zinc-400">{audit.reason}</div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                AI hazır oranı
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
                bilgi kullanımı için hazır görünüyor.
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Parçasız tamamlandı
              </div>
              <div className="mt-2 text-lg font-semibold text-white">
                {knowledgeState.completedWithoutChunksCount}
              </div>
              <div className="mt-2 text-sm text-zinc-400">
                Tamamlandı görünen ama parça üretmeyen kayıtlar AI için engelli sayılır.
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-black/20 p-3">
              <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                Eksik ürün bağı
              </div>
              <div className="mt-2 text-lg font-semibold text-white">
                {knowledgeState.missingProductReferenceCount}
              </div>
              <div className="mt-2 text-sm text-zinc-400">
                Kural kitabı dışındaki belgelerde ürün bağı eksikse AI hazırlığı düşer.
              </div>
            </div>
          </div>

          <div className={`mt-3 rounded-2xl border p-3 ${toneClasses("neutral")}`}>
            <div className="text-sm font-medium">Yorum sınırı</div>
            <div className="mt-2 text-sm leading-6">
              AI yalnızca onaylı, tamamlandı görünen, depo alanı dolu ve içerik
              parçası üretmiş kayıtlarla konuşmalıdır.
            </div>
          </div>

          <div className={`mt-3 rounded-2xl border p-3 ${toneClasses("success")}`}>
            <div className="text-sm font-medium">Kaynaklı kullanım kayıtları</div>
            <div className="mt-2 text-sm leading-6">
              Ham belge metni gösterilmez; yalnızca güvenli kayıt metadatası listelenir.
            </div>

            <div className="mt-3 space-y-2">
              {knowledgeState.sourceRows.length === 0 ? (
                <div className="text-sm text-emerald-200/80">
                  Henüz kaynaklı kullanım için hazır kayıt görünmüyor.
                </div>
              ) : (
                knowledgeState.sourceRows.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-white">
                          {item.title}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-emerald-200/90">
                          <span>{item.docType}</span>
                          <span>Parça: {item.chunkCount}</span>
                          <span>Analiz: {getParsingStatusLabel(item.parsingStatus)}</span>
                          <span>
                            {item.hasMissingProductReference
                              ? "Ürün bağı eksik"
                              : "Ürün bağı uygun"}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-200">
                        Kayıt bilgisi
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-zinc-400">
                      İçerik önizlemesi güvenli gösterim için gizlendi.
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-zinc-300" />
            <h2 className="text-sm font-semibold text-white">
              Engelli / risk örnekleri
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            {blockedExamples.length === 0 ? (
              <div className={`rounded-2xl border p-4 ${toneClasses("success")}`}>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Görünen örneklerde kritik engelli kayıt yok
                </div>
                <div className="mt-2 text-sm">
                  İlk bakışta AI hazırlığı dışında kalan örnek listesi oluşmadı.
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
                        {item.docType} · {getParsingStatusLabel(item.parsingStatus)} · parça: {item.chunkCount}
                        {item.hasMissingProductReference ? " · ürün bağı eksik" : ""}
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
                <div className="text-sm font-medium">Henüz bilgi kaydı yok</div>
                <div className="mt-2 text-sm">
                  AI görünürlüğü için belge eklenip içerik parçası üretimi tamamlandıkça bu alan
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
