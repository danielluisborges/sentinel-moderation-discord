import { useEffect, useState } from "react";
import { PageSkeleton } from "../components/Skeleton.js";
import { PageHeading } from "../components/ui/PageHeading.js";
import { PanelMessage } from "../components/ui/PanelMessage.js";
import { CreateRoleForm } from "../features/settings/components/CreateRoleForm.js";
import { CommandRegistrationSection } from "../features/settings/components/CommandRegistrationSection.js";
import { GuildSettingsForm } from "../features/settings/components/GuildSettingsForm.js";
import { RoleManagerSection } from "../features/settings/components/RoleManagerSection.js";
import { useGuild } from "../hooks/useGuild.js";
import { useGuildSettings } from "../hooks/useGuildSettings.js";

export function SettingsPage() {
  const guild = useGuild();
  const settings = useGuildSettings(guild.id);
  const [selectedRoleId, setSelectedRoleId] = useState("");

  useEffect(() => {
    if (!settings.data) return;
    setSelectedRoleId((current) =>
      settings.data.roles.some((role) => role.id === current)
        ? current
        : (settings.data.roles[0]?.id ?? ""),
    );
  }, [settings.data]);

  return (
    <div>
      <PageHeading
        guildId={guild.id}
        eyebrow={guild.name}
        title="Configurações"
        description="Ajuste os cargos e os canais usados pelo Sentinel neste servidor."
        showLinks={false}
      />
      {settings.isPending && <PageSkeleton variant="settings" />}
      {settings.isError && (
        <PanelMessage tone="error">{settings.error.message}</PanelMessage>
      )}
      {settings.data && (
        <div className="max-w-3xl space-y-5">
          <CommandRegistrationSection guildId={guild.id} />
          <GuildSettingsForm guildId={guild.id} initial={settings.data}>
            <RoleManagerSection
              guildId={guild.id}
              roles={settings.data.roles}
              roleId={selectedRoleId}
              onRoleChange={setSelectedRoleId}
              onRoleDeleted={() => setSelectedRoleId("")}
            />
            <CreateRoleForm guildId={guild.id} onCreated={setSelectedRoleId} />
          </GuildSettingsForm>
        </div>
      )}
    </div>
  );
}
