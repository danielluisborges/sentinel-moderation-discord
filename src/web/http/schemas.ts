import { z } from "zod";

export const snowflakeSchema = z.string().regex(/^\d{15,22}$/);
