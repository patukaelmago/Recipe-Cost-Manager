import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const storage = new Map();
globalThis.sessionStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
};
const source = readFileSync(new URL("../client/src/lib/demo.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022,
} }).outputText;
const load = (suffix = "") => import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}#${suffix}`);
const demo = await load();

test("sample recipes have valid ingredient links and calculable costs", () => {
  demo.resetDemo();
  assert.equal(demo.demoIngredients().length, 12);
  assert.equal(demo.demoRecipes().length, 3);
  for (const recipe of demo.demoRecipes()) {
    assert.ok(recipe.ingredients.length);
    for (const item of recipe.ingredients) {
      assert.equal(item.ingredient.id, item.ingredientId);
      assert.ok(item.quantity > 0);
      assert.ok(item.ingredient.packageSize > 0);
    }
  }
  const pizza = demo.demoRecipes().find(r => r.id === "pizza");
  const cost = pizza.ingredients.reduce((sum, item) => sum + item.ingredient.price / item.ingredient.packageSize * item.quantity, 0);
  assert.equal(cost, 3667.2);
});

test("editing an ingredient changes recipe costs without mutating returned snapshots", () => {
  demo.resetDemo();
  const before = demo.demoRecipes().find(r => r.id === "pizza");
  const flour = demo.demoIngredients().find(i => i.id === "harina");
  demo.saveDemoIngredient({ ...flour, price: 2400 }, flour.id);
  const after = demo.demoRecipes().find(r => r.id === "pizza");
  assert.equal(before.ingredients.find(i => i.ingredientId === "harina").ingredient.price, 1200);
  assert.equal(after.ingredients.find(i => i.ingredientId === "harina").ingredient.price, 2400);
  after.ingredients[0].quantity = 999;
  assert.notEqual(demo.demoRecipes().find(r => r.id === "pizza").ingredients[0].quantity, 999);
});

test("recipe, ingredient, quantity, margin, and settings can be changed and reset", () => {
  demo.resetDemo();
  const ingredientId = demo.saveDemoIngredient({ name: "Huevo", unit: "u", packageSize: 12, price: 4000 });
  const recipeId = demo.saveDemoRecipe({ name: "Omelette", pricingPercentage: 75 });
  const itemId = demo.addDemoRecipeIngredient(recipeId, ingredientId, 2);
  demo.updateDemoQuantity(recipeId, itemId, 3);
  demo.saveDemoRecipe({ pricingPercentage: 80 }, recipeId);
  demo.updateDemoSettings({ displayName: "Mi prueba", pricingPercentage: 60 });
  let recipe = demo.demoRecipes().find(r => r.id === recipeId);
  assert.equal(recipe.ingredients[0].quantity, 3);
  assert.equal(recipe.pricingPercentage, 80);
  assert.equal(demo.demoSettings().displayName, "Mi prueba");
  demo.removeDemoRecipeIngredient(recipeId, itemId);
  assert.equal(demo.demoRecipes().find(r => r.id === recipeId).ingredients.length, 0);
  demo.deleteDemoIngredient(ingredientId);
  demo.deleteDemoRecipe(recipeId);
  demo.deleteDemoIngredient("harina");
  demo.deleteDemoRecipe("pizza");
  demo.resetDemo();
  assert.equal(demo.demoIngredients().length, 12);
  assert.equal(demo.demoRecipes().length, 3);
  assert.equal(demo.demoSettings().displayName, "Cocina Demo");
  assert.equal(demo.demoSettings().pricingPercentage, 50);
});

test("session reload preserves changes; a new demo entry restores examples", async () => {
  demo.resetDemo();
  demo.deleteDemoRecipe("pizza");
  const reloaded = await load("reload");
  assert.equal(reloaded.demoRecipes().length, 2);
  reloaded.resetDemo();
  assert.equal(reloaded.demoRecipes().length, 3);
});

test("demo remains usable when browser storage is blocked", async () => {
  globalThis.sessionStorage = { getItem() { throw Error("blocked"); }, setItem() { throw Error("blocked"); } };
  const isolated = await load("blocked");
  assert.equal(isolated.demoRecipes().length, 3);
  isolated.deleteDemoRecipe("pizza");
  assert.equal(isolated.demoRecipes().length, 2);
  isolated.resetDemo();
  assert.equal(isolated.demoRecipes().length, 3);
});
