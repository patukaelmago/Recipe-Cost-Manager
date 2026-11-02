import type { Ingredient, Recipe } from "@/hooks/use-recipes";

export const DEMO_USER = "demo";
export const DEMO_PASSWORD = "demo123";
export const isDemo = (tenant: string) => tenant === "demo";
const STORAGE_KEY = "recipe-cost-demo-v1";

type DemoState = {
  ingredients: Ingredient[];
  recipes: Recipe[];
  settings: { displayName: string; pricingPercentage: number };
};

function seed(): DemoState {
  const ingredients: Ingredient[] = [
    { id: "harina", name: "Harina 000", unit: "kg", packageSize: 1, price: 1200 },
    { id: "mozzarella", name: "Mozzarella", unit: "kg", packageSize: 1, price: 8500 },
    { id: "tomate", name: "Salsa de tomate", unit: "kg", packageSize: 1, price: 2200 },
    { id: "aceite", name: "Aceite de oliva", unit: "l", packageSize: 1, price: 12000 },
    { id: "sal", name: "Sal", unit: "kg", packageSize: 1, price: 900 },
    { id: "levadura", name: "Levadura", unit: "kg", packageSize: 0.05, price: 600 },
    { id: "arroz", name: "Arroz", unit: "kg", packageSize: 1, price: 2400 },
    { id: "pollo", name: "Pechuga de pollo", unit: "kg", packageSize: 1, price: 7500 },
    { id: "cebolla", name: "Cebolla", unit: "kg", packageSize: 1, price: 1300 },
    { id: "papa", name: "Papa", unit: "kg", packageSize: 1, price: 1500 },
    { id: "manteca", name: "Manteca", unit: "kg", packageSize: 0.2, price: 2800 },
    { id: "leche", name: "Leche", unit: "l", packageSize: 1, price: 1700 },
  ];
  const recipe = (id: string, name: string, description: string, items: [string, number][]): Recipe => ({
    id, name, description, pricingPercentage: 50, createdAt: Date.now(), updatedAt: Date.now(),
    ingredients: items.map(([ingredientId, quantity], i) => ({
      id: `${id}-${i}`, ingredientId, quantity,
      ingredient: ingredients.find(item => item.id === ingredientId)!,
    })),
  });
  return {
    ingredients,
    recipes: [
      recipe("pizza", "Pizza de mozzarella", "Una pizza grande. Precios ilustrativos para probar el cálculo de costos.", [["harina", 0.35], ["mozzarella", 0.3], ["tomate", 0.15], ["aceite", 0.02], ["sal", 0.008], ["levadura", 0.01]]),
      recipe("arroz-pollo", "Arroz con pollo", "Una porción de arroz con pollo y cebolla.", [["arroz", 0.1], ["pollo", 0.2], ["cebolla", 0.08], ["aceite", 0.015], ["sal", 0.005]]),
      recipe("pure", "Puré de papas", "Una porción de guarnición.", [["papa", 0.3], ["manteca", 0.025], ["leche", 0.06], ["sal", 0.004]]),
    ],
    settings: { displayName: "Cocina Demo", pricingPercentage: 50 },
  };
}

let state: DemoState | undefined;
function save() {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* In-memory demo remains usable. */ }
}
function read(): DemoState {
  if (!state) {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.ingredients) && Array.isArray(parsed.recipes) && parsed.settings) state = parsed;
      }
    } catch { /* Start with the sample data if storage is unavailable. */ }
    if (!state) state = seed();
  }
  return state;
}
export function resetDemo() { state = seed(); save(); }
export function demoIngredients() { return structuredClone(read().ingredients).sort((a, b) => a.name.localeCompare(b.name, "es")); }
export function demoRecipes(): Recipe[] {
  const data = read();
  return structuredClone(data.recipes).map(recipe => ({ ...recipe,
    ingredients: recipe.ingredients.map(item => ({ ...item,
      ingredient: structuredClone(data.ingredients.find(i => i.id === item.ingredientId) ?? { id: item.ingredientId, name: "Ingrediente eliminado", unit: "u", packageSize: 1, price: 0 }),
    })),
  })).sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt));
}
export function demoSettings() { return { ...read().settings }; }
export function updateDemoSettings(data: Partial<DemoState["settings"]>) { Object.assign(read().settings, data); save(); }
export function saveDemoIngredient(data: Omit<Ingredient, "id">, id: string = crypto.randomUUID()) {
  const items = read().ingredients;
  const index = items.findIndex(item => item.id === id);
  if (index < 0) items.push({ ...data, id }); else items[index] = { ...data, id };
  save(); return id;
}
export function deleteDemoIngredient(id: string) { read().ingredients = read().ingredients.filter(i => i.id !== id); save(); }
export function saveDemoRecipe(data: Partial<Omit<Recipe, "id">>, id: string = crypto.randomUUID()) {
  const items = read().recipes;
  const existing = items.find(item => item.id === id);
  if (existing) Object.assign(existing, data, { updatedAt: Date.now() });
  else items.push({ name: "Nueva receta", ingredients: [], createdAt: Date.now(), ...data, id, updatedAt: Date.now() });
  save(); return id;
}
export function deleteDemoRecipe(id: string) { read().recipes = read().recipes.filter(r => r.id !== id); save(); }
export function addDemoRecipeIngredient(recipeId: string, ingredientId: string, quantity: number) {
  const recipe = read().recipes.find(r => r.id === recipeId);
  const ingredient = read().ingredients.find(i => i.id === ingredientId);
  if (!recipe || !ingredient) throw new Error("Receta o ingrediente inexistente");
  const id = crypto.randomUUID();
  recipe.ingredients.push({ id, ingredientId, quantity, ingredient: { ...ingredient } });
  recipe.updatedAt = Date.now(); save(); return id;
}
export function updateDemoQuantity(recipeId: string, itemId: string, quantity: number) {
  const recipe = read().recipes.find(r => r.id === recipeId);
  const item = recipe?.ingredients.find(i => i.id === itemId);
  if (!recipe || !item) throw new Error("Ingrediente inexistente");
  item.quantity = quantity; recipe.updatedAt = Date.now(); save();
}
export function removeDemoRecipeIngredient(recipeId: string, itemId: string) {
  const recipe = read().recipes.find(r => r.id === recipeId);
  if (!recipe) throw new Error("Receta inexistente");
  recipe.ingredients = recipe.ingredients.filter(i => i.id !== itemId);
  recipe.updatedAt = Date.now(); save(); return itemId;
}
