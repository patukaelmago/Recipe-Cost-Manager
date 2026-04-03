import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  ChefHat,
  LayoutDashboard,
  UtensilsCrossed,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getTenantConfig } from "@/config/tenantConfig";

export function Sidebar() {
  const [location] = useLocation();
  const [displayName, setDisplayName] = useState("Recipe Cost");

  const tenant = location.split("/")[1] || "default";

  useEffect(() => {
    let mounted = true;

    const loadTenantConfig = async () => {
      const config = await getTenantConfig(tenant);
      if (!mounted) return;
      setDisplayName(config.displayName || "Recipe Cost");
    };

    loadTenantConfig();

    return () => {
      mounted = false;
    };
  }, [tenant]);

  const navigation = [
    { name: "Dashboard", href: `/${tenant}/dashboard`, icon: LayoutDashboard },
    { name: "Ingredientes", href: `/${tenant}/ingredients`, icon: ChefHat },
    { name: "Recetas", href: `/${tenant}/recipes`, icon: UtensilsCrossed },
    { name: "Configuración", href: `/${tenant}/settings`, icon: Settings },
  ];

  return (
    <div className="flex h-full min-h-screen w-64 flex-col border-r bg-card/50 backdrop-blur-sm px-4 py-8">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <UtensilsCrossed className="h-6 w-6" />
        </div>

        <span className="min-w-0 truncate text-xl font-bold font-display tracking-tight text-foreground">
          {displayName}
        </span>
      </div>

      <nav className="flex-1 space-y-1">
        {navigation.map((item) => {
          const isActive =
            location === item.href ||
            (item.href !== `/${tenant}/dashboard` &&
              location.startsWith(item.href));

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
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="truncate">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t pt-4 pb-4 px-2">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {displayName} App by Patuka Technologies.
        </p>
      </div>
    </div>
  );
}