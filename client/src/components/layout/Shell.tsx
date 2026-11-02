import { isDemo, resetDemo } from "@/lib/demo";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./Sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Menu, UtensilsCrossed } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { getTenantConfig } from "@/config/tenantConfig";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const [displayName, setDisplayName] = useState<string | null>(null);

  if (location.startsWith("/select-tenant")) {
    return <>{children}</>;
  }

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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center border-b p-4 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="rounded-md p-2 hover:bg-secondary">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>

            <SheetContent side="left" className="p-0 border-r w-64">
              <Sidebar />
            </SheetContent>
          </Sheet>

          <Link href={`/${tenant}/dashboard`}>
            <div className="ml-4 flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-secondary/70">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <UtensilsCrossed className="h-5 w-5" />
              </div>

              <span className="max-w-[180px] truncate text-lg font-bold font-display">
                {displayName ?? ""}
              </span>
            </div>
          </Link>
        </div>

        {isDemo(tenant) && (
          <div className="flex flex-wrap items-center gap-3 border-b bg-primary/5 px-4 py-3 text-sm">
            <p className="flex-1 min-w-[180px]"><strong>Modo demo.</strong> Probá libremente. Cada nuevo ingreso recupera los ejemplos originales.</p>
            <Button variant="outline" size="sm" onClick={() => {
              resetDemo();
              queryClient.removeQueries({ predicate: query => query.queryKey[1] === "demo" });
              window.location.assign("/demo/dashboard");
            }}>Reiniciar demo</Button>
            <Button variant="ghost" size="sm" onClick={() => window.location.assign("/")}>Salir</Button>
          </div>
        )}
        {/* Main Content */}
        <ScrollArea className="flex-1">
          <main className="container mx-auto max-w-7xl p-6 lg:p-8">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          </main>
        </ScrollArea>
      </div>
    </div>
  );
}