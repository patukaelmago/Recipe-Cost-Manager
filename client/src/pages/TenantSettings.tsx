import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getTenantConfig, setTenantConfig } from "@/config/tenantConfig";
import { Shell } from "@/components/layout/Shell";

export default function TenantSettings() {
  const [location] = useLocation();
  const tenant = location.split("/")[1] || "default";

  const [name, setName] = useState("");

  useEffect(() => {
    const load = async () => {
      const config = await getTenantConfig(tenant);
      setName(config?.displayName || "");
    };
  
    load();
  }, [tenant]);

  const handleSave = () => {
    setTenantConfig(tenant, { displayName: name.trim() });
    window.location.reload();
  };

  return (
    <Shell>
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border bg-card shadow-sm">
          <div className="border-b px-6 py-4">
            <h1 className="text-xl font-bold font-display">Configuración</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Cambiá el nombre que se muestra en la app.
            </p>
          </div>

          <div className="space-y-5 px-6 py-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre del negocio</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Picaña"
                className="h-11"
              />
            </div>

            <Button onClick={handleSave} className="w-full h-11">
              Guardar
            </Button>
          </div>
        </div>
      </div>
    </Shell>
  );
}