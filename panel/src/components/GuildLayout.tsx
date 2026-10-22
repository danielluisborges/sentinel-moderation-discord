import { useQuery } from "@tanstack/react-query";
import { ChevronRight, MoreVertical } from "lucide-react";
import { Link, Outlet, useParams } from "react-router-dom";
import type { GuildDTO } from "../../../src/shared/dto.js";
import { apiRequest, ApiError } from "../api/client.js";
import { Sidebar } from "./Sidebar.js";
import { StatusView } from "./StatusView.js";
import { BrandIcon } from "./BrandIcon.js";
import { ServerSearch } from "./ServerSearch.js";
import { DashboardSkeleton } from "./Skeleton.js";
import { ThemeToggle } from "./ThemeToggle.js";

export function GuildLayout() {
  const { guildId } = useParams();
  const guilds = useQuery({
    queryKey: ["guilds"],
    queryFn: () => apiRequest<GuildDTO[]>("/api/guilds"),
  });

  if (guilds.isPending) return <DashboardSkeleton />;
  if (guilds.error instanceof ApiError && guilds.error.status === 401) {
    return <LoginRequired />;
  }
  if (guilds.isError) {
    return (
      <FullPageMessage
        title="Não foi possível carregar os servidores."
        detail={guilds.error.message}
      />
    );
  }
  const guild = guilds.data.find((entry) => entry.id === guildId);
  if (!guild) {
    return (
      <FullPageMessage
        title="Servidor indisponível"
        detail="O servidor não está acessível pela sua conta ou o Sentinel ainda não foi adicionado a ele."
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b1019] text-slate-200">
      <Sidebar guild={guild} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-slate-800 px-5">
          <div className="flex min-w-0 items-center gap-2 text-xs text-slate-400">
            <span className="truncate">{guild.name}</span>
            <ChevronRight size={14} className="text-slate-600" />
            <span className="text-slate-200">Painel</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ServerSearch guild={guild} />
            <ThemeToggle />
          </div>
          <button
            type="button"
            aria-label="Mais opções"
            className="ml-4 text-slate-500 hover:text-slate-200"
          >
            <MoreVertical size={18} />
          </button>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-5 lg:p-7">
          <Outlet context={{ guild }} />
        </main>
      </div>
    </div>
  );
}

export function LoginRequired() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#0b1019] p-6 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950/70 p-8 text-center shadow-2xl shadow-black/20">
        <BrandIcon size={64} className="mx-auto mb-5 rounded-2xl" />
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
          Sentinel
        </p>
        <h1 className="mt-3 text-2xl font-semibold">
          Entre para abrir o painel
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Conecte sua conta Discord para acessar os servidores que você
          administra.
        </p>
        <a
          href="/auth/discord"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-blue-500 px-5 text-sm font-semibold text-white transition hover:bg-blue-400"
        >
          Continuar com Discord
        </a>
      </div>
    </div>
  );
}

export function FullPageMessage({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-[#0b1019] p-6 text-slate-100">
      <StatusView title={title}>
        {detail ?? "Aguarde um instante e tente novamente."}
        <div className="mt-4">
          <Link to="/" className="text-blue-300 hover:text-blue-200">
            Voltar para seleção de servidor
          </Link>
        </div>
      </StatusView>
    </div>
  );
}
