import { useMutation } from "@tanstack/react-query";
import { Bot, RefreshCw } from "lucide-react";
import { apiRequest } from "../../../api/client.js";
import { PanelMessage } from "../../../components/ui/PanelMessage.js";
import { SectionCard } from "../../../components/ui/SectionCard.js";

export function CommandRegistrationSection({ guildId }: { guildId: string }) {
  const register = useMutation({
    meta: { successMessage: "Comandos registrados neste servidor." },
    mutationFn: () =>
      apiRequest<{ commandCount: number }>(
        `/api/guilds/${guildId}/config/commands/register`,
        { method: "POST" },
      ),
  });

  return (
    <SectionCard
      title="Comandos do Discord"
      description="Registre os slash commands neste servidor sem reiniciar o Sentinel."
      icon={<Bot size={19} />}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">ID do servidor atual</p>
          <code className="mt-1 block text-sm text-slate-300">{guildId}</code>
        </div>
        <button
          type="button"
          onClick={() => register.mutate()}
          disabled={register.isPending}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-500 px-4 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={register.isPending ? "animate-spin" : undefined}
          />
          {register.isPending ? "Registrando…" : "Registrar comandos"}
        </button>
      </div>
      {register.isError && (
        <div className="mt-4">
          <PanelMessage tone="error">{register.error.message}</PanelMessage>
        </div>
      )}
    </SectionCard>
  );
}
