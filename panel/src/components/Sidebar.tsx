import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  Bot,
  ChevronDown,
  Hash,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import type { GuildDTO } from "../../../src/shared/dto.js";
import { apiRequest } from "../api/client.js";
import { BrandIcon } from "./BrandIcon.js";

const navigation: {
  label: string;
  Icon: LucideIcon;
  path: string;
}[] = [
  { label: "Visão geral", Icon: LayoutDashboard, path: "overview" },
  { label: "Membros", Icon: UsersRound, path: "members" },
  { label: "Banidos", Icon: Ban, path: "banned" },
  { label: "Canais", Icon: Hash, path: "channels" },
  { label: "Configurações", Icon: Settings, path: "settings" },
  { label: "Comandos", Icon: Bot, path: "commands" },
  { label: "IA", Icon: Sparkles, path: "ai" },
];

export function Sidebar({ guild }: { guild: GuildDTO }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const logout = useMutation({
    meta: { suppressToast: true },
    mutationFn: () => apiRequest<void>("/auth/logout", { method: "POST" }),
    onSettled: async () => {
      await queryClient.clear();
      navigate("/");
    },
  });

  return (
    <aside className="flex h-screen w-[264px] shrink-0 flex-col border-r border-slate-800 bg-[#0d131e] max-lg:w-60 max-md:w-[72px]">
      <div className="flex h-12 items-center border-b border-slate-800 px-5 max-md:justify-center max-md:px-0">
        <Link
          to="/"
          className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-slate-100 max-md:text-base"
        >
          <BrandIcon size={30} className="rounded-lg" />
          <span className="max-md:hidden">Sentinel</span>
        </Link>
      </div>
      <div className="border-b border-slate-800 p-3">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-900/70 p-2.5 transition hover:border-slate-600"
          title={guild.name}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-700 text-sm font-bold text-white">
            {guild.icon ? (
              <img
                src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=96`}
                alt=""
              />
            ) : (
              guild.name.slice(0, 1)
            )}
          </span>
          <span className="min-w-0 flex-1 max-md:hidden">
            <span className="block truncate text-sm font-medium text-slate-100">
              {guild.name}
            </span>
            <span className="mt-0.5 block text-xs text-slate-500">
              Painel do servidor
            </span>
          </span>
          <ChevronDown size={15} className="text-slate-500 max-md:hidden" />
        </Link>
      </div>

      <nav
        aria-label="Navegação do servidor"
        className="flex-1 space-y-1 px-3 py-5"
      >
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={`/guild/${guild.id}/${item.path}`}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition max-md:justify-center max-md:px-0 ${isActive ? "bg-blue-500/15 font-medium text-blue-300 ring-1 ring-inset ring-blue-400/10" : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"}`
            }
            title={item.label}
          >
            <item.Icon size={18} strokeWidth={1.8} />
            <span className="max-md:hidden">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <button
          type="button"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-slate-800/70 max-md:justify-center"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-700 font-semibold text-slate-100">
            D
          </span>
          <span className="min-w-0 flex-1 max-md:hidden">
            <span className="block text-sm font-medium text-slate-200">
              Sessão conectada
            </span>
            <span className="block text-xs text-slate-500">Sair do painel</span>
          </span>
          <LogOut size={16} className="text-slate-500 max-md:hidden" />
        </button>
      </div>
    </aside>
  );
}
