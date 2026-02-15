import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { ChefHat, LayoutDashboard, UtensilsCrossed } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Ingredients", href: "/ingredients", icon: ChefHat },
  { name: "Recipes", href: "/recipes", icon: UtensilsCrossed },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="flex h-full min-h-screen w-64 flex-col border-r bg-card/50 backdrop-blur-sm px-4 py-8">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <UtensilsCrossed className="h-6 w-6" />
        </div>
        <span className="text-xl font-bold font-display tracking-tight text-foreground">
          RecipeCost
        </span>
      </div>

      <nav className="flex-1 space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {item.name}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t pt-4 px-2">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} RecipeCost App
        </p>
      </div>
    </div>
  );
}
