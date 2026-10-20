import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  action,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 pb-1 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="mb-1.5 text-[10px] font-semibold tracking-[0.14em] text-primary/70 uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.035em] text-balance">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-5 text-pretty text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 sm:mt-[17px]">{action}</div> : null}
    </header>
  );
}
