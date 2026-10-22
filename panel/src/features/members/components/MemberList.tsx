import { PageSkeleton } from "../../../components/Skeleton.js";
import { retryOrLogin } from "../../../api/client.js";
import type { useMembersList } from "../hooks/useMembersList.js";
import { MemberListItem } from "./MemberListItem.js";
import { MemberSearchInput } from "./MemberSearchInput.js";

export function MemberList({
  members,
  search,
  selectedId,
  onSearchChange,
  onSelect,
}: {
  members: ReturnType<typeof useMembersList>;
  search: string;
  selectedId: string | null;
  onSearchChange: (value: string) => void;
  onSelect: (memberId: string) => void;
}) {
  const { normalizedSearch, results } = members;
  return (
    <section className="overflow-hidden rounded-xl border border-slate-800 bg-[#0e1521]">
      <div className="flex flex-col gap-3 border-b border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Lista de membros</h2>
          <p className="mt-1 text-xs text-slate-500">
            A lista aparece automaticamente. Pesquise por nome ou usuário.
          </p>
        </div>
        <MemberSearchInput value={search} onChange={onSearchChange} />
      </div>
      <div className="divide-y divide-slate-800/80">
        {normalizedSearch.length === 1 && (
          <div className="p-6 text-center text-sm text-slate-500">
            Digite mais um caractere para pesquisar.
          </div>
        )}
        {members.isPending && normalizedSearch.length !== 1 && (
          <div className="space-y-2 p-3">
            <PageSkeleton variant="rows" />
          </div>
        )}
        {members.isError && (
          <div className="flex flex-col items-start gap-3 p-6 text-sm text-rose-300 sm:flex-row sm:items-center sm:justify-between">
            <span>{members.error.message}</span>
            <button
              type="button"
              onClick={() => retryOrLogin(members.error, members.refetch)}
              className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs text-rose-200 transition hover:bg-rose-500/10"
            >
              Tentar novamente
            </button>
          </div>
        )}
        {(normalizedSearch.length === 0 || normalizedSearch.length >= 2) &&
          !members.isPending &&
          !members.isError &&
          results.length === 0 && (
            <div className="p-6 text-center text-sm text-slate-500">
              Nenhum membro encontrado.
            </div>
          )}
        {!members.isError &&
          results.map((member) => (
            <MemberListItem
              key={member.id}
              member={member}
              selected={selectedId === member.id}
              onSelect={() => onSelect(member.id)}
            />
          ))}
      </div>
      <div className="border-t border-slate-800 px-4 py-3 text-xs text-slate-500">
        {normalizedSearch
          ? `${results.length} resultado${results.length === 1 ? "" : "s"} · máximo de 20 na busca`
          : `${results.length} membro${results.length === 1 ? "" : "s"} carregado${results.length === 1 ? "" : "s"}`}
      </div>
      {!normalizedSearch && members.hasNextPage && (
        <div className="border-t border-slate-800 p-3 text-center">
          <button
            type="button"
            onClick={() => void members.fetchNextPage()}
            disabled={members.isFetchingNextPage}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
          >
            {members.isFetchingNextPage ? "Carregando…" : "Carregar mais membros"}
          </button>
        </div>
      )}
    </section>
  );
}
