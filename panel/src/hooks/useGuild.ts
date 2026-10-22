import { useOutletContext } from "react-router-dom";
import type { GuildDTO } from "../../../src/shared/dto.js";

export function useGuild(): GuildDTO {
  return useOutletContext<{ guild: GuildDTO }>().guild;
}
