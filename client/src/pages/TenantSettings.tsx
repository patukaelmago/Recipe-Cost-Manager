import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { getTenantConfig, setTenantConfig } from "@/config/tenantConfig";
import { Shell } from "@/components/layout/Shell";
import { auth } from "@/lib/firebase";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";

export default function TenantSettings() {
  const [location] = useLocation();
  const tenant = location.split("/")[1] || "default";

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const user = auth.currentUser;
  const usesPassword = !!user?.providerData.some((p) => p.providerId === "password");

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    if (newPassword.length < 6) {
      setPasswordMessage("La contraseña nueva tiene que tener al menos 6 caracteres.");
      return;
    }
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
      await updatePassword(user, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setPasswordMessage("Contraseña actualizada.");
    } catch (err: any) {
      setPasswordMessage(
        err?.code === "auth/invalid-credential" || err?.code === "auth/wrong-password"
          ? "La contraseña actual no es correcta."
          : err?.message || "No se pudo cambiar la contraseña."
      );
    }
  };

  useEffect(() => {
    const load = async () => {
      const config = await getTenantConfig(tenant);
      setName(config?.displayName || "");
      setLoading(false);
    };

    load();
  }, [tenant]);

  if (loading) return null; // 🔥 CLAVE: evita el flash

  return (
    <Shell>
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await setTenantConfig(tenant, { displayName: name.trim() });
            window.location.reload();
          }}
          className="w-full max-w-md rounded-2xl border bg-card shadow-sm"
        >
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

            <Button type="submit" className="w-full h-11">
              Guardar
            </Button>
          </div>
        </form>

        {usesPassword && (
          <form onSubmit={changePassword} className="w-full max-w-md rounded-2xl border bg-card shadow-sm">
            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-bold font-display">Cambiar contraseña</h2>
            </div>
            <div className="space-y-5 px-6 py-6">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="current-password">Contraseña actual</label>
                <Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="h-11" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="new-password">Contraseña nueva</label>
                <Input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="h-11" />
              </div>
              {passwordMessage && <p role="status" className="text-sm text-muted-foreground">{passwordMessage}</p>}
              <Button type="submit" className="w-full h-11">Cambiar contraseña</Button>
            </div>
          </form>
        )}
      </div>
    </Shell>
  );
}