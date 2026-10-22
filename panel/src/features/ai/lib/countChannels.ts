import type { ChannelStructurePlan } from "../../../../../src/shared/dto.js";

export function countChannels(plan: ChannelStructurePlan): number {
  return (
    plan.channels.length +
    plan.categories.reduce(
      (total, category) => total + category.channels.length,
      0,
    )
  );
}
