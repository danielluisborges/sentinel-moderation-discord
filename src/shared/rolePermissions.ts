export const rolePermissionOptions = [
  { value: "ManageMessages", label: "Gerenciar mensagens" },
  { value: "KickMembers", label: "Expulsar membros" },
  { value: "BanMembers", label: "Banir membros" },
  { value: "ModerateMembers", label: "Aplicar timeout" },
  { value: "ManageChannels", label: "Gerenciar canais" },
  { value: "ManageRoles", label: "Gerenciar cargos" },
] as const;

export type RolePermission = (typeof rolePermissionOptions)[number]["value"];

export const rolePermissionLabels = Object.fromEntries(
  rolePermissionOptions.map(({ value, label }) => [value, label]),
) as Record<RolePermission, string>;
