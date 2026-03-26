import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useTenantSettings,
  useUpdateTenantSettings,
} from "@/hooks/use-tenant-settings";
import {
  useRecipe,
  useAddRecipeIngredient,
  useRemoveRecipeIngredient,
  useDeleteRecipe,
  useUpdateRecipe,
} from "@/hooks/use-recipes";
import { useIngredients } from "@/hooks/use-ingredients";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Trash2, Printer, Pencil } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function RecipeDetail() {
  const [editOpen, setEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [isSavingQuantity, setIsSavingQuantity] = useState(false);

  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [pricingInput, setPricingInput] = useState("");

  const queryClient = useQueryClient();

  const [, params] = useRoute("/:tenant/recipes/:id");
  const tenant = params?.tenant ?? "picania";
  const recipeId = params?.id ?? "";

  const { data: recipe, isLoading } = useRecipe(recipeId, tenant);
  const { data: tenantSettings } = useTenantSettings(tenant);
  const { mutate: updateTenantSettings, isPending: isUpdatingTenantSettings } =
    useUpdateTenantSettings(tenant);

  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const ingredientsCost = useMemo(() => {
    if (!recipe) return 0;

    const items = recipe.ingredients ?? [];

    return items.reduce((total, item) => {
      const pricePerUnit =
        (item.ingredient.price ?? 0) / (item.ingredient.packageSize || 1);

      return total + pricePerUnit * (item.quantity ?? 0);
    }, 0);
  }, [recipe]);

  const pricingPercentage = tenantSettings?.pricingPercentage ?? 50;
  const suggestedPrice = ingredientsCost * (1 + pricingPercentage / 100);

  const handleSaveQuantity = async () => {
    if (!editingItem || !recipe) return;

    const quantityNumber = Number(editQuantity);

    if (Number.isNaN(quantityNumber) || quantityNumber <= 0) {
      toast({
        title: "Error",
        description: "Cantidad no válida",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSavingQuantity(true);

      const itemRef = doc(
        db,
        "tenants",
        tenant,
        "recipes",
        recipeId,
        "ingredients",
        editingItem.id
      );

      await updateDoc(itemRef, {
        quantity: quantityNumber,
        updatedAt: serverTimestamp(),
      });

      queryClient.setQueryData(
        ["recipe", tenant, recipeId],
        (oldData: any) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            ingredients: oldData.ingredients.map((item: any) =>
              item.id === editingItem.id
                ? { ...item, quantity: quantityNumber }
                : item
            ),
          };
        }
      );

      toast({
        title: "Actualizado",
        description: "Guardado correctamente",
      });

      setEditOpen(false);
      setEditingItem(null);
      setEditQuantity("");

      await queryClient.invalidateQueries({
        queryKey: ["recipe", tenant, recipeId],
      });
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudo guardar",
        variant: "destructive",
      });
    } finally {
      setIsSavingQuantity(false);
    }
  };

  const handleSavePricingPercentage = () => {
    const value = Number(pricingInput);

    if (Number.isNaN(value) || value < 0) {
      toast({
        title: "Error",
        description: "Porcentaje no válido",
        variant: "destructive",
      });
      return;
    }

    updateTenantSettings(
      { pricingPercentage: value },
      {
        onSuccess: () => {
          toast({
            title: "Actualizado",
            description: "Porcentaje guardado correctamente",
          });
          setPricingDialogOpen(false);
        },
        onError: () => {
          toast({
            title: "Error",
            description: "No se pudo guardar el porcentaje",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading) return <RecipeDetailSkeleton />;
  if (!recipe) return <div className="p-8 text-center text-primary">Receta no encontrada</div>;

  return (
    <>
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setEditingItem(null);
            setEditQuantity("");
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar cantidad</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveQuantity();
            }}
          >
            <div className="space-y-2">
              <Label>Ingrediente</Label>
              <div className="text-sm text-muted-foreground">
                {editingItem?.ingredient?.name ?? ""}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-quantity">
                Cantidad {editingItem?.ingredient?.unit ? `(${editingItem.ingredient.unit})` : ""}
              </Label>
              <Input
                id="edit-quantity"
                type="number"
                step="any"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveQuantity();
                  }
                }}
                placeholder="0.00"
                autoFocus
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="submit" disabled={isSavingQuantity} className="w-full">
                {isSavingQuantity ? "Guardando..." : "Guardar cantidad"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pricingDialogOpen}
        onOpenChange={(open) => {
          setPricingDialogOpen(open);
          if (open) {
            setPricingInput(String(pricingPercentage));
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar porcentaje sugerido</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSavePricingPercentage();
            }}
            className="space-y-4 pt-4"
          >
            <div className="space-y-2">
              <Label htmlFor="pricing-percentage">Porcentaje</Label>
              <Input
                id="pricing-percentage"
                type="number"
                step="any"
                value={pricingInput}
                onChange={(e) => setPricingInput(e.target.value)}
                placeholder="50"
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={isUpdatingTenantSettings}
              >
                {isUpdatingTenantSettings ? "Guardando..." : "Guardar porcentaje"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Shell>
        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="p-0 h-auto text-muted-foreground hover:bg-transparent hover:text-foreground justify-start"
                onClick={() => setLocation(`/${tenant}/recipes`)}
                type="button"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Volver a Recetas
              </Button>

              <h1 className="text-4xl font-bold font-display tracking-tight text-foreground">
                {recipe.name}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                {recipe.description || ""}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <EditRecipeDialog
                id={recipeId}
                tenant={tenant}
                name={recipe.name}
                description={recipe.description || ""}
              />

              <Button variant="outline" size="icon" type="button">
                <Printer className="h-4 w-4" />
              </Button>

              <DeleteRecipeDialog id={recipeId} tenant={tenant} name={recipe.name} />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 shadow-sm border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-display text-xl">Ingredients</CardTitle>
                <AddIngredientDialog recipeId={recipeId} tenant={tenant} />
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ingrediente</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Costo Unitario</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {(recipe.ingredients ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Aún no se han añadido ingredientes.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recipe.ingredients.map((item: any) => {
                        const pricePerUnit =
                          (item.ingredient.price ?? 0) / (item.ingredient.packageSize || 1);
                        const totalCost = pricePerUnit * (item.quantity ?? 0);

                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.ingredient.name}</TableCell>
                            <TableCell>
                              {item.quantity} {item.ingredient.unit}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              ${pricePerUnit.toFixed(4)}/{item.ingredient.unit}
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              ${totalCost.toFixed(2)}
                            </TableCell>
                            <TableCell className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                type="button"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-70 hover:opacity-100"
                                onClick={() => {
                                  setEditingItem(item);
                                  setEditQuantity(String(item.quantity));
                                  setEditOpen(true);
                                }}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>

                              <RemoveIngredientButton
                                recipeId={recipeId}
                                itemId={item.id}
                                tenant={tenant}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="bg-primary/5 border-primary/20 shadow-lg shadow-primary/5">
                <CardHeader>
                  <CardTitle className="font-display text-xl text-primary">Análisis de costos</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex justify-between items-end border-b pb-4 border-primary/10">
                    <span className="text-muted-foreground font-medium">Costo Total</span>
                    <span className="text-4xl font-bold text-foreground font-display">
                      ${ingredientsCost.toFixed(2)}
                    </span>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Recuento de ingredientes</span>
                      <span className="font-medium">{(recipe.ingredients ?? []).length}</span>
                    </div>

                    <Button
  type="button"
  variant="ghost"
  className="group w-full h-auto px-0 py-2 justify-between items-start font-normal hover:bg-primary/5"
  onClick={() => {
    setPricingInput(String(pricingPercentage));
    setPricingDialogOpen(true);
  }}
>
  <div className="flex flex-col items-start text-left">
    <span className="text-muted-foreground text-sm">
      Precio sugerido
    </span>

    <span className="text-xs flex items-center gap-1 text-primary font-medium">
      Margen  {pricingPercentage}%
      <Pencil className="h-3 w-3 text-primary transition-all group-hover:scale-110 group-hover:opacity-100 opacity-80" />
    </span>
  </div>

  <span className="font-semibold text-sm text-primary">
    ${suggestedPrice.toFixed(2)}
  </span>
</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Notas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Los costos se calculan según los precios actuales de los ingredientes.
                    Al actualizar los precios de los ingredientes, el costo de esta receta se actualizará automáticamente.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Shell>
    </>
  );
}

function EditRecipeDialog({
  id,
  tenant,
  name,
  description,
}: {
  id: string;
  tenant: string;
  name: string;
  description: string;
}) {
  const [open, setOpen] = useState(false);

  const [recipeName, setRecipeName] = useState(name);
  const [recipeDescription, setRecipeDescription] = useState(description);
  const { mutate, isPending } = useUpdateRecipe(tenant);
  const { toast } = useToast();

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setRecipeName(name);
      setRecipeDescription(description);
    }
    setOpen(nextOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = recipeName.trim();
    const cleanDescription = recipeDescription.trim();

    if (!cleanName) {
      toast({
        title: "Error",
        description: "El nombre de la receta es obligatorio",
        variant: "destructive",
      });
      return;
    }

    mutate(
      {
        id,
        name: cleanName,
        description: cleanDescription,
      },
      {
        onSuccess: () => {
          toast({
            title: "Actualizado",
            description: "La receta se actualizó correctamente",
          });
          setOpen(false);
        },
        onError: (err: any) => {
          toast({
            title: "Error",
            description: err?.message ?? "No se pudo actualizar la receta",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" type="button">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar receta</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="recipe-name">Nombre</Label>
            <Input
              id="recipe-name"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              placeholder="Nombre de la receta"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipe-description">Descripción</Label>
            <Textarea
              id="recipe-description"
              value={recipeDescription}
              onChange={(e) => setRecipeDescription(e.target.value)}
              placeholder="Descripción de la receta"
              rows={4}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddIngredientDialog({
  recipeId,
  tenant,
}: {
  recipeId: string;
  tenant: string;
}) {
  const [open, setOpen] = useState(false);
  const { data: ingredients } = useIngredients(tenant);
  const { mutate, isPending } = useAddRecipeIngredient(tenant);
  const { toast } = useToast();

  const [selectedIngredientId, setSelectedIngredientId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");

  const selected = ingredients?.find((i) => i.id === selectedIngredientId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredientId || !quantity) return;

    mutate(
      {
        recipeId,
        ingredientId: selectedIngredientId,
        quantity: Number(quantity),
      },
      {
        onSuccess: () => {
          toast({ title: "Added", description: "Ingredient added to recipe" });
          setOpen(false);
          setQuantity("");
          setSelectedIngredientId("");
        },
        onError: (err: any) => {
          toast({
            title: "Error",
            description: err?.message ?? "Error",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-primary">Agregar Item</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Ingrediente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Elegir Ingrediente</Label>
            <Select
              value={selectedIngredientId}
              onValueChange={(value) => {
                setSelectedIngredientId(value);

                setTimeout(() => {
                  const input = document.getElementById("qty-input");
                  if (input instanceof HTMLInputElement) {
                    input.focus();
                    input.select();
                  }
                }, 0);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar ingrediente" />
              </SelectTrigger>
              <SelectContent>
                {ingredients?.map((ing) => (
                  <SelectItem key={ing.id} value={ing.id}>
                    {ing.name} ({ing.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Cantidad {selected ? `(${selected.unit})` : ""}
            </Label>
            <Input
              id="qty-input"
              type="number"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full"
            >
              {isPending ? "Agregando..." : "Add to Recipe"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RemoveIngredientButton({
  recipeId,
  itemId,
  tenant,
}: {
  recipeId: string;
  itemId: string;
  tenant: string;
}) {
  const { mutate, isPending } = useRemoveRecipeIngredient(tenant);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-50 hover:opacity-100"
      onClick={() => mutate({ recipeId, itemId })}
      disabled={isPending}
      type="button"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function DeleteRecipeDialog({
  id,
  tenant,
  name,
}: {
  id: string;
  tenant: string;
  name: string;
}) {
  const { mutate, isPending } = useDeleteRecipe(tenant);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const onDelete = () => {
    mutate(id, {
      onSuccess: () => {
        toast({ title: "Deleted", description: "Recipe deleted successfully" });
        setLocation(`/${tenant}/recipes`);
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err?.message ?? "Error", variant: "destructive" });
      },
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Borrar Receta?</AlertDialogTitle>
          <AlertDialogDescription>
            Estàs seguro de borrar la Receta &quot;{name}&quot;? Esta acción no se puede deshacer
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isPending ? "Deleting..." : "Delete Recipe"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RecipeDetailSkeleton() {
  return (
    <Shell>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[100px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    </Shell>
  );
}