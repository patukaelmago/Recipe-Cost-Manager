import { Shell } from "@/components/layout/Shell";
import { formatPrice } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChefHat, TrendingUp, UtensilsCrossed, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRoute } from "wouter";
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Ingredient = {
  id: string;
  name: string;
  unit: string;
  packageSize: number;
  price: number;
};

type RecipeIngredientItem = {
  id: string;
  ingredientId: string;
  quantity: number;
  ingredient?: Ingredient;
};

type Recipe = {
  id: string;
  name: string;
  description?: string;
  pricingPercentage?: number;
  createdAt?: any;
  updatedAt?: any;
  ingredients: RecipeIngredientItem[];
};

type DashboardStats = {
  totalIngredients: number;
  totalRecipes: number;
  avgCost: number;
  avgMargin: number;
  activeCount: number;
  recentRecipes: Recipe[];
};

export default function Dashboard() {
  const [, params] = useRoute("/:tenant/dashboard");
  const tenant = params?.tenant ?? "picania";

  const [tenantMargin, setTenantMargin] = useState(50);
  const [stats, setStats] = useState<DashboardStats>({
    totalIngredients: 0,
    totalRecipes: 0,
    avgCost: 0,
    avgMargin: 0,
    activeCount: 0,
    recentRecipes: [],
  });

  const [isLoadingTenantConfig, setIsLoadingTenantConfig] = useState(true);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);

  useEffect(() => {
    const fetchTenantConfig = async () => {
      try {
        setIsLoadingTenantConfig(true);

        const tenantRef = doc(db, "tenants", tenant);
        const snap = await getDoc(tenantRef);

        if (snap.exists() && snap.data().pricingPercentage !== undefined) {
          setTenantMargin(Number(snap.data().pricingPercentage));
        } else {
          setTenantMargin(50);
        }
      } catch (err) {
        console.error("Error al cargar config del tenant:", err);
        setTenantMargin(50);
      } finally {
        setIsLoadingTenantConfig(false);
      }
    };

    fetchTenantConfig();
  }, [tenant]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoadingDashboard(true);

        const ingredientsRef = collection(db, "tenants", tenant, "ingredients");
        const recipesRef = collection(db, "tenants", tenant, "recipes");

        const [ingredientsSnap, recipesSnap] = await Promise.all([
          getDocs(query(ingredientsRef, orderBy("name"))),
          getDocs(query(recipesRef, orderBy("updatedAt", "desc"))),
        ]);

        const ingredientsMap = new Map<string, Ingredient>();

        ingredientsSnap.docs.forEach((d) => {
          const data = d.data() as any;

          ingredientsMap.set(d.id, {
            id: d.id,
            name: String(data?.name ?? ""),
            unit: String(data?.unit ?? ""),
            packageSize: Number(data?.packageSize ?? 0),
            price: Number(data?.price ?? 0),
          });
        });

        const recipes: Recipe[] = await Promise.all(
          recipesSnap.docs.map(async (recipeDoc) => {
            const recipeData = recipeDoc.data() as any;

            const recipeItemsRef = collection(
              db,
              "tenants",
              tenant,
              "recipes",
              recipeDoc.id,
              "ingredients"
            );

            const recipeItemsSnap = await getDocs(recipeItemsRef);

            const recipeItems: RecipeIngredientItem[] = recipeItemsSnap.docs.map((itemDoc) => {
              const itemData = itemDoc.data() as any;
              const ingredientId = String(itemData?.ingredientId ?? "");
              const ingredient = ingredientsMap.get(ingredientId);

              return {
                id: itemDoc.id,
                ingredientId,
                quantity: Number(itemData?.quantity ?? 0),
                ingredient,
              };
            });

            return {
              id: recipeDoc.id,
              name: String(recipeData?.name ?? ""),
              description: String(recipeData?.description ?? ""),
              pricingPercentage:
                recipeData?.pricingPercentage !== undefined &&
                recipeData?.pricingPercentage !== null
                  ? Number(recipeData.pricingPercentage)
                  : undefined,
              createdAt: recipeData?.createdAt ?? null,
              updatedAt: recipeData?.updatedAt ?? null,
              ingredients: recipeItems,
            };
          })
        );

        const recipesWithCost = recipes.map((recipe) => {
          const realCost = recipe.ingredients.reduce((total, item) => {
            if (!item.ingredient) return total;

            const price = Number(item.ingredient.price ?? 0);
            const packageSize = Number(item.ingredient.packageSize ?? 0);
            const quantity = Number(item.quantity ?? 0);

            if (!packageSize || !quantity) return total;

            return total + (price / packageSize) * quantity;
          }, 0);

          const realMargin =
            recipe.pricingPercentage !== undefined && recipe.pricingPercentage !== null
              ? Number(recipe.pricingPercentage)
              : tenantMargin;

          return {
            ...recipe,
            realCost,
            realMargin,
            hasIngredients: recipe.ingredients.length > 0,
          };
        });

        const activeRecipes = recipesWithCost.filter((recipe) => recipe.hasIngredients);

        const totalCost = activeRecipes.reduce((acc, recipe) => acc + recipe.realCost, 0);
        const totalMargin = activeRecipes.reduce((acc, recipe) => acc + recipe.realMargin, 0);

        setStats({
          totalIngredients: ingredientsSnap.size,
          totalRecipes: recipes.length,
          avgCost: activeRecipes.length > 0 ? totalCost / activeRecipes.length : 0,
          avgMargin: activeRecipes.length > 0 ? totalMargin / activeRecipes.length : 0,
          activeCount: activeRecipes.length,
          recentRecipes: recipes.slice(0, 5),
        });
      } catch (err) {
        console.error("Error al cargar dashboard:", err);
        setStats({
          totalIngredients: 0,
          totalRecipes: 0,
          avgCost: 0,
          avgMargin: 0,
          activeCount: 0,
          recentRecipes: [],
        });
      } finally {
        setIsLoadingDashboard(false);
      }
    };

    if (!isLoadingTenantConfig) {
      fetchDashboardData();
    }
  }, [tenant, tenantMargin, isLoadingTenantConfig]);

  const chartData = [
    { name: "Ingredientes", total: stats.totalIngredients },
    { name: "Recetas", total: stats.totalRecipes },
  ];

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Shell>
      <div className="flex flex-col gap-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-display mb-2">Dashboard</h2>
          <p className="text-muted-foreground">Resumen de los costos e inventario de su cocina.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Ingredientes"
            value={stats.totalIngredients}
            icon={ChefHat}
            loading={isLoadingDashboard}
            description="Artículos activos en stock"
          />
          <StatCard
            title="Recetas"
            value={stats.totalRecipes}
            icon={UtensilsCrossed}
            loading={isLoadingDashboard}
            description="Cantidad de recetas creadas"
          />
          <StatCard
            title="Costo Promedio"
            value={`$${formatPrice(stats.avgCost)}`}
            icon={DollarSign}
            loading={isLoadingDashboard}
            description={`Basado en ${stats.activeCount} recetas costeadas`}
          />
          <StatCard
            title="Margen Promedio"
            value={`${stats.avgMargin.toFixed(0)}%`}
            icon={TrendingUp}
            loading={isLoadingDashboard}
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
                      cursor={{ fill: "transparent" }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
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
                {isLoadingDashboard ? (
                  Array(3)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[150px]" />
                          <Skeleton className="h-3 w-[100px]" />
                        </div>
                      </div>
                    ))
                ) : stats.recentRecipes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Sin recetas.</p>
                ) : (
                  stats.recentRecipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                    >
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