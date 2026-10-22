export const moderationActions = [
  { value: "ban", optionLabel: "Banir permanentemente", buttonLabel: "Banir membro" },
  { value: "kick", optionLabel: "Expulsar do servidor", buttonLabel: "Expulsar membro" },
  { value: "warn", optionLabel: "Aplicar aviso", buttonLabel: "Aplicar aviso" },
  { value: "timeout", optionLabel: "Aplicar timeout", buttonLabel: "Aplicar timeout" },
  { value: "untimeout", optionLabel: "Remover timeout", buttonLabel: "Remover timeout" },
] as const;

export type ModerationAction = (typeof moderationActions)[number]["value"];

export function moderationActionLabel(action: ModerationAction) {
  return moderationActions.find((item) => item.value === action)!.buttonLabel;
}
