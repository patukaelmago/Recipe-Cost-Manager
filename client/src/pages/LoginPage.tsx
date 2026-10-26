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
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
      <button onClick={handleGoogleLogin} disabled={loading}>
        {loading ? "Entrando..." : "Entrar con Google"}
      </button>
    </div>
  );
}