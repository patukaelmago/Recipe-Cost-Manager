import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Ingredients from "@/pages/Ingredients";
import Recipes from "@/pages/Recipes";
import RecipeDetail from "@/pages/RecipeDetail";

function Router() {
  return (
    <Switch>
      {/* OJO: si tu app está servida bajo /recipes (base), acá NO repetimos /recipes */}
      <Route path="/" component={Recipes} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/ingredients" component={Ingredients} />
      <Route path="/:id" component={RecipeDetail} />
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;