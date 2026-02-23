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
  id: string; // Firestore doc id
  name: string;
  unit: string;
  packageSize: number;
  price: number;
};

const COL = "ingredients" as const;

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

export function useIngredients() {
  return useQuery({
    queryKey: ["ingredients"],
    queryFn: async (): Promise<Ingredient[]> => {
      const q = query(collection(db, COL), orderBy("name"));
      const snap = await getDocs(q);
      return snap.docs.map((d) => mapIngredient(d.id, d.data()));
    },
  });
}

export function useIngredient(id: string) {
  return useQuery({
    queryKey: ["ingredients", id],
    enabled: !!id,
    queryFn: async (): Promise<Ingredient | null> => {
      const ref = doc(db, COL, id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      return mapIngredient(snap.id, snap.data());
    },
  });
}

export function useCreateIngredient() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (raw: InsertIngredient) => {
      const data = parseIngredient(raw);

      const ref = await addDoc(collection(db, COL), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return ref.id;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["ingredients"] });
    },
  });
}

export function useUpdateIngredient() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { id: string } & InsertIngredient) => {
      const { id, ...rest } = payload;
      const data = parseIngredient(rest);

      const ref = doc(db, COL, id);
      await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp(),
      });

      return id;
    },
    onSuccess: async (_id, vars) => {
      await qc.invalidateQueries({ queryKey: ["ingredients"] });
      await qc.invalidateQueries({ queryKey: ["ingredients", vars.id] });
    },
  });
}

export function useDeleteIngredient() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const ref = doc(db, COL, id);
      await deleteDoc(ref);
      return id;
    },
    onSuccess: async (id) => {
      await qc.invalidateQueries({ queryKey: ["ingredients"] });
      await qc.invalidateQueries({ queryKey: ["ingredients", id] });
    },
  });
}