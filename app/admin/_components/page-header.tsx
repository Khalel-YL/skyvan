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
    <div className="flex flex-col gap-3 border-b border-white/10 pb-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-4xl">
        {eyebrow ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            {eyebrow}
          </p>
        ) : null}

        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
          {title}
        </h1>

        <p className="mt-1 max-w-3xl text-sm leading-5 text-neutral-400">{description}</p>
      </div>

      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
