import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRecipes, useCreateRecipe } from "@/hooks/use-recipes";
import { useTenantSettings } from "@/hooks/use-tenant-settings";
import { Plus, Search, UtensilsCrossed, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRecipeSchema, type InsertRecipe } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Recipes() {
  const [, params] = useRoute("/:tenant/recipes");
  const tenant = params?.tenant ?? "picania";

  const { data: recipes, isLoading } = useRecipes(tenant);
  const { data: tenantSettings } = useTenantSettings(tenant);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const defaultMargin = Number(tenantSettings?.pricingPercentage ?? 50);

  const filteredRecipes = useMemo(() => {
    const list = recipes ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;

    return list.filter((r) => {
      const name = String(r.name ?? "").toLowerCase();
      const description = String(r.description ?? "").toLowerCase();
      return name.includes(q) || description.includes(q);
    });
  }, [recipes, search]);

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-display mb-1">
              Recetas
            </h1>
            <p className="text-muted-foreground">Calculá el costo de tus items</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="btn-primary">
            <Plus className="mr-2 h-4 w-4" /> Nueva Receta
          </Button>
        </div>

        <div className="flex items-center gap-2 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Busca Recetas..."
              className="pl-9 bg-card border-border/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array(6)
              .fill(0)
              .map((_, i) => <RecipeSkeleton key={i} />)
          ) : filteredRecipes.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No se encontraron recetas. Crea tu primer receta!
            </div>
          ) : (
            filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                tenant={tenant}
                defaultMargin={defaultMargin}
              />
            ))
          )}
        </div>
      </div>

      <CreateRecipeDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        tenant={tenant}
        defaultMargin={defaultMargin}
      />
    </Shell>
  );
}

function RecipeCard({
  recipe,
  tenant,
  defaultMargin,
}: {
  recipe: {
    id: string;
    name: string;
    description?: string;
    pricingPercentage?: number;
    ingredients?: Array<{
      id: string;
      ingredientId: string;
      quantity: number;
      ingredient?: {
        id: string;
        name: string;
        unit: string;
        packageSize: number;
        price: number;
      };
    }>;
  };
  tenant: string;
  defaultMargin: number;
}) {
  const items = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];

  const cost = items.reduce((total, item) => {
    const ingredient = item.ingredient;
    if (!ingredient) return total;

    const price = Number(ingredient.price ?? 0);
    const packageSize = Number(ingredient.packageSize ?? 0);
    const quantity = Number(item.quantity ?? 0);

    if (!packageSize || !quantity) return total;

    return total + (price / packageSize) * quantity;
  }, 0);

  const margin =
    recipe.pricingPercentage !== undefined && recipe.pricingPercentage !== null
      ? Number(recipe.pricingPercentage)
      : defaultMargin;

  const price = cost * (1 + margin / 100);

  return (
    <Card className="card-hover group border-border/50 overflow-hidden flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
        </div>

        <CardTitle className="font-display text-xl line-clamp-1">
          {recipe.name}
        </CardTitle>

        <CardDescription className="line-clamp-2 h-10">
          {recipe.description || "No se proporciona descripción."}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Costo</span>
            <span className="font-medium text-foreground">
              ${cost.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Precio</span>
            <span className="font-semibold text-primary">
              ${price.toFixed(2)}{" "}
              <span className="text-muted-foreground font-normal">
                ({margin.toFixed(0)}%)
              </span>
            </span>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Haga clic en los detalles para administrar los ingredientes y ver los costos.
        </div>
      </CardContent>

      <CardFooter className="border-t bg-muted/20 p-4">
        <Link href={`/${tenant}/recipes/${recipe.id}`} className="w-full">
          <Button
            variant="ghost"
            className="w-full justify-between group-hover:text-primary"
            type="button"
          >
            Ver Detalles
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

function RecipeSkeleton() {
  return (
    <Card className="border-border/50 h-[320px]">
      <CardHeader>
        <Skeleton className="h-12 w-12 rounded-xl mb-4" />
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full rounded-md" />
      </CardFooter>
    </Card>
  );
}

function CreateRecipeDialog({
  open,
  onOpenChange,
  tenant,
  defaultMargin,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: string;
  defaultMargin: number;
}) {
  const { mutate, isPending } = useCreateRecipe(tenant);
  const { toast } = useToast();

  const form = useForm<InsertRecipe>({
    resolver: zodResolver(insertRecipeSchema),
    defaultValues: {
      name: "",
      description: "",
      pricingPercentage: defaultMargin,
    } as any,
  });

  const onSubmit = (data: InsertRecipe) => {
    mutate(data, {
      onSuccess: () => {
        toast({ title: "Éxito", description: "Receta creada correctamente." });
        form.reset({
          name: "",
          description: "",
          pricingPercentage: defaultMargin,
        } as any);
        onOpenChange(false);
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (nextOpen) {
          form.reset({
            name: "",
            description: "",
            pricingPercentage: defaultMargin,
          } as any);
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crea una nueva Receta</DialogTitle>
          <DialogDescription>
            Empieza por darle un nombre, descripción y margen a tu receta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Receta</Label>
            <Input id="name" {...form.register("name")} placeholder="e.g. Chocolate Cake" />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Breve descripción de la receta..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pricingPercentage">Margen de Ganancia (%)</Label>
            <Input
              id="pricingPercentage"
              type="number"
              {...form.register("pricingPercentage", { valueAsNumber: true })}
              placeholder="50"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? "Creating..." : "Create Recipe"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}