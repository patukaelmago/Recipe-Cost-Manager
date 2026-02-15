
import { pgTable, text, serial, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: numeric("price").notNull(), // Price of the package
  unit: text("unit").notNull(), // e.g., "kg", "g", "l", "ml", "u"
  packageSize: numeric("package_size").notNull().default("1"), // Amount in the package (e.g. 1000 for 1kg if using grams, or 1 for 1kg)
  createdAt: timestamp("created_at").defaultNow(),
});

export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const recipeIngredients = pgTable("recipe_ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id),
  ingredientId: integer("ingredient_id").notNull().references(() => ingredients.id),
  quantity: numeric("quantity").notNull(), // Amount used in the recipe
});

// === RELATIONS ===

export const recipesRelations = relations(recipes, ({ many }) => ({
  ingredients: many(recipeIngredients),
}));

export const ingredientsRelations = relations(ingredients, ({ many }) => ({
  usedIn: many(recipeIngredients),
}));

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeIngredients.recipeId],
    references: [recipes.id],
  }),
  ingredient: one(ingredients, {
    fields: [recipeIngredients.ingredientId],
    references: [ingredients.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertIngredientSchema = createInsertSchema(ingredients).omit({ id: true, createdAt: true });
export const insertRecipeSchema = createInsertSchema(recipes).omit({ id: true, createdAt: true });
export const insertRecipeIngredientSchema = createInsertSchema(recipeIngredients).omit({ id: true });

// === EXPLICIT API CONTRACT TYPES ===

export type Ingredient = typeof ingredients.$inferSelect;
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;

export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;

export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type InsertRecipeIngredient = z.infer<typeof insertRecipeIngredientSchema>;

// Request types
export type CreateIngredientRequest = InsertIngredient;
export type UpdateIngredientRequest = Partial<InsertIngredient>;

export type CreateRecipeRequest = InsertRecipe;
export type UpdateRecipeRequest = Partial<InsertRecipe>;

export type AddRecipeIngredientRequest = InsertRecipeIngredient;

// Response types including relations
export type RecipeWithIngredients = Recipe & {
  ingredients: (RecipeIngredient & { ingredient: Ingredient })[];
};

