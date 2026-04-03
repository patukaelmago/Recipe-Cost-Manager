import { formatCurrency } from "@/lib/utils";
import { Shell } from "@/components/layout/Shell";
import { formatPrice } from "@/lib/format";
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
import {
  useIngredients,
  useCreateIngredient,
  useUpdateIngredient,
  useDeleteIngredient,
} from "@/hooks/use-ingredients";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertIngredientSchema, type InsertIngredient } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useRoute } from "wouter";
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

type Ingredient = NonNullable<ReturnType<typeof useIngredients>["data"]>[number];

export default function IngredientsPage() {
  const [, params] = useRoute("/:tenant/ingredients");
  const tenant = params?.tenant ?? "picania";

  const { data: ingredients, isLoading } = useIngredients(tenant);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredIngredients = useMemo(() => {
    const list = ingredients ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((i) => i.name.toLowerCase().includes(q));
  }, [ingredients, search]);

  return (
    <Shell>
      <div className="flex flex-col gap-6 w-full min-w-0">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight font-display mb-1">
            Ingredientes
          </h1>
          <p className="text-muted-foreground">
            Gestione sus materias primas y costos.
          </p>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-[420px] min-w-0 order-2 md:order-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar ingredientes..."
              className="h-12 pl-10 bg-card border-border/50 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="w-full md:w-auto order-1 md:order-2">
            <Button
              onClick={() => setIsCreateOpen(true)}
              type="button"
              className="w-full md:w-auto h-12 px-6 flex items-center justify-center gap-2 whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span>Agregar Ingrediente</span>
            </Button>
          </div>
        </div>

        <div className="hidden md:block rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[760px]">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[280px] font-semibold">Nombre</TableHead>
                  <TableHead className="font-semibold">Unidad</TableHead>
                  <TableHead className="font-semibold">Tamaño del Paquete</TableHead>
                  <TableHead className="font-semibold">Precio del Paquete</TableHead>
                  <TableHead className="font-semibold">Costo por Unidad</TableHead>
                  <TableHead className="text-right font-semibold">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Cargando ingredientes...
                    </TableCell>
                  </TableRow>
                ) : filteredIngredients.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-32 text-center text-muted-foreground"
                    >
                      No se encontraron ingredientes. Añade uno para empezar.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIngredients.map((ingredient) => (
                    <IngredientRow
                      key={ingredient.id}
                      ingredient={ingredient}
                      tenant={tenant}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="md:hidden flex flex-col gap-3">
          {isLoading ? (
            <div className="rounded-xl border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
              Cargando ingredientes...
            </div>
          ) : filteredIngredients.length === 0 ? (
            <div className="rounded-xl border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
              No se encontraron ingredientes. Añade uno para empezar.
            </div>
          ) : (
            filteredIngredients.map((ingredient) => (
              <IngredientMobileCard
                key={ingredient.id}
                ingredient={ingredient}
                tenant={tenant}
              />
            ))
          )}
        </div>
      </div>

      <CreateIngredientDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        tenant={tenant}
      />
    </Shell>
  );
}

function IngredientRow({
  ingredient,
  tenant,
}: {
  ingredient: Ingredient;
  tenant: string;
}) {
  const price = ingredient.price;
  const size = ingredient.packageSize;
  const cpu = size > 0 ? price / size : 0;

  return (
    <TableRow className="hover:bg-muted/20 align-top">
      <TableCell className="font-medium break-words whitespace-normal">
        {ingredient.name}
      </TableCell>
      <TableCell>{ingredient.unit}</TableCell>
      <TableCell>{ingredient.packageSize}</TableCell>
      <TableCell>${formatCurrency(price)}</TableCell>
      <TableCell className="font-mono text-xs whitespace-nowrap">
      ${formatCurrency(cpu)} / {ingredient.unit}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <EditIngredientDialog ingredient={ingredient} tenant={tenant} />
          <DeleteIngredientDialog
            id={ingredient.id}
            name={ingredient.name}
            tenant={tenant}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

function IngredientMobileCard({
  ingredient,
  tenant,
}: {
  ingredient: Ingredient;
  tenant: string;
}) {
  const price = ingredient.price;
  const size = ingredient.packageSize;
  const cpu = size > 0 ? price / size : 0;

  return (
    <div className="rounded-xl border bg-card shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-base break-words">{ingredient.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Unidad: {ingredient.unit}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <EditIngredientDialog ingredient={ingredient} tenant={tenant} />
          <DeleteIngredientDialog
            id={ingredient.id}
            name={ingredient.name}
            tenant={tenant}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
        <div className="rounded-lg border bg-muted/20 p-3">
          <p className="text-muted-foreground">Tamaño del paquete</p>
          <p className="font-medium mt-1">{ingredient.packageSize}</p>
        </div>

        <div className="rounded-lg border bg-muted/20 p-3">
          <p className="text-muted-foreground">Precio del paquete</p>
          <p className="font-medium mt-1">${formatCurrency(price)}</p>
        </div>

        <div className="rounded-lg border bg-muted/20 p-3">
          <p className="text-muted-foreground">Costo por unidad</p>
          <p className="font-medium mt-1 break-all">
          ${formatCurrency(cpu)} / {ingredient.unit}
          </p>
        </div>
      </div>
    </div>
  );
}

function IngredientForm({
  defaultValues,
  onSubmit,
  isLoading,
}: {
  defaultValues?: Partial<InsertIngredient>;
  onSubmit: SubmitHandler<InsertIngredient>;
  isLoading: boolean;
}) {
  const form = useForm<InsertIngredient>({
    resolver: zodResolver(insertIngredientSchema),
    defaultValues: {
      name: "",
      unit: "kg",
      packageSize: 1,
      price: 0,
      ...defaultValues,
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" {...form.register("name")} placeholder="Ej: Harina" />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="unit">Unidad</Label>
          <Input
            id="unit"
            {...form.register("unit")}
            placeholder="Ej: kg, l, un"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="packageSize">Tamaño del Paquete</Label>
          <Input
            id="packageSize"
            type="number"
            step="0.01"
            {...form.register("packageSize", { valueAsNumber: true })}
            placeholder="Cantidad del paquete"
          />
          {form.formState.errors.packageSize && (
            <p className="text-xs text-destructive">
              {form.formState.errors.packageSize.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Precio ($)</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          {...form.register("price", { valueAsNumber: true })}
          placeholder="Costo del paquete"
        />
        {form.formState.errors.price && (
          <p className="text-xs text-destructive">
            {form.formState.errors.price.message}
          </p>
        )}
      </div>

      <DialogFooter className="pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full h-11"
        >
          {isLoading ? "Guardando..." : "Guardar Ingrediente"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function CreateIngredientDialog({
  open,
  onOpenChange,
  tenant,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: string;
}) {
  const { mutate, isPending } = useCreateIngredient(tenant);
  const { toast } = useToast();

  const onSubmit: SubmitHandler<InsertIngredient> = (data) => {
    mutate(data, {
      onSuccess: () => {
        toast({
          title: "Éxito",
          description: "Ingrediente creado correctamente",
        });
        onOpenChange(false);
      },
      onError: (err: Error) => {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agregar Ingrediente</DialogTitle>
          <DialogDescription>
            Introduzca los detalles de un nuevo ingrediente.
          </DialogDescription>
        </DialogHeader>
        <IngredientForm onSubmit={onSubmit} isLoading={isPending} />
      </DialogContent>
    </Dialog>
  );
}

function EditIngredientDialog({
  ingredient,
  tenant,
}: {
  ingredient: Ingredient;
  tenant: string;
}) {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useUpdateIngredient(tenant);
  const { toast } = useToast();

  const onSubmit: SubmitHandler<InsertIngredient> = (data) => {
    mutate(
      { id: ingredient.id, ...data },
      {
        onSuccess: () => {
          toast({
            title: "Éxito",
            description: "Ingrediente actualizado correctamente",
          });
          setOpen(false);
        },
        onError: (err: Error) => {
          toast({
            title: "Error",
            description: err.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-primary"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[calc(100vw-2rem)] max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Ingrediente</DialogTitle>
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

function DeleteIngredientDialog({
  id,
  name,
  tenant,
}: {
  id: string;
  name: string;
  tenant: string;
}) {
  const { mutate, isPending } = useDeleteIngredient(tenant);
  const { toast } = useToast();

  const onDelete = () => {
    mutate(id, {
      onSuccess: () => {
        toast({ title: "Éxito", description: "Ingrediente eliminado" });
      },
      onError: (err: Error) => {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Eliminará permanentemente el
            ingrediente. Cualquier receta que lo use deberá actualizarse.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse sm:flex-row">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isPending ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}