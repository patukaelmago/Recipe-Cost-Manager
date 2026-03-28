import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIngredients } from "@/hooks/use-ingredients";
import { useRecipes } from "@/hooks/use-recipes";
import { ChefHat, TrendingUp, UtensilsCrossed, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRoute } from "wouter";
import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [, params] = useRoute("/:tenant/dashboard");
  const tenant = params?.tenant ?? "picania";

  // IMPORTANTE: Pasamos el tenant a los hooks para que filtren por local
  const { data: ingredients, isLoading: isLoadingIngredients } = useIngredients(tenant);
  const { data: recipes, isLoading: isLoadingRecipes } = useRecipes(tenant);
  const [tenantMargin, setTenantMargin] = useState(50);

  // Cargar la configuración del tenant (margen por defecto)
  useEffect(() => {
    const fetchTenantConfig = async () => {
      try {
        const tenantRef = doc(db, "tenants", tenant);
        const snap = await getDoc(tenantRef);
        if (snap.exists() && snap.data().pricingPercentage !== undefined) {
          setTenantMargin(Number(snap.data().pricingPercentage));
        }
      } catch (err) {
        console.error("Error al cargar config del tenant:", err);
      }
    };
    fetchTenantConfig();
  }, [tenant]);

  // Lógica para calcular estadísticas dinámicas
  const stats = useMemo(() => {
    if (!recipes || !ingredients || recipes.length === 0) {
      return { avgCost: 0, avgMargin: 0, activeCount: 0 };
    }

    const recipesWithData = (recipes as any[]).map(recipe => {
      const items = recipe.ingredients ?? [];
      
      // Calculamos el costo buscando el ingrediente por ID en la lista global de 44 items
      const cost = items.reduce((total: number, item: any) => {
        // Buscamos coincidencia de ID (probamos varias rutas por si la estructura varía)
        const targetId = item.ingredientId || item.id || item.ingredient?.id;
        const ingData = ingredients.find(i => i.id === targetId);
        
        if (!ingData) return total;

        const price = Number(ingData.price) || 0;
        const size = Number(ingData.packageSize) || 1;
        const quantity = Number(item.quantity) || 0;

        return total + ((price / size) * quantity);
      }, 0);
      
      // Priorizamos el margen individual de la receta
      const margin = recipe.pricingPercentage !== undefined 
        ? Number(recipe.pricingPercentage) 
        : tenantMargin;

      return { ...recipe, realCost: cost, realMargin: margin };
    });

    // Filtramos para promediar solo las recetas que tienen ingredientes cargados (como tus 2 recetas actuales)
    const activeRecipes = recipesWithData.filter(r => (r.ingredients ?? []).length > 0);

    if (activeRecipes.length === 0) {
      return { avgCost: 0, avgMargin: 0, activeCount: 0 };
    }

    const totalCount = activeRecipes.length;
    const sumCosts = activeRecipes.reduce((acc, r) => acc + r.realCost, 0);
    const sumMargins = activeRecipes.reduce((acc, r) => acc + r.realMargin, 0);

    return {
      avgCost: sumCosts / totalCount,
      avgMargin: sumMargins / totalCount,
      activeCount: totalCount
    };
  }, [recipes, ingredients, tenantMargin]);

  const totalIngredients = ingredients?.length || 0;
  const totalRecipes = recipes?.length || 0;

  const chartData = [
    { name: "Ingredientes", total: totalIngredients },
    { name: "Recetas", total: totalRecipes },
  ];

  return (
    <Shell>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Resumen de los costos e inventario de su cocina.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Ingredientes"
            value={totalIngredients}
            icon={ChefHat}
            loading={isLoadingIngredients}
            description="Artículos activos en stock"
          />
          <StatCard
            title="Recetas"
            value={totalRecipes}
            icon={UtensilsCrossed}
            loading={isLoadingRecipes}
            description="Cantidad de recetas creadas"
          />
          <StatCard
            title="Costo Promedio"
            value={`$${stats.avgCost.toFixed(2)}`}
            icon={DollarSign}
            loading={isLoadingRecipes}
            description={`Basado en ${stats.activeCount} recetas costeadas`}
          />
          <StatCard
            title="Margen Promedio"
            value={`${stats.avgMargin.toFixed(0)}%`}
            icon={TrendingUp}
            loading={isLoadingRecipes}
            description="Margen promedio del menú"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-xl">Descripción general del inventario</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar
                      dataKey="total"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      className="fill-primary"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-3 shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-xl">Recetas recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingRecipes ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-3 w-[100px]" />
                      </div>
                    </div>
                  ))
                ) : (recipes as any[])?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Sin recetas.</p>
                ) : (
                  (recipes as any[])?.slice(0, 5).map((recipe) => (
                    <div key={recipe.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <UtensilsCrossed className="h-5 w-5" />
                      </div>
                      <div className="grid gap-1">
                        <p className="text-sm font-medium leading-none">{recipe.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {recipe.description || "Sin descripción"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Shell>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
  description,
}: {
  title: string;
  value: string | number;
  icon: any;
  loading: boolean;
  description: string;
}) {
  return (
    <Card className="shadow-sm border-border/50 overflow-hidden relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground font-sans">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-[60px]" />
        ) : (
          <div className="text-2xl font-bold font-display">{value}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}