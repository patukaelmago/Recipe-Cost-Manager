import { DEMO_USER, DEMO_PASSWORD, resetDemo } from "@/lib/demo";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { getAccess, homePath } from "@/lib/access";
import { useLocation } from "wouter";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { UtensilsCrossed, Chrome } from "lucide-react";

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
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, provider);

      if (!result.user.email) {
        alert("No se pudo obtener el email");
        await signOut(auth);
        setLoading(false);
        return;
      }

      const target = homePath(await getAccess(result.user));

      if (target) {
        setLocation(target);
      } else {
        alert(`No autorizado: ${result.user.email}`);
        await signOut(auth);
      }

      setLoading(false);
    } catch (e: any) {
      console.error("LOGIN ERROR:", e);
      alert(e.message || "Error en login");
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b0f14] px-6 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.20),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(255,255,255,0.06),_transparent_30%)]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <UtensilsCrossed className="h-8 w-8" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white">
              Recipe Cost Manager
            </h1>

            <p className="mt-3 text-sm leading-6 text-white/70">
              Iniciá sesión para administrar costos, recetas e ingredientes de tu negocio.
            </p>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3.5 font-medium text-slate-900 transition-all duration-200 hover:scale-[1.01] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Chrome className="h-5 w-5" />
            {loading ? "Entrando..." : "Entrar con Google"}
          </button>

        <section className="mt-6 border-t border-white/15 pt-6 text-white" aria-labelledby="demo-title">
          <h2 id="demo-title" className="text-lg font-semibold">Probá la demo</h2>
          <p className="mt-2 text-sm text-white/60">Incluye 12 ingredientes y 3 recetas. Podés crear, editar y calcular costos. Cada nuevo ingreso comienza con los ejemplos originales.</p>
          <div className="my-4 rounded-lg bg-white/10 p-3 text-sm">
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
              <Input className="border-white/20 bg-white/10 text-white" id="demo-user" autoComplete="username" value={demoUser} onChange={e => setDemoUser(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-password">Contraseña de demo</Label>
              <Input className="border-white/20 bg-white/10 text-white" id="demo-password" type="password" autoComplete="current-password" value={demoPassword} onChange={e => setDemoPassword(e.target.value)} required />
            </div>
            {demoError && <p role="alert" className="text-sm text-destructive">{demoError}</p>}
            <Button type="submit" className="w-full">Entrar a la demo</Button>
          </form>
          <p className="mt-4 text-xs text-white/60">Los datos de prueba y los cambios son propios de esta sesión. Precios ilustrativos.</p>
        </section>

          <p className="mt-5 text-center text-xs text-white/45">
            Acceso privado para cuentas autorizadas
          </p>
        </div>
      </div>
    </div>
  );
}
