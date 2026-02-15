import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIngredients, useCreateIngredient, useUpdateIngredient, useDeleteIngredient } from "@/hooks/use-ingredients";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertIngredientSchema, type InsertIngredient } from "@shared/schema";
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

export default function Ingredients() {
  const { data: ingredients, isLoading } = useIngredients();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredIngredients = ingredients?.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Shell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-display mb-1">Ingredients</h1>
            <p className="text-muted-foreground">Manage your raw materials and costs.</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="btn-primary">
            <Plus className="mr-2 h-4 w-4" /> Add Ingredient
          </Button>
        </div>

        <div className="flex items-center gap-2 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ingredients..."
              className="pl-9 bg-card border-border/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[300px] font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Unit</TableHead>
                <TableHead className="font-semibold">Package Size</TableHead>
                <TableHead className="font-semibold">Package Price</TableHead>
                <TableHead className="font-semibold">Cost per Unit</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Loading ingredients...
                  </TableCell>
                </TableRow>
              ) : filteredIngredients?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No ingredients found. Add one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredIngredients?.map((ingredient) => (
                  <TableRow key={ingredient.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium">{ingredient.name}</TableCell>
                    <TableCell>{ingredient.unit}</TableCell>
                    <TableCell>{ingredient.packageSize}</TableCell>
                    <TableCell>${parseFloat(ingredient.price).toFixed(2)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      ${(parseFloat(ingredient.price) / parseFloat(ingredient.packageSize)).toFixed(4)} / {ingredient.unit}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <EditIngredientDialog ingredient={ingredient} />
                        <DeleteIngredientDialog id={ingredient.id} name={ingredient.name} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <CreateIngredientDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </Shell>
  );
}

function IngredientForm({ 
  defaultValues, 
  onSubmit, 
  isLoading 
}: { 
  defaultValues?: Partial<InsertIngredient>; 
  onSubmit: (data: InsertIngredient) => void;
  isLoading: boolean;
}) {
  const form = useForm<InsertIngredient>({
    resolver: zodResolver(insertIngredientSchema),
    defaultValues: defaultValues || {
      name: "",
      unit: "kg",
      packageSize: "1",
      price: "0",
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...form.register("name")} placeholder="e.g. Flour" />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Input id="unit" {...form.register("unit")} placeholder="e.g. kg, l, pcs" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="packageSize">Package Size</Label>
          <Input 
            id="packageSize" 
            type="number" 
            step="0.01" 
            {...form.register("packageSize")} 
            placeholder="Amount in pkg" 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Price ($)</Label>
        <Input 
          id="price" 
          type="number" 
          step="0.01" 
          {...form.register("price")} 
          placeholder="Cost of package" 
        />
      </div>

      <DialogFooter className="pt-4">
        <Button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading ? "Saving..." : "Save Ingredient"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function CreateIngredientDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { mutate, isPending } = useCreateIngredient();
  const { toast } = useToast();

  const onSubmit = (data: InsertIngredient) => {
    mutate(data, {
      onSuccess: () => {
        toast({ title: "Success", description: "Ingredient created successfully" });
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
          <DialogTitle>Add Ingredient</DialogTitle>
          <DialogDescription>
            Enter the details for a new raw ingredient.
          </DialogDescription>
        </DialogHeader>
        <IngredientForm onSubmit={onSubmit} isLoading={isPending} />
      </DialogContent>
    </Dialog>
  );
}

function EditIngredientDialog({ ingredient }: { ingredient: any }) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useUpdateIngredient();
  const { toast } = useToast();

  const onSubmit = (data: InsertIngredient) => {
    mutate({ id: ingredient.id, ...data }, {
      onSuccess: () => {
        toast({ title: "Success", description: "Ingredient updated successfully" });
        setOpen(false);
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Ingredient</DialogTitle>
        </DialogHeader>
        <IngredientForm 
          defaultValues={{
            name: ingredient.name,
            unit: ingredient.unit,
            packageSize: ingredient.packageSize,
            price: ingredient.price,
          }}
          onSubmit={onSubmit} 
          isLoading={isPending} 
        />
      </DialogContent>
    </Dialog>
  );
}

function DeleteIngredientDialog({ id, name }: { id: number; name: string }) {
  const { mutate, isPending } = useDeleteIngredient();
  const { toast } = useToast();

  const onDelete = () => {
    mutate(id, {
      onSuccess: () => {
        toast({ title: "Success", description: "Ingredient deleted" });
      },
      onError: (err) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the ingredient.
            Any recipes using this ingredient will need to be updated.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} disabled={isPending} className="bg-destructive hover:bg-destructive/90">
            {isPending ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
