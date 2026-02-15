import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRecipes, useCreateRecipe } from "@/hooks/use-recipes";
import { Plus, Search, UtensilsCrossed, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRecipeSchema, type InsertRecipe } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Recipes() {
  const { data: recipes, isLoading } = useRecipes();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredRecipes = recipes?.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-display mb-1">Recipes</h1>
            <p className="text-muted-foreground">Manage your menu items and calculate costs.</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="btn-primary">
            <Plus className="mr-2 h-4 w-4" /> New Recipe
          </Button>
        </div>

        <div className="flex items-center gap-2 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recipes..."
              className="pl-9 bg-card border-border/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => <RecipeSkeleton key={i} />)
          ) : filteredRecipes?.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No recipes found. Create your first recipe!
            </div>
          ) : (
            filteredRecipes?.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))
          )}
        </div>
      </div>

      <CreateRecipeDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </Shell>
  );
}

function RecipeCard({ recipe }: { recipe: any }) {
  return (
    <Card className="card-hover group border-border/50 overflow-hidden flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
        </div>
        <CardTitle className="font-display text-xl line-clamp-1">{recipe.name}</CardTitle>
        <CardDescription className="line-clamp-2 h-10">
          {recipe.description || "No description provided."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="text-sm text-muted-foreground">
          {/* We could add total cost here if it was available in the list view, 
              but for now it's calculated in the detail view */}
          Click details to manage ingredients and view costs.
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/20 p-4">
        <Link href={`/recipes/${recipe.id}`} className="w-full">
          <Button variant="ghost" className="w-full justify-between group-hover:text-primary">
            View Details
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

function RecipeSkeleton() {
  return (
    <Card className="border-border/50 h-[280px]">
      <CardHeader>
        <Skeleton className="h-12 w-12 rounded-xl mb-4" />
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full rounded-md" />
      </CardFooter>
    </Card>
  );
}

function CreateRecipeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { mutate, isPending } = useCreateRecipe();
  const { toast } = useToast();
  const form = useForm<InsertRecipe>({
    resolver: zodResolver(insertRecipeSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = (data: InsertRecipe) => {
    mutate(data, {
      onSuccess: () => {
        toast({ title: "Success", description: "Recipe created successfully" });
        form.reset();
        onOpenChange(false);
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Recipe</DialogTitle>
          <DialogDescription>
            Start by giving your recipe a name and description.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Recipe Name</Label>
            <Input id="name" {...form.register("name")} placeholder="e.g. Chocolate Cake" />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              {...form.register("description")} 
              placeholder="Brief description of the recipe..."
              rows={3}
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
