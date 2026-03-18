// client/src/hooks/use-ingredients.ts
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
import { insertIngredientSchema, type InsertIngredient } from "@shared/schema";

export type Ingredient = {
  id: string;
  name: string;
  unit: string;
  packageSize: number;
  price: number;
};

const TENANTS_COL = "tenants" as const;
const INGREDIENTS_COL = "ingredients" as const;
const DEFAULT_TENANT_ID = "picaña";

function parseIngredient(input: unknown): InsertIngredient {
  return insertIngredientSchema.parse(input);
}

function mapIngredient(id: string, data: any): Ingredient {
  return {
    id,
    name: String(data?.name ?? ""),
    unit: String(data?.unit ?? ""),
    packageSize: Number(data?.packageSize ?? 0),
    price: Number(data?.price ?? 0),
  };
}

function tenantIngredientsCollection(tenantId: string = DEFAULT_TENANT_ID) {
  return collection(db, TENANTS_COL, tenantId, INGREDIENTS_COL);
}

function tenantIngredientDoc(id: string, tenantId: string = DEFAULT_TENANT_ID) {
  return doc(db, TENANTS_COL, tenantId, INGREDIENTS_COL, id);
}

export function useIngredients(tenantId: string = DEFAULT_TENANT_ID) {
  return useQuery({
    queryKey: ["ingredients", tenantId],
    queryFn: async (): Promise<Ingredient[]> => {
      const q = query(tenantIngredientsCollection(tenantId), orderBy("name"));
      const snap = await getDocs(q);
      return snap.docs.map((d) => mapIngredient(d.id, d.data()));
    },
  });
}

export function useIngredient(id: string, tenantId: string = DEFAULT_TENANT_ID) {
  return useQuery({
    queryKey: ["ingredients", tenantId, id],
    enabled: !!id,
    queryFn: async (): Promise<Ingredient | null> => {
      const ref = tenantIngredientDoc(id, tenantId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      return mapIngredient(snap.id, snap.data());
    },
  });
}

export function useCreateIngredient(tenantId: string = DEFAULT_TENANT_ID) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (raw: InsertIngredient) => {
      const data = parseIngredient(raw);

      const ref = await addDoc(tenantIngredientsCollection(tenantId), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return ref.id;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["ingredients", tenantId] });
    },
  });
}

export function useUpdateIngredient(tenantId: string = DEFAULT_TENANT_ID) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string } & InsertIngredient) => {
      const { id, ...rest } = payload;
      const data = parseIngredient(rest);

      const ref = tenantIngredientDoc(id, tenantId);
      await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp(),
      });

      return id;
    },
    onSuccess: async (_id, vars) => {
      await qc.invalidateQueries({ queryKey: ["ingredients", tenantId] });
      await qc.invalidateQueries({ queryKey: ["ingredients", tenantId, vars.id] });
    },
  });
}

export function useDeleteIngredient(tenantId: string = DEFAULT_TENANT_ID) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const ref = tenantIngredientDoc(id, tenantId);
      await deleteDoc(ref);
      return id;
    },
    onSuccess: async (id) => {
      await qc.invalidateQueries({ queryKey: ["ingredients", tenantId] });
      await qc.invalidateQueries({ queryKey: ["ingredients", tenantId, id] });
    },
  });
}