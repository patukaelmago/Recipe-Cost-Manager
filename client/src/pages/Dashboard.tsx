import { Shell } from "@/components/layout/Shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIngredients } from "@/hooks/use-ingredients";
import { useRecipes } from "@/hooks/use-recipes";
import { ChefHat, TrendingUp, UtensilsCrossed, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
  const { data: ingredients, isLoading: isLoadingIngredients } = useIngredients();
  const { data: recipes, isLoading: isLoadingRecipes } = useRecipes();

  // Basic stats
  const totalIngredients = ingredients?.length || 0;
  const totalRecipes = recipes?.length || 0;

  // Simple chart data - just counting items for now as a placeholder for more complex cost analytics
  const chartData = [
    { name: "Ingredients", total: totalIngredients },
    { name: "Recipes", total: totalRecipes },
  ];

  return (
    <Shell>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your kitchen costs and inventory.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Ingredients"
            value={totalIngredients}
            icon={ChefHat}
            loading={isLoadingIngredients}
            description="Active items in stock"
          />
          <StatCard
            title="Total Recipes"
            value={totalRecipes}
            icon={UtensilsCrossed}
            loading={isLoadingRecipes}
            description="Costed menu items"
          />
          <StatCard
            title="Average Cost"
            value="$12.50"
            icon={DollarSign}
            loading={false}
            description="Per recipe average"
          />
          <StatCard
            title="Monthly Trend"
            value="+12%"
            icon={TrendingUp}
            loading={false}
            description="Cost variation vs last month"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 shadow-sm border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-xl">Inventory Overview</CardTitle>
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
                      tickFormatter={(value) => `${value}`}
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
              <CardTitle className="font-display text-xl">Recent Recipes</CardTitle>
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
                ) : recipes?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No recipes yet.</p>
                ) : (
                  recipes?.slice(0, 5).map((recipe) => (
                    <div key={recipe.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <UtensilsCrossed className="h-5 w-5" />
                      </div>
                      <div className="grid gap-1">
                        <p className="text-sm font-medium leading-none">{recipe.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {recipe.description || "No description"}
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
