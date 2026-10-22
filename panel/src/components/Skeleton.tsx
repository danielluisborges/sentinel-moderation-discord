type PageSkeletonVariant = "overview" | "rows" | "settings" | "channels" | "ai";

function Block({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-slate-800/80 ${className}`}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando painel"
      className="flex min-h-screen overflow-hidden bg-[#0b1019] text-slate-200"
    >
      <span className="sr-only">Carregando painel do servidor…</span>
      <aside className="hidden w-60 shrink-0 border-r border-slate-800 p-4 md:block">
        <Block className="mb-7 h-7 w-32" />
        <Block className="mb-6 h-14 w-full rounded-xl" />
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Block key={index} className="h-9 w-full rounded-lg" />
          ))}
        </div>
        <Block className="mt-10 h-12 w-full rounded-xl" />
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex h-12 items-center justify-between border-b border-slate-800 px-5">
          <Block className="h-4 w-36" />
          <Block className="h-8 w-64 rounded-lg" />
          <Block className="h-5 w-5 rounded-full" />
        </header>
        <main className="space-y-6 p-5 lg:p-7">
          <div className="space-y-2">
            <Block className="h-3 w-24" />
            <Block className="h-8 w-48" />
            <Block className="h-4 w-72 max-w-full" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Block key={index} className="h-36 rounded-xl" />
            ))}
          </div>
          <Block className="h-44 rounded-xl" />
        </main>
      </div>
    </div>
  );
}

export function GuildListSkeleton() {
  return (
    <div
      role="status"
      aria-label="Carregando servidores"
      className="min-h-screen bg-[#0b1019] px-5 py-12 sm:px-8"
    >
      <span className="sr-only">Carregando servidores…</span>
      <div className="mx-auto max-w-4xl">
        <Block className="h-11 w-40 rounded-xl" />
        <div className="mb-8 mt-12 space-y-3">
          <Block className="h-3 w-36" />
          <Block className="h-9 w-64" />
          <Block className="h-4 w-[28rem] max-w-full" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Block key={index} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PageSkeleton({
  variant = "rows",
}: {
  variant?: PageSkeletonVariant;
}) {
  if (variant === "overview") {
    return (
      <div
        role="status"
        aria-label="Carregando visão geral"
        className="space-y-6"
      >
        <span className="sr-only">Carregando visão geral…</span>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Block key={index} className="h-36 rounded-xl" />
          ))}
        </div>
        <Block className="h-44 rounded-xl" />
      </div>
    );
  }

  if (variant === "channels") {
    return (
      <div
        role="status"
        aria-label="Carregando canais"
        className="grid min-h-[620px] gap-3 xl:grid-cols-[252px_minmax(0,1fr)_320px]"
      >
        <span className="sr-only">Carregando canais…</span>
        <Block className="rounded-xl" />
        <Block className="rounded-xl" />
        <Block className="rounded-xl" />
      </div>
    );
  }

  if (variant === "settings" || variant === "ai") {
    return (
      <div
        role="status"
        aria-label="Carregando configurações"
        className="max-w-3xl space-y-5"
      >
        <span className="sr-only">Carregando configurações…</span>
        <Block className="h-36 rounded-xl" />
        <Block className="h-36 rounded-xl" />
      </div>
    );
  }

  return (
    <div role="status" aria-label="Carregando lista" className="space-y-2">
      <span className="sr-only">Carregando lista…</span>
      {Array.from({ length: 5 }, (_, index) => (
        <Block key={index} className="h-16 rounded-lg" />
      ))}
    </div>
  );
}
