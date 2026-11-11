"use client";

import { isDemo } from "@/lib/demo";
import { useEffect, useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { auth, db } from "@/lib/firebase";

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
        const email = user.email?.toLowerCase().trim() || "";
        const currentTenant = location.split("/")[1] || "";

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data() as any;

          if (userData?.role === "superadmin") {
            setAccess({
              loading: false,
              user,
              isSuperAdmin: true,
              tenantId: null,
            });
            return;
          }

          if (userData?.tenantId === currentTenant) {
            setAccess({ loading: false, user, isSuperAdmin: false, tenantId: currentTenant });
            return;
          }

          if (Array.isArray(userData?.tenants)) {
            if (userData.tenants.length > 1 && !currentTenant) {
              setLocation("/select-tenant");
              return;
            }

            if (currentTenant && userData.tenants.includes(currentTenant)) {
              setAccess({
                loading: false,
                user,
                isSuperAdmin: false,
                tenantId: currentTenant,
              });
              return;
            }

            if (userData.tenants.length === 1) {
              setLocation(`/${userData.tenants[0]}`);
              return;
            }
          }
        }

        if (email && currentTenant) {
          const tenantRef = doc(db, "tenants", currentTenant);
          const tenantSnap = await getDoc(tenantRef);

          if (
            tenantSnap.exists() &&
            Array.isArray(tenantSnap.data().allowedEmails) &&
            tenantSnap.data().allowedEmails.includes(email)
          ) {
            setAccess({
              loading: false,
              user,
              isSuperAdmin: false,
              tenantId: currentTenant,
            });
            return;
          }
        }

        setLocation("/");
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
