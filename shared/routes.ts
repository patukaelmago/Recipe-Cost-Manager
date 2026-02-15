
import { z } from 'zod';
import { insertIngredientSchema, insertRecipeSchema, insertRecipeIngredientSchema, ingredients, recipes, recipeIngredients } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  ingredients: {
    list: {
      method: 'GET' as const,
      path: '/api/ingredients' as const,
      responses: {
        200: z.array(z.custom<typeof ingredients.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/ingredients/:id' as const,
      responses: {
        200: z.custom<typeof ingredients.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/ingredients' as const,
      input: insertIngredientSchema,
      responses: {
        201: z.custom<typeof ingredients.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/ingredients/:id' as const,
      input: insertIngredientSchema.partial(),
      responses: {
        200: z.custom<typeof ingredients.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/ingredients/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  recipes: {
    list: {
      method: 'GET' as const,
      path: '/api/recipes' as const,
      responses: {
        200: z.array(z.custom<typeof recipes.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/recipes/:id' as const,
      responses: {
        200: z.custom<typeof recipes.$inferSelect & { ingredients: (typeof recipeIngredients.$inferSelect & { ingredient: typeof ingredients.$inferSelect })[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/recipes' as const,
      input: insertRecipeSchema,
      responses: {
        201: z.custom<typeof recipes.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/recipes/:id' as const,
      input: insertRecipeSchema.partial(),
      responses: {
        200: z.custom<typeof recipes.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/recipes/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  recipeIngredients: {
    add: {
      method: 'POST' as const,
      path: '/api/recipes/:recipeId/ingredients' as const,
      input: insertRecipeIngredientSchema.omit({ recipeId: true }),
      responses: {
        201: z.custom<typeof recipeIngredients.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    remove: {
      method: 'DELETE' as const,
      path: '/api/recipes/:recipeId/ingredients/:ingredientId' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
};

// ============================================
// REQUIRED: buildUrl helper
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
