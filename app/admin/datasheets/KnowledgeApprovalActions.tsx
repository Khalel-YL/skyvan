"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  approveKnowledgeDocument,
  rejectKnowledgeDocument,
  resetKnowledgeReview,
  revokeKnowledgeDocument,
} from "./approval-actions";

type ApprovalStatus = "pending_review" | "approved" | "rejected" | "revoked";

type ActionKind = "approve" | "reject" | "revoke" | "reset";

type ActionResult = {
  ok: boolean;
  message: string;
};

type Props = {
  id: string;
  approvalStatus: ApprovalStatus;
  parsingStatus?: "pending" | "processing" | "completed" | "failed";
  chunkCount?: number;
  hasMissingProductReference?: boolean;
};

const initialResult: ActionResult = {
  ok: false,
  message: "",
};

function getVisibleActions(status: ApprovalStatus): ActionKind[] {
  switch (status) {
    case "pending_review":
      return ["approve", "reject"];
    case "approved":
      return ["revoke"];
    case "rejected":
      return ["approve", "reset"];
    case "revoked":
      return ["reset"];
    default:
      return [];
  }
}

function getActionLabel(action: ActionKind) {
  switch (action) {
    case "approve":
      return "Onayla";
    case "reject":
      return "Reddet";
    case "revoke":
      return "Geri çek";
    case "reset":
      return "Yeniden incele";
  }
}

function getButtonClassName(action: ActionKind) {
  switch (action) {
    case "approve":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15";
    case "reject":
    case "revoke":
      return "border-rose-500/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15";
    case "reset":
      return "border-sky-500/20 bg-sky-500/10 text-sky-200 hover:bg-sky-500/15";
  }
}

function getInputLabel(action: ActionKind) {
  if (action === "approve" || action === "reset") {
    return "Not";
  }

  return "Neden";
}

function getPlaceholder(action: ActionKind) {
  switch (action) {
    case "approve":
      return "Opsiyonel onay notu";
    case "reject":
      return "Red nedeni";
    case "revoke":
      return "Geri çekme nedeni";
    case "reset":
      return "Opsiyonel inceleme notu";
  }
}

function getLocalValidationMessage(action: ActionKind, value: string) {
  if (action === "reject" && !value.trim()) {
    return "Red nedeni zorunludur.";
  }

  if (action === "revoke" && !value.trim()) {
    return "Geri çekme nedeni zorunludur.";
  }

  return null;
}

export default function KnowledgeApprovalActions({
  id,
  approvalStatus,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<ActionKind | null>(null);
  const [note, setNote] = useState("");
  const [result, setResult] = useState<ActionResult>(initialResult);
  const actions = getVisibleActions(approvalStatus);

  function runAction(action: ActionKind) {
    const validationMessage = getLocalValidationMessage(action, note);

    if (validationMessage) {
      setResult({
        ok: false,
        message: validationMessage,
      });
      return;
    }

    startTransition(async () => {
      let nextResult: ActionResult;

      if (action === "approve") {
        nextResult = await approveKnowledgeDocument({
          id,
          approvalNote: note,
        });
      } else if (action === "reject") {
        nextResult = await rejectKnowledgeDocument({
          id,
          rejectionReason: note,
        });
      } else if (action === "revoke") {
        nextResult = await revokeKnowledgeDocument({
          id,
          revokedReason: note,
        });
      } else {
        nextResult = await resetKnowledgeReview({
          id,
          reason: note,
        });
      }

      setResult(nextResult);

      if (nextResult.ok) {
        setNote("");
        setActiveAction(null);
        router.refresh();
      }
    });
  }

  if (actions.length === 0) {
    return null;
  }

  const selectedAction = activeAction ?? actions[0];

  return (
    <details className="group rounded-xl border border-white/8 bg-white/[0.02] px-2 py-1.5">
      <summary className="inline-flex cursor-pointer list-none items-center rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-semibold text-neutral-300 transition hover:bg-white/[0.05] hover:text-white">
        <span>Onay işlemleri</span>
      </summary>

      <div className="mt-2 space-y-1.5">
        <div className="flex flex-wrap gap-1.5">
          {actions.map((action) => (
            <button
              key={action}
              type="button"
              disabled={isPending}
              onClick={() => {
                setActiveAction(action);
                setResult(initialResult);
                setNote("");
              }}
              className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                selectedAction === action
                  ? getButtonClassName(action)
                  : "border-white/10 bg-black/20 text-neutral-400 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {getActionLabel(action)}
            </button>
          ))}
        </div>

        <label className="block space-y-1 rounded-xl border border-white/8 bg-black/15 p-1.5">
          <span className="px-1 text-[11px] font-medium text-neutral-400">
            {getInputLabel(selectedAction)}
          </span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
            rows={1}
            disabled={isPending}
            placeholder={getPlaceholder(selectedAction)}
            className="min-h-[38px] w-full resize-none rounded-lg border border-white/10 bg-black/25 px-2.5 py-1.5 text-xs text-white outline-none placeholder:text-neutral-600 focus:border-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>

        <button
          type="button"
          disabled={isPending}
          onClick={() => runAction(selectedAction)}
          className={`inline-flex w-full justify-center rounded-full border px-3 py-1 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${getButtonClassName(
            selectedAction,
          )}`}
        >
          {isPending ? "İşlem sürüyor..." : getActionLabel(selectedAction)}
        </button>

        {result.message ? (
          <div
            className={`rounded-xl border px-2.5 py-1.5 text-[11px] leading-5 ${
              result.ok
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                : "border-rose-500/20 bg-rose-500/10 text-rose-200"
            }`}
          >
            {result.message}
          </div>
        ) : null}
      </div>
    </details>
  );
}
