// shared/routes.ts
import { z } from "zod";

const IngredientSchema = z.object({
  id: z.number(),
  name: z.string(),
  unit: z.string(),
  packageSize: z.number(),
  price: z.number(),
});

const InsertIngredientSchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
  packageSize: z.coerce.number().positive(),
  price: z.coerce.number().nonnegative(),
});

export const api = {
  ingredients: {
    list: {
      path: "/api/ingredients",
      responses: {
        200: z.array(IngredientSchema),
      },
    },
    get: {
      path: "/api/ingredients/:id",
      responses: {
        200: IngredientSchema,
      },
    },
    create: {
      path: "/api/ingredients",
      input: InsertIngredientSchema,
      responses: {
        200: IngredientSchema,
      },
    },
    update: {
      path: "/api/ingredients/:id",
      input: InsertIngredientSchema.partial(),
      responses: {
        200: IngredientSchema,
      },
    },
    delete: {
      path: "/api/ingredients/:id",
      responses: {
        200: z.object({ ok: z.literal(true) }),
      },
    },
  },
} as const;

export function buildUrl(path: string, params: Record<string, string | number>) {
  let out = path;
  for (const [k, v] of Object.entries(params)) {
    out = out.replace(`:${k}`, encodeURIComponent(String(v)));
  }
  return out;
}