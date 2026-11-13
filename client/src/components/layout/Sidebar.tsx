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
  const [displayName, setDisplayName] = useState<string | null>(null);

  const tenant = location.split("/")[1] || "default";

  useEffect(() => {
    let mounted = true;

    const loadTenantConfig = async () => {
      const config = await getTenantConfig(tenant);
      if (!mounted) return;
      setDisplayName(config?.displayName || null);
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
      <Link
        href="/"
        title="Ir al inicio de sesión"
        className="mb-8 flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-secondary/70"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <UtensilsCrossed className="h-6 w-6" />
        </div>

        <span className="min-w-0 truncate text-xl font-bold font-display tracking-tight text-foreground">
          {displayName ?? ""}
        </span>
      </Link>

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

      <footer className="border-t px-2 pt-4 pb-4 text-[11px] leading-relaxed tracking-wide text-muted-foreground">
        <div>
          <span className="whitespace-nowrap">&copy; {new Date().getFullYear()} Uskaer Technologies.</span>{" "}
          <span className="whitespace-nowrap">All rights reserved.</span>
        </div>
        <div>
          Designed &amp; developed by{" "}
          <a
            href="https://www.instagram.com/uskaeragenciadigital/"
            target="_blank"
            rel="noopener"
            aria-label="Uskaer on Instagram"
            className="inline-flex items-center gap-1 text-muted-foreground/80 no-underline transition-colors hover:text-primary"
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
            Uskaer
          </a>
        </div>
      </footer>
    </div>
  );
}