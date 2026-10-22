import type { AutomationSettingsDTO } from "../../../src/shared/dto.js";
import { PageHeading } from "../components/ui/PageHeading.js";
import { PanelMessage } from "../components/ui/PanelMessage.js";
import { PageSkeleton } from "../components/Skeleton.js";
import { useGuild } from "../hooks/useGuild.js";
import { CommandList } from "../features/commands/components/CommandList.js";
import { AutomationsSection } from "../features/commands/components/AutomationsSection.js";
import { useCommands } from "../features/commands/hooks/useCommands.js";
import { useAutomations } from "../features/commands/hooks/useAutomations.js";

export function CommandsPage() {
  const guild = useGuild();
  const commands = useCommands(guild.id);
  const automation = useAutomations(guild.id);

  return (
    <div>
      <PageHeading
        active="members"
        guildId={guild.id}
        eyebrow={guild.name}
        title="Comandos e automações"
        description="Controle os comandos do Sentinel e configure mensagens para eventos do servidor."
        showLinks={false}
      />
      {(commands.query.isPending || automation.query.isPending) && <PageSkeleton variant="settings" />}
      {(commands.query.isError || automation.query.isError) && (
        <PanelMessage tone="error">
          {commands.query.error?.message ?? automation.query.error?.message}
        </PanelMessage>
      )}
      {commands.query.data && automation.query.data && (
        <div className="max-w-4xl space-y-5">
          <CommandList
            data={commands.query.data}
            error={commands.toggle.isError ? commands.toggle.error.message : undefined}
            pending={commands.toggle.isPending}
            onToggle={(name, enabled) => commands.toggle.mutate({ name, enabled })}
          />
          <AutomationsSection initial={automation.query.data as AutomationSettingsDTO} save={automation.save} />
        </div>
      )}
    </div>
  );
}
