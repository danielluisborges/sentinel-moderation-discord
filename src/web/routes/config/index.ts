import { Router } from "express";
import { requireGuildAccess } from "../../middleware/requireGuildAccess.js";
import { automationsRouter } from "./automations.js";
import { commandsRouter } from "./commands.js";
import { rolesRouter } from "./roles.js";
import { settingsRouter } from "./settings.js";

export const configRouter = Router({ mergeParams: true });
configRouter.use(...requireGuildAccess);
configRouter.use("/", settingsRouter);
configRouter.use("/roles", rolesRouter);
configRouter.use("/automations", automationsRouter);
configRouter.use("/commands", commandsRouter);
