import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type Ingredient = {
  id: number;
  name: string;
};

let mockIngredients: Ingredient[] = [
  { id: 1, name: "Harina" },
  { id: 2, name: "Queso" }
];

export function useIngredients() {
  return useQuery({
    queryKey: ["ingredients"],
    queryFn: async () => mockIngredients
  });
}

export function useIngredient(id: number) {
  return useQuery({
    queryKey: ["ingredient", id],
    queryFn: async () =>
      mockIngredients.find(i => i.id === id) ?? null,
    enabled: !!id
  });
}

export function useCreateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const newIngredient = {
        id: Date.now(),
        name: data.name
      };
      mockIngredients.push(newIngredient);
      return newIngredient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
    }
  });
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      mockIngredients = mockIngredients.map(i =>
        i.id === id ? { ...i, name } : i
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
    }
  });
}

export function useDeleteIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      mockIngredients = mockIngredients.filter(i => i.id !== id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
    }
  });
}