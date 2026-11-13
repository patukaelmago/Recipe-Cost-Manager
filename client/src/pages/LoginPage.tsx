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
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { UtensilsCrossed, Chrome } from "lucide-react";

const USERNAME_DOMAIN = "recipe-cost-manager.app";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(DEMO_USER);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [loginError, setLoginError] = useState("");

  // Los usuarios con nombre (ej. "romina") son cuentas internas de Firebase con este dominio
  const toLoginEmail = (value: string) => {
    const v = value.trim().toLowerCase();
    return v.includes("@") ? v : `${v}@${USERNAME_DOMAIN}`;
  };

  const goToHome = async (user: import("firebase/auth").User) => {
    const target = homePath(await getAccess(user));
    if (target) {
      setLocation(target);
      return true;
    }
    await signOut(auth);
    return false;
  };

  const handleUserLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError("");
    if (username.trim().toLowerCase() === DEMO_USER && password === DEMO_PASSWORD) {
      enterDemo();
      return;
    }
    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithEmailAndPassword(auth, toLoginEmail(username), password);
      if (!(await goToHome(result.user))) setLoginError("Este usuario no tiene negocios asignados.");
    } catch (e: any) {
      console.error("LOGIN ERROR:", e);
      setLoginError("Usuario o contraseña incorrectos.");
    }
    setLoading(false);
  };

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

      if (!(await goToHome(result.user))) {
        alert(`No autorizado: ${result.user.email}`);
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

          <div className="my-5 flex items-center gap-3 text-xs text-white/40">
            <span className="h-px flex-1 bg-white/15" />o con tu usuario<span className="h-px flex-1 bg-white/15" />
          </div>

          <form className="space-y-3 text-white" onSubmit={handleUserLogin}>
            <div className="space-y-2">
              <Label htmlFor="login-user">Usuario</Label>
              <Input className="border-white/20 bg-white/10 text-white" id="login-user" autoComplete="username" autoCapitalize="none" value={username} onChange={e => setUsername(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Contraseña</Label>
              <Input className="border-white/20 bg-white/10 text-white" id="login-password" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {loginError && <p role="alert" className="text-sm text-red-400">{loginError}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</Button>
          </form>

          <div className="mt-5 rounded-lg bg-white/10 p-3 text-center text-sm text-white/80">
            Demo — usuario: <strong className="text-white">{DEMO_USER}</strong> · contraseña: <strong className="text-white">{DEMO_PASSWORD}</strong>
          </div>

          <p className="mt-5 text-center text-xs text-white/45">
            Acceso privado para cuentas autorizadas
          </p>
        </div>
      </div>
    </div>
  );
}
