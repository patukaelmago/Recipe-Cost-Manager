import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRecipe, useAddRecipeIngredient, useRemoveRecipeIngredient, useDeleteRecipe } from "@/hooks/use-recipes";
import { useIngredients } from "@/hooks/use-ingredients";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Plus, Trash2, Printer, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
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
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
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
  const [, params] = useRoute("/recipes/:id");
  const id = parseInt(params?.id || "0");
  const { data: recipe, isLoading } = useRecipe(id);
  const [, setLocation] = useLocation();

  if (isLoading) return <RecipeDetailSkeleton />;
  if (!recipe) return <div className="p-8 text-center">Recipe not found</div>;

  // Calculate costs
  const ingredientsCost = recipe.ingredients.reduce((total, item) => {
    const pricePerUnit = parseFloat(item.ingredient.price) / parseFloat(item.ingredient.packageSize);
    return total + (pricePerUnit * parseFloat(item.quantity));
  }, 0);

  return (
    <Shell>
      <div className="flex flex-col gap-8 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
          <div className="space-y-2">
            <Button 
              variant="link" 
              className="p-0 h-auto text-muted-foreground mb-2" 
              onClick={() => setLocation("/recipes")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Recipes
            </Button>
            <h1 className="text-4xl font-bold font-display tracking-tight text-foreground">
              {recipe.name}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              {recipe.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <Printer className="h-4 w-4" />
            </Button>
            <DeleteRecipeDialog id={id} name={recipe.name} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-display text-xl">Ingredients</CardTitle>
              <AddIngredientDialog recipeId={id} />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipe.ingredients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No ingredients added yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recipe.ingredients.map((item) => {
                      const pricePerUnit = parseFloat(item.ingredient.price) / parseFloat(item.ingredient.packageSize);
                      const totalCost = pricePerUnit * parseFloat(item.quantity);
                      
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
                          <TableCell>
                            <RemoveIngredientButton recipeId={id} ingredientId={item.ingredientId} />
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
                <CardTitle className="font-display text-xl text-primary">Cost Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-end border-b pb-4 border-primary/10">
                  <span className="text-muted-foreground font-medium">Total Cost</span>
                  <span className="text-4xl font-bold text-foreground font-display">
                    ${ingredientsCost.toFixed(2)}
                  </span>
                </div>
                
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ingredient Count</span>
                    <span className="font-medium">{recipe.ingredients.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Suggested Price (30%)</span>
                    <span className="font-medium">${(ingredientsCost / 0.3).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Costs are calculated based on current ingredient prices. 
                  Updating ingredient prices will automatically update this recipe's cost.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function AddIngredientDialog({ recipeId }: { recipeId: number }) {
  const [open, setOpen] = useState(false);
  const { data: ingredients } = useIngredients();
  const { mutate, isPending } = useAddRecipeIngredient();
  const { toast } = useToast();
  
  const [selectedIngredient, setSelectedIngredient] = useState<string>("");
  const [quantity, setQuantity] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredient || !quantity) return;

    mutate({
      recipeId,
      ingredientId: parseInt(selectedIngredient),
      quantity: quantity
    }, {
      onSuccess: () => {
        toast({ title: "Added", description: "Ingredient added to recipe" });
        setOpen(false);
        setQuantity("");
        setSelectedIngredient("");
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  const ingredient = ingredients?.find(i => i.id.toString() === selectedIngredient);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-primary/10 text-primary hover:bg-primary/20 shadow-none">
          <Plus className="mr-2 h-4 w-4" /> Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Ingredient</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Select Ingredient</Label>
            <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
              <SelectTrigger>
                <SelectValue placeholder="Search ingredients..." />
              </SelectTrigger>
              <SelectContent>
                {ingredients?.map((ing) => (
                  <SelectItem key={ing.id} value={ing.id.toString()}>
                    {ing.name} ({ing.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Quantity {ingredient && `(${ingredient.unit})`}</Label>
            <Input 
              type="number" 
              step="0.01" 
              value={quantity} 
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={isPending || !selectedIngredient || !quantity} className="btn-primary w-full">
              {isPending ? "Adding..." : "Add to Recipe"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RemoveIngredientButton({ recipeId, ingredientId }: { recipeId: number; ingredientId: number }) {
  const { mutate, isPending } = useRemoveRecipeIngredient();
  
  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-50 hover:opacity-100"
      onClick={() => mutate({ recipeId, ingredientId })}
      disabled={isPending}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}

function DeleteRecipeDialog({ id, name }: { id: number; name: string }) {
  const { mutate, isPending } = useDeleteRecipe();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const onDelete = () => {
    mutate(id, {
      onSuccess: () => {
        toast({ title: "Deleted", description: "Recipe deleted successfully" });
        setLocation("/recipes");
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="icon" className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Recipe?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{name}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
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
