import { z } from "zod";

export const tokenTickerSchema = z
  .string()
  .min(2)
  .max(12)
  .regex(/^[A-Z0-9]+$/);
