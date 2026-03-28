// shared/schema.ts
import { z } from "zod";

/* =========================
    INGREDIENTS
========================= */

export const insertIngredientSchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
  packageSize: z.coerce.number().positive(),
  price: z.coerce.number().nonnegative(),
});

export type InsertIngredient = z.infer<typeof insertIngredientSchema>;

export const ingredientSchema = insertIngredientSchema.extend({
  id: z.string(),
});

export type Ingredient = z.infer<typeof ingredientSchema>;

/* =========================
    RECIPES
========================= */

// Esto arregla el error al CREAR
export const insertRecipeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(""),
  pricingPercentage: z.coerce.number().nonnegative().default(50),
});

export type InsertRecipe = z.infer<typeof insertRecipeSchema>;

// ESTO ARREGLA EL ERROR DE LA LÍNEA 94 EN RECIPEDETAIL (LECTURA)
export const recipeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  pricingPercentage: z.number().optional().default(50), // <--- ESTO ES CLAVE
  ingredients: z.array(z.any()).optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});

export type Recipe = z.infer<typeof recipeSchema>;