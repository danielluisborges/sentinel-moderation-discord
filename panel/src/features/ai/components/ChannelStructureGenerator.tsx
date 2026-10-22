import { useState } from "react";
import { Globe, LockKeyhole, Sparkles, WandSparkles } from "lucide-react";
import type { ChannelStructurePlan, GuildSettingsDTO } from "../../../../../src/shared/dto.js";
import { ConfirmDialog } from "../../../components/ConfirmDialog.js";
import { PanelMessage } from "../../../components/ui/PanelMessage.js";
import { buttonClass } from "../../../components/ui/formStyles.js";
import { useChannelStructurePlan } from "../hooks/useChannelStructurePlan.js";
import { countChannels } from "../lib/countChannels.js";
import { ChannelStructurePreview } from "./ChannelStructurePreview.js";

export function ChannelStructureGenerator({
  guildId,
  settings,
}: {
  guildId: string;
  settings: GuildSettingsDTO;
}) {
  const [structurePrompt, setStructurePrompt] = useState("");
  const [channelPlan, setChannelPlan] = useState<ChannelStructurePlan | null>(null);
  const [confirmStructure, setConfirmStructure] = useState(false);
  const { generateStructure, createStructure } = useChannelStructurePlan(
    guildId,
    () => setConfirmStructure(false),
  );

  async function generate() {
    try {
      const result = await generateStructure.mutateAsync(structurePrompt);
      setChannelPlan(result.plan);
    } catch {
      // O erro da mutação é exibido no formulário.
    }
  }

  return (
    <>
      <section className="rounded-xl border border-slate-800 bg-[#0e1521] p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-cyan-500/10 text-cyan-300">
            <WandSparkles size={19} />
          </span>
          <div>
            <h2 className="font-semibold text-slate-100">Estrutura de canais com IA</h2>
            <p className="mt-1 text-sm text-slate-400">
              Descreva seu servidor. A IA organiza uma prévia visual para você revisar antes de criar qualquer canal.
            </p>
          </div>
        </div>
        {!settings.aiConfigured && (
          <p className="mt-4 rounded-lg border border-amber-700/30 bg-amber-500/5 p-3 text-sm text-amber-200">
            Configure a chave do provedor principal no backend para gerar estruturas.
          </p>
        )}
        <label className="mt-4 block text-sm text-slate-300" htmlFor="channel-structure-prompt">
          Como deve ser a estrutura?
          <textarea
            id="channel-structure-prompt"
            value={structurePrompt}
            onChange={(event) => setStructurePrompt(event.target.value)}
            maxLength={1200}
            rows={3}
            placeholder="Ex.: servidor de comunidade gamer, com áreas de informações, bate-papo, jogos, voz e suporte. Deixe suporte privado para moderadores."
            className="mt-2 w-full resize-y rounded-lg border border-slate-700 bg-slate-950/60 p-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-400"
          />
        </label>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Gera até 8 categorias e 30 canais. Nenhum canal é criado antes da confirmação.
          </p>
          <button
            type="button"
            disabled={!settings.aiConfigured || structurePrompt.trim().length < 5 || generateStructure.isPending}
            onClick={() => void generate()}
            className={`${buttonClass} inline-flex items-center gap-2`}
          >
            <Sparkles size={16} />
            {generateStructure.isPending ? "Montando estrutura…" : "Gerar estrutura"}
          </button>
        </div>
        {generateStructure.isError && (
          <div className="mt-4"><PanelMessage tone="error">{generateStructure.error.message}</PanelMessage></div>
        )}
        {channelPlan && (
          <div className="mt-5 border-t border-slate-800 pt-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Estrutura sugerida</h3>
                <p className="mt-1 text-xs text-slate-400">
                  {channelPlan.categories.length} categorias · {countChannels(channelPlan)} canais
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1.5"><Globe size={14} className="text-emerald-300" />Público</span>
                <span className="inline-flex items-center gap-1.5"><LockKeyhole size={14} className="text-amber-300" />Moderadores</span>
              </div>
            </div>
            <ChannelStructurePreview plan={channelPlan} />
            {createStructure.isError && (
              <div className="mt-3"><PanelMessage tone="error">{createStructure.error.message}</PanelMessage></div>
            )}
            <button
              type="button"
              disabled={createStructure.isPending}
              onClick={() => {
                createStructure.reset();
                setConfirmStructure(true);
              }}
              className={`${buttonClass} mt-4 inline-flex items-center gap-2`}
            >
              <WandSparkles size={16} /> Aplicar estrutura
            </button>
          </div>
        )}
      </section>
      <ConfirmDialog
        open={confirmStructure}
        title="Criar esta estrutura de canais?"
        description={
          <>
            O Sentinel criará <strong className="text-slate-200">{channelPlan ? countChannels(channelPlan) : 0} canais</strong> em <strong className="text-slate-200">{channelPlan?.categories.length ?? 0} categorias</strong>. Cada criação será registrada no canal privado de logs. Esta ação não apaga canais existentes.
          </>
        }
        confirmLabel="Criar canais"
        pendingLabel="Criando canais…"
        pending={createStructure.isPending}
        error={createStructure.isError ? createStructure.error.message : undefined}
        tone="primary"
        onConfirm={() => {
          if (!channelPlan) return;
          createStructure.mutate(channelPlan);
        }}
        onClose={() => setConfirmStructure(false)}
      />
    </>
  );
}
