import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getTenantConfig, setTenantConfig } from "@/config/tenantConfig";

export default function TenantSettings() {
  const [location] = useLocation();
  const tenant = location.split("/")[1] || "default";

  const [name, setName] = useState("");

  useEffect(() => {
    const config = getTenantConfig(tenant);
    setName(config.displayName || "");
  }, [tenant]);

  const handleSave = () => {
    setTenantConfig(tenant, { displayName: name });
    window.location.reload();
  };

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-bold">Configuración</h1>

      <div className="space-y-2">
        <label className="text-sm font-medium">Nombre del negocio</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Picaña"
        />
      </div>

      <Button onClick={handleSave} className="w-full h-11">
        Guardar
      </Button>
    </div>
  );
}