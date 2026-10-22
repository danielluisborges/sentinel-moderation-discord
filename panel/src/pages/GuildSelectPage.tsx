import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { GuildDTO } from "../../../src/shared/dto.js";
import { apiRequest, ApiError } from "../api/client.js";
import { Avatar } from "../components/Avatar.js";
import { LoginRequired } from "../components/GuildLayout.js";
import { StatusView } from "../components/StatusView.js";
import { BrandIcon } from "../components/BrandIcon.js";
import { GuildListSkeleton } from "../components/Skeleton.js";

export function GuildSelectPage() {
  const guilds = useQuery({
    queryKey: ["guilds"],
    queryFn: () => apiRequest<GuildDTO[]>("/api/guilds"),
  });
  if (guilds.isPending) return <GuildListSkeleton />;
  if (guilds.error instanceof ApiError && guilds.error.status === 401)
    return <LoginRequired />;
  if (guilds.isError) return <Centered>{guilds.error.message}</Centered>;
  if (guilds.data.length === 0) {
    return (
      <Centered>
        Nenhum servidor disponível. Adicione o Sentinel a um servidor que você
        administra.
      </Centered>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1019] px-5 py-12 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-3">
          <BrandIcon size={44} />
          <span className="text-xl font-bold">Sentinel</span>
        </div>
        <div className="mt-12 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
            Painel de controle
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Escolha um servidor
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Selecione um servidor onde você tem acesso administrativo e o
            Sentinel está ativo.
          </p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {guilds.data.map((guild) => (
            <Link
              key={guild.id}
              to={`/guild/${guild.id}/members`}
              className="group flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition hover:border-blue-400/50 hover:bg-slate-900"
            >
              <Avatar
                name={guild.name}
                src={
                  guild.icon
                    ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=96`
                    : null
                }
                size="lg"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-slate-100">
                  {guild.name}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  Abrir painel
                </span>
              </span>
              <ArrowRight
                size={17}
                className="text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-blue-300"
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-[#0b1019] p-6 text-center text-sm text-slate-400">
      <StatusView title="Sentinel">{children}</StatusView>
    </div>
  );
}
import type { ReactNode } from "react";
