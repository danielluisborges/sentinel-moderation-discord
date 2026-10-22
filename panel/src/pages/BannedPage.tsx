import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { BanDTO, GuildDTO } from "../../../src/shared/dto.js";
import { apiRequest, ApiError, retryOrLogin } from "../api/client.js";
import { Avatar } from "../components/Avatar.js";
import { ConfirmDialog } from "../components/ConfirmDialog.js";
import { StatusView } from "../components/StatusView.js";
import { PageSkeleton } from "../components/Skeleton.js";
import { PageHeading } from "../components/ui/PageHeading.js";

export function BannedPage() {
  const { guild } = useOutletContext<{ guild: GuildDTO }>();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState<BanDTO | null>(null);
  const banned = useQuery({
    queryKey: ["bans", guild.id],
    queryFn: () => apiRequest<BanDTO[]>(`/api/guilds/${guild.id}/bans`),
  });
  const unban = useMutation({
    meta: { successMessage: "Banimento removido e registrado nos logs." },
    mutationFn: (userId: string) =>
      apiRequest<void>(`/api/guilds/${guild.id}/bans/${userId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      setConfirming(null);
      await queryClient.invalidateQueries({ queryKey: ["bans", guild.id] });
    },
  });

  return (
    <div>
      <PageHeading
        active="banned"
        guildId={guild.id}
        eyebrow={guild.name}
        title="Banidos"
        description="Consulte os banimentos e remova o acesso quando necessário."
      />
      <section className="overflow-hidden rounded-xl border border-slate-800 bg-[#0e1521]">
        <div className="flex items-center justify-between border-b border-slate-800 p-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Lista de banimentos
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Os registros e ações ficam no canal privado de logs.
            </p>
          </div>
          <span className="rounded-md border border-slate-700 bg-slate-950/50 px-2.5 py-1 text-xs text-slate-400">
            {banned.data?.length ?? "—"} registros
          </span>
        </div>
        {banned.isPending && (
          <div className="space-y-2 p-4">
            <PageSkeleton variant="rows" />
          </div>
        )}
        {banned.isError && (
          <div className="p-6">
            <StatusView title="Não foi possível carregar os banimentos">
              {banned.error.message}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => retryOrLogin(banned.error, banned.refetch)}
                  className="text-sm text-blue-300 hover:text-blue-200"
                >
                  {banned.error instanceof ApiError &&
                  banned.error.status === 401
                    ? "Entrar novamente"
                    : "Tentar novamente"}
                </button>
              </div>
            </StatusView>
          </div>
        )}
        {banned.isSuccess && banned.data.length === 0 && (
          <div className="p-6">
            <StatusView title="Nenhum banimento ativo">
              Quando um membro for banido, ele aparecerá nesta lista.
            </StatusView>
          </div>
        )}
        {banned.isSuccess && banned.data.length > 0 && (
          <div className="divide-y divide-slate-800/80">
            {banned.data.map((entry) => (
              <div
                key={entry.userId}
                className="flex flex-wrap items-center gap-3 px-4 py-3.5"
              >
                <Avatar name={entry.username} src={entry.avatarUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-100">
                    {entry.username}
                  </p>
                  <p className="mt-1 truncate text-xs text-slate-500">
                    {entry.reason || "Sem motivo registrado"}
                  </p>
                </div>
                <span className="hidden font-mono text-xs text-slate-600 md:block">
                  {entry.userId}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setConfirming(entry);
                    unban.reset();
                  }}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-blue-400/50 hover:bg-blue-500/10 hover:text-blue-200"
                >
                  Desbanir
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirming !== null}
        title="Remover banimento?"
        description={
          <>
            <span className="font-medium text-slate-200">
              {confirming?.username}
            </span>{" "}
            poderá entrar novamente no servidor.
          </>
        }
        confirmLabel="Confirmar desbanimento"
        pendingLabel="Removendo…"
        pending={unban.isPending}
        error={unban.isError ? unban.error.message : undefined}
        tone="primary"
        onConfirm={() => {
          if (confirming) unban.mutate(confirming.userId);
        }}
        onClose={() => setConfirming(null)}
      />
    </div>
  );
}
