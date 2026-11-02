import { DEMO_USER, DEMO_PASSWORD, resetDemo } from "@/lib/demo";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useLocation } from "wouter";
import {
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [demoUser, setDemoUser] = useState("");
  const [demoPassword, setDemoPassword] = useState("");
  const [demoError, setDemoError] = useState("");

  const enterDemo = () => {
    resetDemo();
    queryClient.removeQueries({ predicate: query => query.queryKey[1] === "demo" });
    setLocation("/demo/dashboard");
  };

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const email = result.user.email?.toLowerCase().trim();

      if (!email) {
        alert("No se pudo obtener el email");
        setLoading(false);
        return;
      }

      // Firestore permite leer el perfil propio por UID, no listar usuarios.
      const snap = await getDoc(doc(db, "users", result.user.uid));

      if (!snap.exists()) {
        alert("No autorizado");
        setLoading(false);
        return;
      }

      const user = snap.data();

      if (user.role === "superadmin") {
        setLocation("/select-tenant");
        setLoading(false);
        return;
      }

      if (!user.tenantId) {
        alert("Usuario sin tenant asignado");
        setLoading(false);
        return;
      }

      // 🔥 FIX ACÁ
      setLocation(`/${user.tenantId}`);
      setLoading(false);

    } catch (e: any) {
      console.error("LOGIN ERROR:", e);
      alert(e.message || "Error en login");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <main className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold font-display">Recipe Cost Manager</h1>
        <p className="mt-2 text-sm text-muted-foreground">Gestioná ingredientes, recetas y costos de tu cocina.</p>
        <Button className="mt-6 w-full" onClick={handleGoogleLogin} disabled={loading}>
          {loading ? "Entrando..." : "Entrar con Google"}
        </Button>
        <section className="mt-6 border-t pt-6" aria-labelledby="demo-title">
          <h2 id="demo-title" className="text-lg font-semibold">Probá la demo</h2>
          <p className="mt-2 text-sm text-muted-foreground">Incluye 12 ingredientes y 3 recetas. Podés crear, editar y calcular costos. Cada nuevo ingreso comienza con los ejemplos originales.</p>
          <div className="my-4 rounded-lg bg-secondary p-3 text-sm">
            <p>Usuario: <strong>{DEMO_USER}</strong></p>
            <p>Contraseña: <strong>{DEMO_PASSWORD}</strong></p>
          </div>
          <form className="space-y-4" onSubmit={event => {
            event.preventDefault();
            if (demoUser.trim().toLowerCase() !== DEMO_USER || demoPassword !== DEMO_PASSWORD) {
              setDemoError("Usá el usuario y la contraseña de prueba que aparecen arriba.");
              return;
            }
            enterDemo();
          }}>
            <div className="space-y-2">
              <Label htmlFor="demo-user">Usuario de demo</Label>
              <Input id="demo-user" autoComplete="username" value={demoUser} onChange={e => setDemoUser(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-password">Contraseña de demo</Label>
              <Input id="demo-password" type="password" autoComplete="current-password" value={demoPassword} onChange={e => setDemoPassword(e.target.value)} required />
            </div>
            {demoError && <p role="alert" className="text-sm text-destructive">{demoError}</p>}
            <Button type="submit" variant="outline" className="w-full">Entrar a la demo</Button>
          </form>
          <p className="mt-4 text-xs text-muted-foreground">Los datos de prueba y los cambios son propios de esta sesión. Precios ilustrativos.</p>
        </section>
      </main>
    </div>
  );
}
