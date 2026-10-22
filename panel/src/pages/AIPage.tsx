import { useGuild } from "../hooks/useGuild.js";
import { useGuildSettings } from "../hooks/useGuildSettings.js";
import { useToggleAi } from "../features/ai/hooks/useToggleAi.js";
import { AiProviderCard } from "../features/ai/components/AiProviderCard.js";
import { AiCommandToggleCard } from "../features/ai/components/AiCommandToggleCard.js";
import { ChannelStructureGenerator } from "../features/ai/components/ChannelStructureGenerator.js";
import { PageHeading } from "../components/ui/PageHeading.js";
import { PanelMessage } from "../components/ui/PanelMessage.js";
import { PageSkeleton } from "../components/Skeleton.js";

export function AIPage() {
  const guild = useGuild();
  const settings = useGuildSettings(guild.id);
  const toggle = useToggleAi(guild.id);

  return (
    <div>
      <PageHeading
        active="members"
        guildId={guild.id}
        eyebrow={guild.name}
        title="IA do Sentinel"
        description="Controle o acesso ao comando /prompt neste servidor."
        showLinks={false}
      />
      {settings.isPending && <PageSkeleton variant="ai" />}
      {settings.isError && <PanelMessage tone="error">{settings.error.message}</PanelMessage>}
      {settings.data && (
        <div className="max-w-3xl space-y-5">
          <AiProviderCard settings={settings.data} />
          <AiCommandToggleCard
            settings={settings.data}
            pending={toggle.isPending}
            onToggle={() => toggle.mutate(!settings.data.aiEnabled)}
          />
          <ChannelStructureGenerator guildId={guild.id} settings={settings.data} />
          {toggle.isError && <PanelMessage tone="error">{toggle.error.message}</PanelMessage>}
          <p className="text-xs leading-5 text-slate-500">
            O Sentinel responde perguntas pelo /prompt. Ele não executa ações de moderação por conversa; essas ações continuam disponíveis nos comandos próprios e no painel.
          </p>
        </div>
      )}
    </div>
  );
}
