import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  FolderKanban,
  Hash,
  RefreshCw,
  Server,
  UsersRound,
  Volume2,
  type LucideIcon,
} from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import type { GuildDTO, GuildOverviewDTO } from "../../../src/shared/dto.js";
import { apiRequest, ApiError, retryOrLogin } from "../api/client.js";
import { PageSkeleton } from "../components/Skeleton.js";

export function OverviewPage() {
  const { guild } = useOutletContext<{ guild: GuildDTO }>();
  const overview = useQuery({
    queryKey: ["overview", guild.id],
    queryFn: () =>
      apiRequest<GuildOverviewDTO>(`/api/guilds/${guild.id}/overview`),
  });

  return (
    <div>
      <div className="mb-7">
        <p className="text-xs font-medium text-slate-500">{guild.name}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-100">
          Visão geral
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Resumo do servidor e acesso rápido à administração.
        </p>
      </div>

      {overview.isPending && <PageSkeleton variant="overview" />}
      {overview.isError && (
        <div className="space-y-3 rounded-xl border border-rose-900/60 bg-rose-950/20 p-5">
          <p className="text-sm text-rose-200">{overview.error.message}</p>
          <button
            type="button"
            onClick={() => retryOrLogin(overview.error, overview.refetch)}
            className="inline-flex items-center gap-2 text-sm text-rose-100 hover:text-white"
          >
            <RefreshCw size={15} />
            {overview.error instanceof ApiError && overview.error.status === 401
              ? "Entrar novamente"
              : "Tentar novamente"}
          </button>
        </div>
      )}

      {overview.data && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={UsersRound}
              label="Membros"
              value={overview.data.memberCount}
              accent="blue"
            />
            <MetricCard
              icon={Hash}
              label="Canais de texto"
              value={overview.data.textChannelCount}
              accent="violet"
            />
            <MetricCard
              icon={Volume2}
              label="Canais de voz"
              value={overview.data.voiceChannelCount}
              accent="emerald"
            />
            <MetricCard
              icon={FolderKanban}
              label="Categorias"
              value={overview.data.categoryCount}
              accent="amber"
            />
          </section>

          <section className="mt-7 rounded-xl border border-slate-800 bg-[#0e1521] p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-500/10 text-blue-300">
                <Server size={19} />
              </span>
              <div>
                <h2 className="font-semibold text-slate-100">
                  Servidor conectado
                </h2>
                <p className="mt-0.5 text-sm text-slate-400">
                  Sentinel está ativo em {guild.name}.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 border-t border-slate-800 pt-4 sm:grid-cols-3">
              <QuickLink
                to={`/guild/${guild.id}/members`}
                icon={UsersRound}
                label="Ver membros"
              />
              <QuickLink
                to={`/guild/${guild.id}/banned`}
                icon={UsersRound}
                label="Gerenciar banimentos"
              />
              <QuickLink
                to={`/guild/${guild.id}/channels`}
                icon={Hash}
                label="Gerenciar canais"
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  accent: "blue" | "violet" | "emerald" | "amber";
}) {
  const colors = {
    blue: "bg-blue-500/10 text-blue-300",
    violet: "bg-violet-500/10 text-violet-300",
    emerald: "bg-emerald-500/10 text-emerald-300",
    amber: "bg-amber-500/10 text-amber-300",
  };
  return (
    <article className="rounded-xl border border-slate-800 bg-[#0e1521] p-5">
      <span
        className={`grid size-10 place-items-center rounded-xl ${colors[accent]}`}
      >
        <Icon size={19} />
      </span>
      <p className="mt-4 text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-100">
        {value.toLocaleString("pt-BR")}
      </p>
    </article>
  );
}

function QuickLink({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-sm text-slate-300 transition hover:border-slate-700 hover:bg-slate-800/70 hover:text-white"
    >
      <Icon size={17} className="text-slate-400" />
      <span className="flex-1">{label}</span>
      <ArrowRight size={15} className="text-slate-500" />
    </Link>
  );
}
