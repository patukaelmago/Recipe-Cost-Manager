import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type Ingredient = {
  id: number;
  name: string;
  unit: string;
  price: string;        // precio del paquete (string para mantener tu UI actual con parseFloat/Number)
  packageSize: string;  // tamaño del paquete
};

export type RecipeIngredient = {
  id: number; // id del item dentro de la receta
  recipeId: number;
  ingredientId: number;
  quantity: string; // cantidad usada
  ingredient: Ingredient;
};

export type Recipe = {
  id: number;
  name: string;
  description?: string;
  ingredients: RecipeIngredient[];
};

// ===== Mock data =====
let mockIngredients: Ingredient[] = [
  { id: 1, name: "Harina", unit: "kg", price: "1200", packageSize: "1" },
  { id: 2, name: "Queso", unit: "kg", price: "6500", packageSize: "1" },
];

let mockRecipes: Recipe[] = [
  {
    id: 1,
    name: "Pizza Muzza",
    description: "Clásica muzza",
    ingredients: [
      {
        id: 1,
        recipeId: 1,
        ingredientId: 1,
        quantity: "0.3",
        ingredient: mockIngredients[0],
      },
      {
        id: 2,
        recipeId: 1,
        ingredientId: 2,
        quantity: "0.25",
        ingredient: mockIngredients[1],
      },
    ],
  },
  {
    id: 2,
    name: "Empanadas",
    description: "Empanadas caseras",
    ingredients: [],
  },
  {
    id: 3,
    name: "Tarta de Apio",
    description: "Apio y miel",
    ingredients:[],
  },
];

// ===== Helpers =====
function hydrateRecipe(r: Recipe): Recipe {
  return {
    ...r,
    description: r.description ?? "",
    ingredients: (r.ingredients ?? []).map((it) => ({
      ...it,
      ingredient:
        it.ingredient ??
        mockIngredients.find((x) => x.id === it.ingredientId) ??
        ({ id: it.ingredientId, name: "Unknown", unit: "u", price: "0", packageSize: "1" } as Ingredient),
    })),
  };
}

// ===== Queries =====
export function useRecipes() {
  return useQuery({
    queryKey: ["recipes"],
    queryFn: async () => mockRecipes.map(hydrateRecipe),
  });
}

export function useRecipe(id: number) {
  return useQuery({
    queryKey: ["recipe", id],
    queryFn: async () => {
      const r = mockRecipes.find((x) => x.id === id);
      return r ? hydrateRecipe(r) : null;
    },
    enabled: !!id,
  });
}

// ===== Mutations =====
export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const newRecipe: Recipe = {
        id: Date.now(),
        name: data.name,
        description: data.description ?? "",
        ingredients: [],
      };
      mockRecipes = [...mockRecipes, newRecipe];
      return hydrateRecipe(newRecipe);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: number; name?: string; description?: string }) => {
      const { id, name, description } = data;

      mockRecipes = mockRecipes.map((r) =>
        r.id === id
          ? hydrateRecipe({
              ...r,
              name: name ?? r.name,
              description: description ?? r.description ?? "",
            })
          : r
      );

      const updated = mockRecipes.find((r) => r.id === id);
      return updated ? hydrateRecipe(updated) : null;
    },
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["recipe", variables.id] });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      mockRecipes = mockRecipes.filter((r) => r.id !== id);
      // limpiar ingredientes asociados (opcional)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

// ===== Recipe Ingredients (lo que te faltaba) =====
export function useAddRecipeIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { recipeId: number; ingredientId: number; quantity: string }) => {
      const { recipeId, ingredientId, quantity } = data;

      const recipe = mockRecipes.find((r) => r.id === recipeId);
      if (!recipe) throw new Error("Recipe not found");

      const ing = mockIngredients.find((i) => i.id === ingredientId);
      if (!ing) throw new Error("Ingredient not found");

      const newItem: RecipeIngredient = {
        id: Date.now(),
        recipeId,
        ingredientId,
        quantity,
        ingredient: ing,
      };

      recipe.ingredients = [...(recipe.ingredients ?? []), newItem];
      mockRecipes = mockRecipes.map((r) => (r.id === recipeId ? hydrateRecipe(recipe) : r));

      return newItem;
    },
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["recipe", variables.recipeId] });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

export function useRemoveRecipeIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { recipeId: number; ingredientId: number }) => {
      const { recipeId, ingredientId } = data;

      const recipe = mockRecipes.find((r) => r.id === recipeId);
      if (!recipe) throw new Error("Recipe not found");

      recipe.ingredients = (recipe.ingredients ?? []).filter((it) => it.ingredientId !== ingredientId);
      mockRecipes = mockRecipes.map((r) => (r.id === recipeId ? hydrateRecipe(recipe) : r));
    },
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["recipe", variables.recipeId] });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}