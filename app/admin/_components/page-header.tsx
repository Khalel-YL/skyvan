import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500">
            {eyebrow}
          </p>
        ) : null}

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
          {title}
        </h1>

        <p className="mt-3 text-sm leading-6 text-neutral-400">{description}</p>
      </div>

      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}