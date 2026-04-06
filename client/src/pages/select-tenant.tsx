import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useLocation } from "wouter";
import { onAuthStateChanged } from "firebase/auth";

export default function SelectTenantPage() {
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLocation("/");
        return;
      }

      try {
        const snap = await getDocs(collection(db, "tenants"));

        const list = snap.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().displayName || doc.id,
        }));

        setTenants(list);
      } catch (e) {
        console.error(e);
        alert("Error cargando tenants");
      }
    });

    return () => unsub();
  }, [setLocation]);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        alignItems: "center",
        justifyContent: "center",
        background: "#111",
      }}
    >
      <div
        style={{
          background: "#1a1a1a",
          padding: 30,
          borderRadius: 12,
          minWidth: 300,
          display: "flex",
          flexDirection: "column",
          gap: 15,
        }}
      >
        <h2 style={{ color: "white", textAlign: "center" }}>
          Elegir negocio
        </h2>

        {tenants.map((t) => (
          <button
            key={t.id}
            onClick={() => setLocation(`/${t.id}`)}
            style={{
              padding: 12,
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              background: "#333",
              color: "white",
              fontSize: 16,
            }}
          >
            {t.name}
          </button>
        ))}
      </div>
    </div>
  );
}