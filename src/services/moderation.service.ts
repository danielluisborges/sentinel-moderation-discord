import type { ConfigService } from "./config.service.js";
import { configService } from "./config.service.js";
import type { LoggerService } from "./logger.service.js";
import { loggerService } from "./logger.service.js";
import { ModerationActionsService } from "./moderation/moderation.service.js";
import { ModerationMemberService } from "./moderation/member.service.js";
import { ModerationRoleService } from "./moderation/role.service.js";
import type {
  ClearAction,
  CreateRoleAction,
  DeleteRoleAction,
  EditMemberAction,
  TargetAction,
} from "./moderation/shared.js";
import type { Role } from "discord.js";

export type {
  BaseAction,
  ClearAction,
  CreateRoleAction,
  DeleteRoleAction,
  EditMemberAction,
  ModerationSource,
  TargetAction,
} from "./moderation/shared.js";

/** Stable facade kept for commands, routes, and tests using moderationService. */
export class ModerationService {
  private readonly actions: ModerationActionsService;
  private readonly members: ModerationMemberService;
  private readonly roles: ModerationRoleService;

  constructor(
    configs: ConfigService = configService,
    logs: LoggerService = loggerService,
  ) {
    this.actions = new ModerationActionsService(configs, logs);
    this.members = new ModerationMemberService(configs, logs);
    this.roles = new ModerationRoleService(configs, logs);
  }

  ban(input: TargetAction): Promise<void> {
    return this.actions.ban(input);
  }

  unban(input: TargetAction): Promise<void> {
    return this.actions.unban(input);
  }

  kick(input: TargetAction): Promise<void> {
    return this.actions.kick(input);
  }

  timeout(input: TargetAction & { durationMs: number }): Promise<void> {
    return this.actions.timeout(input);
  }

  removeTimeout(input: TargetAction): Promise<void> {
    return this.actions.removeTimeout(input);
  }

  warn(input: TargetAction): Promise<number> {
    return this.actions.warn(input);
  }

  editMember(input: EditMemberAction): Promise<void> {
    return this.members.editMember(input);
  }

  createRole(input: CreateRoleAction): Promise<Role> {
    return this.roles.createRole(input);
  }

  deleteRole(input: DeleteRoleAction): Promise<void> {
    return this.roles.deleteRole(input);
  }

  clear(input: ClearAction): Promise<number> {
    return this.actions.clear(input);
  }
}

export const moderationService = new ModerationService();
