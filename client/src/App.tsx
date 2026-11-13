"use client";

import { isDemo } from "@/lib/demo";
import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { onAuthStateChanged, User } from "firebase/auth";
import { getAccess, canEnter, homePath } from "@/lib/access";

import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { auth } from "@/lib/firebase";

import LoginPage from "@/pages/LoginPage";
import SelectTenantPage from "./pages/select-tenant";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Ingredients from "@/pages/Ingredients";
import Recipes from "@/pages/Recipes";
import RecipeDetail from "@/pages/RecipeDetail";
import TenantSettings from "@/pages/TenantSettings";
import { InstallApp } from "@/components/InstallApp";

type AccessState = {
  loading: boolean;
  user: User | null;
  isSuperAdmin: boolean;
  tenantId: string | null;
};

function TenantGuard({ component: Component }: { component: React.ComponentType<any> }) {
  const [location] = useLocation();
  const tenant = location.split("/")[1] || "";
  if (isDemo(tenant)) return <Component />;
  return <AuthenticatedTenantGuard component={Component} />;
}

function AuthenticatedTenantGuard({
  component: Component,
}: {
  component: React.ComponentType<any>;
}) {
  const [location, setLocation] = useLocation();

  const [access, setAccess] = useState<AccessState>({
    loading: true,
    user: null,
    isSuperAdmin: false,
    tenantId: null,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAccess({
          loading: false,
          user: null,
          isSuperAdmin: false,
          tenantId: null,
        });
        setLocation("/");
        return;
      }

      try {
        const currentTenant = location.split("/")[1] || "";
        const result = await getAccess(user);

        if (canEnter(result, currentTenant)) {
          setAccess({
            loading: false,
            user,
            isSuperAdmin: result.isSuperAdmin,
            tenantId: currentTenant,
          });
          return;
        }

        // No puede entrar a este negocio: lo mando a los suyos (o al login)
        setLocation(homePath(result) ?? "/");
      } catch (error) {
        console.error("GUARD ERROR:", error);
        setLocation("/");
      }
    });

    return () => unsub();
  }, [location, setLocation]);

  if (access.loading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Entrando...
      </div>
    );
  }

  if (!access.user) return null;

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/select-tenant" component={SelectTenantPage} />

      <Route path="/:tenant">
        {() => <TenantGuard component={Dashboard} />}
      </Route>

      <Route path="/:tenant/dashboard">
        {() => <TenantGuard component={Dashboard} />}
      </Route>

      <Route path="/:tenant/ingredients">
        {() => <TenantGuard component={Ingredients} />}
      </Route>

      <Route path="/:tenant/recipes">
        {() => <TenantGuard component={Recipes} />}
      </Route>

      <Route path="/:tenant/recipes/:id">
        {() => <TenantGuard component={RecipeDetail} />}
      </Route>

      <Route path="/:tenant/settings">
        {() => <TenantGuard component={TenantSettings} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <InstallApp />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
