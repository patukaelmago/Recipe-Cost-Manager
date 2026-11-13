"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { getAccess } from "@/lib/access";
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
        const access = await getAccess(user);

        if (access.tenants.length === 0) {
          alert(`No autorizado: ${user.email}`);
          setLocation("/");
          return;
        }

        if (!access.isSuperAdmin && access.tenants.length === 1) {
          setLocation(`/${access.tenants[0]}/dashboard`);
          return;
        }

        const list = await Promise.all(
          access.tenants.map(async (tenantId) => {
            try {
              const tenantSnap = await getDoc(doc(db, "tenants", tenantId));
              return {
                id: tenantId,
                name: (tenantSnap.exists() && tenantSnap.data().displayName) || tenantId,
              };
            } catch {
              return { id: tenantId, name: tenantId };
            }
          })
        );

        list.sort((a, b) => a.name.localeCompare(b.name));
        setTenants(list);
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
            onClick={() => setLocation(`/${t.id}/dashboard`)}
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