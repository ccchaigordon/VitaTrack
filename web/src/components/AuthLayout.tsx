import type { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  title: string;
  subtitle: string;
}>;

export function AuthLayout({ title, subtitle, children }: Props) {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 gap-10 p-6 lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col">
          <div className="mb-10 flex items-center gap-2 text-sm font-semibold tracking-wide text-slate-700">
            <span className="inline-block h-6 w-6 rounded-full bg-slate-900" />
            <span>Logo</span>
          </div>

          <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>

          <div className="mt-8 max-w-sm">{children}</div>
        </div>

        <div className="hidden lg:block">
          <div className="aspect-4/5 w-full overflow-hidden rounded-3xl bg-linear-to-br from-emerald-900/30 via-emerald-700/20 to-slate-900/30" />
        </div>
      </div>
    </div>
  );
}
