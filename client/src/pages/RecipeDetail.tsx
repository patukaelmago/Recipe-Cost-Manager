import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRecipe, useDeleteRecipe } from "@/hooks/use-recipes";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Trash2, Printer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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

  const ingredientsCost = recipe.ingredients.reduce((total, item) => {
    const pricePerUnit =
      parseFloat(item.ingredient.price) /
      parseFloat(item.ingredient.packageSize);

    return total + pricePerUnit * parseFloat(item.quantity);
  }, 0);

  return (
    <Shell>
      <div className="flex flex-col gap-8 max-w-5xl mx-auto">
        <div className="flex justify-between items-start">
          <div>
            <Button
              variant="ghost"
              className="p-0 h-auto mb-2 justify-start text-muted-foreground hover:bg-transparent hover:text-foreground"
              onClick={() => setLocation("/recipes")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <h1 className="text-3xl font-bold">{recipe.name}</h1>
            <p className="text-muted-foreground">{recipe.description}</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="icon">
              <Printer className="h-4 w-4" />
            </Button>
            <DeleteRecipeDialog id={id} name={recipe.name} />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ingredients</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipe.ingredients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6">
                      No ingredients
                    </TableCell>
                  </TableRow>
                ) : (
                  recipe.ingredients.map((item) => {
                    const pricePerUnit =
                      parseFloat(item.ingredient.price) /
                      parseFloat(item.ingredient.packageSize);

                    const totalCost =
                      pricePerUnit * parseFloat(item.quantity);

                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.ingredient.name}</TableCell>
                        <TableCell>
                          {item.quantity} {item.ingredient.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          ${totalCost.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${ingredientsCost.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}

function DeleteRecipeDialog({ id, name }: { id: number; name: string }) {
  const { mutate, isPending } = useDeleteRecipe();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const onDelete = () => {
    mutate(id, {
      onSuccess: () => {
        toast({
          title: "Deleted",
          description: "Recipe deleted successfully",
        });
        setLocation("/recipes");
      },
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Recipe?</AlertDialogTitle>
          <AlertDialogDescription>
            Delete "{name}" permanently?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} disabled={isPending}>
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RecipeDetailSkeleton() {
  return (
    <Shell>
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    </Shell>
  );
}