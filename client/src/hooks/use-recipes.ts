import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import { insertRecipeSchema, type InsertRecipe } from "@shared/schema";
import { insertIngredientSchema, type InsertIngredient } from "@shared/schema";

export type Ingredient = {
  id: string;
  name: string;
  unit: string;
  packageSize: number;
  price: number;
};

export type RecipeIngredientItem = {
  id: string;
  ingredientId: string;
  quantity: number;
  ingredient: Ingredient;
};

export type Recipe = {
  id: string;
  name: string;
  description?: string;
  ingredients: RecipeIngredientItem[];
};

const TENANTS_COL = "tenants" as const;
const RECIPES_COL = "recipes" as const;
const INGREDIENTS_COL = "ingredients" as const;
const DEFAULT_TENANT_ID = "picaña";

function parseRecipe(input: unknown): InsertRecipe {
  return insertRecipeSchema.parse(input);
}

function parseIngredient(input: unknown): InsertIngredient {
  return insertIngredientSchema.parse(input);
}

function mapIngredient(id: string, data: any): Ingredient {
  const parsed = parseIngredient({
    name: data?.name,
    unit: data?.unit,
    packageSize: data?.packageSize,
    price: data?.price,
  });

  return { id, ...parsed };
}

function mapRecipeBase(id: string, data: any): Omit<Recipe, "ingredients"> {
  return {
    id,
    name: String(data?.name ?? ""),
    description: String(data?.description ?? ""),
  };
}

function tenantRecipesCollection(tenantId: string = DEFAULT_TENANT_ID) {
  return collection(db, TENANTS_COL, tenantId, RECIPES_COL);
}

function tenantRecipeDoc(recipeId: string, tenantId: string = DEFAULT_TENANT_ID) {
  return doc(db, TENANTS_COL, tenantId, RECIPES_COL, recipeId);
}

function tenantIngredientsCollection(tenantId: string = DEFAULT_TENANT_ID) {
  return collection(db, TENANTS_COL, tenantId, INGREDIENTS_COL);
}

function tenantIngredientDoc(ingredientId: string, tenantId: string = DEFAULT_TENANT_ID) {
  return doc(db, TENANTS_COL, tenantId, INGREDIENTS_COL, ingredientId);
}

function tenantRecipeItemsCollection(recipeId: string, tenantId: string = DEFAULT_TENANT_ID) {
  return collection(db, TENANTS_COL, tenantId, RECIPES_COL, recipeId, INGREDIENTS_COL);
}

function tenantRecipeItemDoc(
  recipeId: string,
  itemId: string,
  tenantId: string = DEFAULT_TENANT_ID
) {
  return doc(db, TENANTS_COL, tenantId, RECIPES_COL, recipeId, INGREDIENTS_COL, itemId);
}

export function useRecipes(tenantId: string = DEFAULT_TENANT_ID) {
  return useQuery({
    queryKey: ["recipes", tenantId],
    queryFn: async (): Promise<Recipe[]> => {
      const q = query(tenantRecipesCollection(tenantId), orderBy("name"));
      const snap = await getDocs(q);

      return snap.docs.map((d) => ({
        ...mapRecipeBase(d.id, d.data()),
        ingredients: [],
      }));
    },
  });
}

export function useRecipe(id: string, tenantId: string = DEFAULT_TENANT_ID) {
  return useQuery({
    queryKey: ["recipe", tenantId, id],
    enabled: !!id,
    queryFn: async (): Promise<Recipe | null> => {
      const cleanId = String(id || "").trim();
      if (!cleanId) return null;

      const ref = tenantRecipeDoc(cleanId, tenantId);
      const snap = await getDoc(ref);

      if (!snap.exists()) return null;

      const base = mapRecipeBase(snap.id, snap.data());

      const itemsRef = tenantRecipeItemsCollection(cleanId, tenantId);
      const itemsSnap = await getDocs(itemsRef);

      const items = itemsSnap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          ingredientId: String(data?.ingredientId ?? ""),
          quantity: Number(data?.quantity ?? 0),
        };
      });

      if (items.length === 0) {
        return { ...base, ingredients: [] };
      }

      const ingredientDocs = await Promise.all(
        items.map(async (it) => {
          const safeIngredientId = String(it.ingredientId || "").trim();

          if (!safeIngredientId) {
            const fallback: Ingredient = {
              id: "",
              name: "Unknown",
              unit: "u",
              packageSize: 1,
              price: 0,
            };
            return { item: it, ingredient: fallback };
          }

          const ingRef = tenantIngredientDoc(safeIngredientId, tenantId);
          const ingSnap = await getDoc(ingRef);

          if (!ingSnap.exists()) {
            const fallback: Ingredient = {
              id: safeIngredientId,
              name: "Unknown",
              unit: "u",
              packageSize: 1,
              price: 0,
            };
            return { item: it, ingredient: fallback };
          }

          return { item: it, ingredient: mapIngredient(ingSnap.id, ingSnap.data()) };
        })
      );

      const fullItems: RecipeIngredientItem[] = ingredientDocs.map(({ item, ingredient }) => ({
        id: item.id,
        ingredientId: String(item.ingredientId ?? ""),
        quantity: Number(item.quantity ?? 0),
        ingredient,
      }));

      return { ...base, ingredients: fullItems };
    },
  });
}

export function useCreateRecipe(tenantId: string = DEFAULT_TENANT_ID) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (raw: InsertRecipe) => {
      const data = parseRecipe(raw);

      const ref = await addDoc(tenantRecipesCollection(tenantId), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return ref.id;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["recipes", tenantId] });
    },
  });
}

export function useUpdateRecipe(tenantId: string = DEFAULT_TENANT_ID) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string } & Partial<InsertRecipe>) => {
      const { id, ...rest } = payload;
      const safe = insertRecipeSchema.partial().parse(rest);

      const ref = tenantRecipeDoc(id, tenantId);
      await updateDoc(ref, {
        ...safe,
        updatedAt: serverTimestamp(),
      });

      return id;
    },
    onSuccess: async (_id, vars) => {
      await qc.invalidateQueries({ queryKey: ["recipes", tenantId] });
      await qc.invalidateQueries({ queryKey: ["recipe", tenantId, vars.id] });
    },
  });
}

export function useDeleteRecipe(tenantId: string = DEFAULT_TENANT_ID) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const ref = tenantRecipeDoc(id, tenantId);
      await deleteDoc(ref);
      return id;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["recipes", tenantId] });
    },
  });
}

export function useAddRecipeIngredient(tenantId: string = DEFAULT_TENANT_ID) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      recipeId: string;
      ingredientId: string;
      quantity: number | string;
    }) => {
      const recipeId = String(data.recipeId || "").trim();
      const ingredientId = String(data.ingredientId || "").trim();
      const qty = typeof data.quantity === "string" ? Number(data.quantity) : data.quantity;

      if (!recipeId) throw new Error("recipeId missing");
      if (!ingredientId) throw new Error("ingredientId missing");
      if (!Number.isFinite(qty) || qty <= 0) throw new Error("quantity invalid");

      const ref = await addDoc(tenantRecipeItemsCollection(recipeId, tenantId), {
        ingredientId,
        quantity: qty,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return ref.id;
    },
    onSuccess: async (_id, vars) => {
      await qc.invalidateQueries({ queryKey: ["recipe", tenantId, vars.recipeId] });
      await qc.invalidateQueries({ queryKey: ["recipes", tenantId] });
    },
  });
}

export function useRemoveRecipeIngredient(tenantId: string = DEFAULT_TENANT_ID) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: { recipeId: string; itemId: string }) => {
      const recipeId = String(data.recipeId || "").trim();
      const itemId = String(data.itemId || "").trim();

      if (!recipeId) throw new Error("recipeId missing");
      if (!itemId) throw new Error("itemId missing");

      const ref = tenantRecipeItemDoc(recipeId, itemId, tenantId);
      await deleteDoc(ref);

      return itemId;
    },
    onSuccess: async (_id, vars) => {
      await qc.invalidateQueries({ queryKey: ["recipe", tenantId, vars.recipeId] });
      await qc.invalidateQueries({ queryKey: ["recipes", tenantId] });
    },
  });
}