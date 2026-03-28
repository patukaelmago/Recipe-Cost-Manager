// shared/schema.ts
import { z } from "zod";

export const insertIngredientSchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
  packageSize: z.coerce.number().positive(),
  price: z.coerce.number().nonnegative(),
});

export type InsertIngredient = z.infer<typeof insertIngredientSchema>;

/* =========================
   RECIPES
========================= */

export const insertRecipeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
  // AGREGADO: Esto permite que la receta guarde su propio margen
  pricingPercentage: z.coerce.number().nonnegative().default(50),
});

export type InsertRecipe = z.infer<typeof insertRecipeSchema>;