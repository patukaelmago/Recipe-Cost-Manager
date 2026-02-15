import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type InsertRecipe, type InsertRecipeIngredient } from "@shared/schema";

export function useRecipes() {
  return useQuery({
    queryKey: [api.recipes.list.path],
    queryFn: async () => {
      const res = await fetch(api.recipes.list.path);
      if (!res.ok) throw new Error("Failed to fetch recipes");
      return api.recipes.list.responses[200].parse(await res.json());
    },
  });
}

export function useRecipe(id: number) {
  return useQuery({
    queryKey: [api.recipes.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.recipes.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch recipe");
      return api.recipes.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertRecipe) => {
      const validated = api.recipes.create.input.parse(data);
      const res = await fetch(api.recipes.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error("Failed to create recipe");
      return api.recipes.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.recipes.list.path] });
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Partial<InsertRecipe>) => {
      const validated = api.recipes.update.input.parse(data);
      const url = buildUrl(api.recipes.update.path, { id });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error("Failed to update recipe");
      return api.recipes.update.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.recipes.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.recipes.get.path, variables.id] });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.recipes.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete recipe");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.recipes.list.path] });
    },
  });
}

export function useAddRecipeIngredient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ recipeId, ...data }: Omit<InsertRecipeIngredient, "recipeId"> & { recipeId: number }) => {
      const validated = api.recipeIngredients.add.input.parse(data);
      const url = buildUrl(api.recipeIngredients.add.path, { recipeId });
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error("Failed to add ingredient to recipe");
      return api.recipeIngredients.add.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.recipes.get.path, variables.recipeId] });
    },
  });
}

export function useRemoveRecipeIngredient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ recipeId, ingredientId }: { recipeId: number; ingredientId: number }) => {
      const url = buildUrl(api.recipeIngredients.remove.path, { recipeId, ingredientId });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove ingredient from recipe");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.recipes.get.path, variables.recipeId] });
    },
  });
}
