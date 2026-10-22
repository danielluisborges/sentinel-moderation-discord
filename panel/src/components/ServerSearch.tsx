import { useQuery } from "@tanstack/react-query";
import { Hash, Search, UserRound, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  ChannelDTO,
  ChannelTreeDTO,
  GuildDTO,
  MemberDTO,
  MemberPageDTO,
} from "../../../src/shared/dto.js";
import { apiRequest } from "../api/client.js";
import { flattenChannels } from "../features/channels/lib/channelTree.js";

export function ServerSearch({ guild }: { guild: GuildDTO }) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const normalized = term.trim();
  const members = useQuery({
    queryKey: ["server-search-members", guild.id, normalized],
    queryFn: () => {
      const params = new URLSearchParams({ query: normalized });
      return apiRequest<MemberPageDTO>(
        `/api/guilds/${guild.id}/members?${params.toString()}`,
      );
    },
    enabled: open && normalized.length >= 2,
  });
  const channels = useQuery({
    queryKey: ["server-search-channels", guild.id],
    queryFn: () =>
      apiRequest<ChannelTreeDTO>(`/api/guilds/${guild.id}/channels`),
    enabled: open && normalized.length >= 2,
  });
  const channelMatches = useMemo(
    () =>
      channels.data
        ? flattenChannels(channels.data).filter((channel) =>
            channel.name
              .toLocaleLowerCase()
              .includes(normalized.toLocaleLowerCase()),
          )
        : [],
    [channels.data, normalized],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function chooseMember(member: MemberDTO) {
    setOpen(false);
    navigate(
      `/guild/${guild.id}/members?search=${encodeURIComponent(member.username)}`,
    );
  }

  function chooseChannel(channel: ChannelDTO) {
    setOpen(false);
    navigate(`/guild/${guild.id}/channels`, {
      state: { channelId: channel.id },
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-9 w-72 items-center gap-2 rounded-md border border-slate-700 bg-slate-900/70 px-3 text-xs text-slate-500 transition hover:border-slate-600 hover:text-slate-300 sm:flex md:w-80 lg:w-96"
        aria-label="Buscar membros e canais no servidor"
      >
        <Search size={14} />
        <span>Buscar no servidor…</span>
        <kbd className="ml-auto rounded border border-slate-700 px-1.5 py-0.5 text-[10px]">
          Ctrl K
        </kbd>
      </button>
      {open && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex justify-center bg-black/65 p-4 pt-[12vh] backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Buscar no servidor"
            className="flex max-h-[min(70vh,620px)] w-full max-w-2xl flex-col overflow-hidden self-start rounded-xl border border-slate-700 bg-[#111a28] shadow-2xl"
          >
            <label className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-800 px-4">
              <Search size={18} className="text-slate-500" />
              <input
                autoFocus
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Buscar membros ou canais…"
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              />
              <button
                type="button"
                aria-label="Fechar busca"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
              >
                <X size={17} />
              </button>
            </label>
            <div className="min-h-24 overflow-y-auto p-2">
              {normalized.length < 2 ? (
                <p className="p-4 text-sm text-slate-500">
                  Digite ao menos 2 caracteres para pesquisar membros e canais.
                </p>
              ) : (
                <>
                  {members.isPending || channels.isPending ? (
                    <p className="p-4 text-sm text-slate-500">Buscando…</p>
                  ) : null}
                  {members.isError && (
                    <p className="p-4 text-sm text-rose-300">
                      {members.error.message}
                    </p>
                  )}
                  {channels.isError && (
                    <p className="p-4 text-sm text-rose-300">
                      {channels.error.message}
                    </p>
                  )}
                  {members.data?.members.map((member) => (
                    <button
                      type="button"
                      key={`member-${member.id}`}
                      onClick={() => chooseMember(member)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-800"
                    >
                      <UserRound size={17} className="text-blue-300" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-slate-100">
                          {member.displayName}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          Membro · @{member.username}
                        </span>
                      </span>
                    </button>
                  ))}
                  {channelMatches.map((channel) => (
                    <button
                      type="button"
                      key={`channel-${channel.id}`}
                      onClick={() => chooseChannel(channel)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-800"
                    >
                      <Hash size={17} className="text-violet-300" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-slate-100">
                          {channel.name}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          Canal
                        </span>
                      </span>
                    </button>
                  ))}
                  {!members.isPending &&
                    !channels.isPending &&
                    members.data?.members.length === 0 &&
                    channelMatches.length === 0 && (
                      <p className="p-4 text-sm text-slate-500">
                        Nenhum membro ou canal encontrado.
                      </p>
                    )}
                </>
              )}
            </div>
            <div className="border-t border-slate-800 px-4 py-2 text-[11px] text-slate-600">
              Pesquise por nome de membro, usuário ou canal
            </div>
          </section>
        </div>
      )}
    </>
  );
}

