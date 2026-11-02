"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useLocation } from "wouter";
import { onAuthStateChanged } from "firebase/auth";

export default function SelectTenantPage() {
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      // 🔥 IMPORTANTE: esperar resolución inicial
      if (user === undefined) return;

      if (!user) {
        setLocation("/");
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          alert("Usuario no configurado");
          return;
        }

        const userData = userSnap.data() as any;

        // 🔥 SUPERADMIN
        if (userData.role === "superadmin") {
          const snap = await getDocs(collection(db, "tenants"));

          const list = snap.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().displayName || doc.id,
          }));

          setTenants(list);
          setLoading(false);
          return;
        }

        // 🔥 CLIENTE
        if (Array.isArray(userData.tenants)) {
          const list = await Promise.all(
            userData.tenants.map(async (tenantId: string) => {
              const tenantRef = doc(db, "tenants", tenantId);
              const tenantSnap = await getDoc(tenantRef);

              return {
                id: tenantId,
                name:
                  tenantSnap.exists()
                    ? tenantSnap.data().displayName || tenantId
                    : tenantId,
              };
            })
          );

          setTenants(list);
          setLoading(false);
          return;
        }

        alert("Usuario mal configurado");
        setLoading(false);
      } catch (e) {
        console.error(e);
        alert("Error cargando tenants");
        setLoading(false);
      }
    });

    return () => unsub();
  }, [setLocation]);

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111",
          color: "white",
        }}
      >
        Cargando...
      </div>
    );
  }

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