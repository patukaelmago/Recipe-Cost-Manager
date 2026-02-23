// client/src/hooks/use-recipes.ts
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

// ===== Types =====

// Igual que Firestore ingredients: {id,name,unit,packageSize,price}
export type Ingredient = {
  id: string;
  name: string;
  unit: string;
  packageSize: number;
  price: number;
};

// Item dentro de recipes/{recipeId}/ingredients
export type RecipeIngredientItem = {
  id: string; // <-- itemId (doc id del item)
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

const RECIPES_COL = "recipes" as const;
const INGREDIENTS_COL = "ingredients" as const;

// ===== Validators / mappers =====

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

// ===== Queries =====

export function useRecipes() {
  return useQuery({
    queryKey: ["recipes"],
    queryFn: async (): Promise<Recipe[]> => {
      const q = query(collection(db, RECIPES_COL), orderBy("name"));
      const snap = await getDocs(q);

      // list view: sin ingredientes (ahorra lecturas)
      return snap.docs.map((d) => ({
        ...mapRecipeBase(d.id, d.data()),
        ingredients: [],
      }));
    },
  });
}

export function useRecipe(id: string) {
  return useQuery({
    queryKey: ["recipe", id],
    enabled: !!id,
    queryFn: async (): Promise<Recipe | null> => {
      const cleanId = String(id || "").trim();
      if (!cleanId) return null;

      // ✅ Traer receta base
      const ref = doc(db, RECIPES_COL, cleanId);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        console.log("[useRecipe] NOT FOUND:", cleanId);
        return null;
      }

      const base = mapRecipeBase(snap.id, snap.data());

      // ✅ Traer subcolección ingredients (orden opcional por createdAt si existe)
      const itemsRef = collection(db, RECIPES_COL, cleanId, "ingredients");
      const itemsSnap = await getDocs(itemsRef);

      const items = itemsSnap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id, // itemId
          ingredientId: String(data?.ingredientId ?? ""),
          quantity: Number(data?.quantity ?? 0),
        };
      });

      // ✅ Si no hay items, devolvemos receta igual (no null)
      if (items.length === 0) {
        return { ...base, ingredients: [] };
      }

      // ✅ Traer cada ingrediente referenciado
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

          const ingRef = doc(db, INGREDIENTS_COL, safeIngredientId);
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
        }),
      );

      const fullItems: RecipeIngredientItem[] = ingredientDocs.map(({ item, ingredient }) => ({
        id: item.id, // itemId
        ingredientId: String(item.ingredientId ?? ""),
        quantity: Number(item.quantity ?? 0),
        ingredient,
      }));

      return { ...base, ingredients: fullItems };
    },
  });
}

// ===== Mutations =====

export function useCreateRecipe() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (raw: InsertRecipe) => {
      const data = parseRecipe(raw);

      const ref = await addDoc(collection(db, RECIPES_COL), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return ref.id;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

export function useUpdateRecipe() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string } & Partial<InsertRecipe>) => {
      const { id, ...rest } = payload;
      const safe = insertRecipeSchema.partial().parse(rest);

      const ref = doc(db, RECIPES_COL, id);
      await updateDoc(ref, {
        ...safe,
        updatedAt: serverTimestamp(),
      });

      return id;
    },
    onSuccess: async (_id, vars) => {
      await qc.invalidateQueries({ queryKey: ["recipes"] });
      await qc.invalidateQueries({ queryKey: ["recipe", vars.id] });
    },
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const ref = doc(db, RECIPES_COL, id);
      await deleteDoc(ref);
      return id;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

// ===== Recipe Ingredients =====

// acepta quantity string o number (tu UI lo manda como string)
export function useAddRecipeIngredient() {
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

      const ref = await addDoc(collection(db, RECIPES_COL, recipeId, "ingredients"), {
        ingredientId,
        quantity: qty,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return ref.id; // itemId
    },
    onSuccess: async (_id, vars) => {
      await qc.invalidateQueries({ queryKey: ["recipe", vars.recipeId] });
      await qc.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}

// borrar por itemId (doc id de recipes/{recipeId}/ingredients/{itemId})
export function useRemoveRecipeIngredient() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: { recipeId: string; itemId: string }) => {
      const recipeId = String(data.recipeId || "").trim();
      const itemId = String(data.itemId || "").trim();

      if (!recipeId) throw new Error("recipeId missing");
      if (!itemId) throw new Error("itemId missing");

      const ref = doc(db, RECIPES_COL, recipeId, "ingredients", itemId);
      await deleteDoc(ref);

      return itemId;
    },
    onSuccess: async (_id, vars) => {
      await qc.invalidateQueries({ queryKey: ["recipe", vars.recipeId] });
      await qc.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}