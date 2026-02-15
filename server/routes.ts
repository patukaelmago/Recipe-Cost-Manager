
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Ingredients Routes
  app.get(api.ingredients.list.path, async (req, res) => {
    const ingredients = await storage.getIngredients();
    res.json(ingredients);
  });

  app.get(api.ingredients.get.path, async (req, res) => {
    const ingredient = await storage.getIngredient(Number(req.params.id));
    if (!ingredient) {
      return res.status(404).json({ message: 'Ingredient not found' });
    }
    res.json(ingredient);
  });

  app.post(api.ingredients.create.path, async (req, res) => {
    try {
      const input = api.ingredients.create.input.parse(req.body);
      const ingredient = await storage.createIngredient(input);
      res.status(201).json(ingredient);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.ingredients.update.path, async (req, res) => {
    try {
      const input = api.ingredients.update.input.parse(req.body);
      const ingredient = await storage.updateIngredient(Number(req.params.id), input);
      res.json(ingredient);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.ingredients.delete.path, async (req, res) => {
    await storage.deleteIngredient(Number(req.params.id));
    res.status(204).send();
  });

  // Recipes Routes
  app.get(api.recipes.list.path, async (req, res) => {
    const recipes = await storage.getRecipes();
    res.json(recipes);
  });

  app.get(api.recipes.get.path, async (req, res) => {
    const recipe = await storage.getRecipe(Number(req.params.id));
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    res.json(recipe);
  });

  app.post(api.recipes.create.path, async (req, res) => {
    try {
      const input = api.recipes.create.input.parse(req.body);
      const recipe = await storage.createRecipe(input);
      res.status(201).json(recipe);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.recipes.update.path, async (req, res) => {
    try {
      const input = api.recipes.update.input.parse(req.body);
      const recipe = await storage.updateRecipe(Number(req.params.id), input);
      res.json(recipe);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.recipes.delete.path, async (req, res) => {
    await storage.deleteRecipe(Number(req.params.id));
    res.status(204).send();
  });

  // Recipe Ingredients Routes
  app.post(api.recipeIngredients.add.path, async (req, res) => {
    try {
      const recipeId = Number(req.params.recipeId);
      const input = api.recipeIngredients.add.input.parse(req.body);
      const item = await storage.addRecipeIngredient({ ...input, recipeId });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.recipeIngredients.remove.path, async (req, res) => {
    await storage.removeRecipeIngredient(
      Number(req.params.recipeId),
      Number(req.params.ingredientId)
    );
    res.status(204).send();
  });

  // Seed the database
  await seedDatabase();

  return httpServer;
}

export async function seedDatabase() {
  const ingredients = await storage.getIngredients();
  if (ingredients.length === 0) {
    const flour = await storage.createIngredient({ 
      name: "Flour", 
      price: "1500", 
      unit: "kg", 
      packageSize: "1" 
    });
    const sugar = await storage.createIngredient({ 
      name: "Sugar", 
      price: "1200", 
      unit: "kg", 
      packageSize: "1" 
    });
    const eggs = await storage.createIngredient({ 
      name: "Eggs", 
      price: "3000", 
      unit: "unit", 
      packageSize: "30" // 30 eggs maple
    });
    const milk = await storage.createIngredient({
      name: "Milk",
      price: "1000",
      unit: "L",
      packageSize: "1"
    });

    const cake = await storage.createRecipe({ 
      name: "Vanilla Sponge Cake", 
      description: "Basic sponge cake recipe" 
    });

    await storage.addRecipeIngredient({ 
      recipeId: cake.id, 
      ingredientId: flour.id, 
      quantity: "0.250" // 250g
    });
    await storage.addRecipeIngredient({ 
      recipeId: cake.id, 
      ingredientId: sugar.id, 
      quantity: "0.200" // 200g
    });
    await storage.addRecipeIngredient({ 
      recipeId: cake.id, 
      ingredientId: eggs.id, 
      quantity: "4" // 4 eggs
    });
     await storage.addRecipeIngredient({ 
      recipeId: cake.id, 
      ingredientId: milk.id, 
      quantity: "0.100" // 100ml
    });
  }
}
