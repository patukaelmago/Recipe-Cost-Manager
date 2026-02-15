
import { db } from "./db";
import {
  ingredients,
  recipes,
  recipeIngredients,
  type Ingredient,
  type InsertIngredient,
  type Recipe,
  type InsertRecipe,
  type RecipeIngredient,
  type InsertRecipeIngredient,
  type UpdateIngredientRequest,
  type UpdateRecipeRequest,
} from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Ingredients
  getIngredients(): Promise<Ingredient[]>;
  getIngredient(id: number): Promise<Ingredient | undefined>;
  createIngredient(ingredient: InsertIngredient): Promise<Ingredient>;
  updateIngredient(id: number, updates: UpdateIngredientRequest): Promise<Ingredient>;
  deleteIngredient(id: number): Promise<void>;

  // Recipes
  getRecipes(): Promise<Recipe[]>;
  getRecipe(id: number): Promise<(Recipe & { ingredients: (RecipeIngredient & { ingredient: Ingredient })[] }) | undefined>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: number, updates: UpdateRecipeRequest): Promise<Recipe>;
  deleteRecipe(id: number): Promise<void>;

  // Recipe Ingredients
  addRecipeIngredient(recipeIngredient: InsertRecipeIngredient): Promise<RecipeIngredient>;
  removeRecipeIngredient(recipeId: number, ingredientId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Ingredients
  async getIngredients(): Promise<Ingredient[]> {
    return await db.select().from(ingredients);
  }

  async getIngredient(id: number): Promise<Ingredient | undefined> {
    const [ingredient] = await db.select().from(ingredients).where(eq(ingredients.id, id));
    return ingredient;
  }

  async createIngredient(insertIngredient: InsertIngredient): Promise<Ingredient> {
    const [ingredient] = await db.insert(ingredients).values(insertIngredient).returning();
    return ingredient;
  }

  async updateIngredient(id: number, updates: UpdateIngredientRequest): Promise<Ingredient> {
    const [updated] = await db.update(ingredients)
      .set(updates)
      .where(eq(ingredients.id, id))
      .returning();
    return updated;
  }

  async deleteIngredient(id: number): Promise<void> {
    await db.delete(ingredients).where(eq(ingredients.id, id));
  }

  // Recipes
  async getRecipes(): Promise<Recipe[]> {
    return await db.select().from(recipes);
  }

  async getRecipe(id: number): Promise<(Recipe & { ingredients: (RecipeIngredient & { ingredient: Ingredient })[] }) | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    
    if (!recipe) return undefined;

    const items = await db.query.recipeIngredients.findMany({
      where: eq(recipeIngredients.recipeId, id),
      with: {
        ingredient: true
      }
    });

    return { ...recipe, ingredients: items };
  }

  async createRecipe(insertRecipe: InsertRecipe): Promise<Recipe> {
    const [recipe] = await db.insert(recipes).values(insertRecipe).returning();
    return recipe;
  }

  async updateRecipe(id: number, updates: UpdateRecipeRequest): Promise<Recipe> {
    const [updated] = await db.update(recipes)
      .set(updates)
      .where(eq(recipes.id, id))
      .returning();
    return updated;
  }

  async deleteRecipe(id: number): Promise<void> {
    // First delete recipe ingredients
    await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id));
    // Then delete recipe
    await db.delete(recipes).where(eq(recipes.id, id));
  }

  // Recipe Ingredients
  async addRecipeIngredient(insertRecipeIngredient: InsertRecipeIngredient): Promise<RecipeIngredient> {
    const [item] = await db.insert(recipeIngredients).values(insertRecipeIngredient).returning();
    return item;
  }

  async removeRecipeIngredient(recipeId: number, ingredientId: number): Promise<void> {
    await db.delete(recipeIngredients)
      .where(
        eq(recipeIngredients.recipeId, recipeId) && 
        eq(recipeIngredients.ingredientId, ingredientId)
      );
  }
}

export const storage = new DatabaseStorage();
