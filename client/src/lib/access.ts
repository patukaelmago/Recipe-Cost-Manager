import type { User } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type Access = {
  isSuperAdmin: boolean;
  /** Negocios a los que puede entrar (para el superadmin: todos). */
  tenants: string[];
};

async function readUserProfile(user: User, email: string): Promise<any | null> {
  // 1) Documento con el UID como ID (forma vieja)
  try {
    const byUid = await getDoc(doc(db, "users", user.uid));
    if (byUid.exists()) return byUid.data();
  } catch (e) {
    console.warn("users/{uid} no accesible", e);
  }

  // 2) Documento con el email como ID (forma nueva: se puede dar de alta antes del primer login)
  if (email) {
    try {
      const byEmail = await getDoc(doc(db, "users", email));
      if (byEmail.exists()) return byEmail.data();
    } catch (e) {
      console.warn("users/{email} no accesible", e);
    }
  }

  return null;
}

export async function getAccess(user: User): Promise<Access> {
  const email = user.email?.toLowerCase().trim() || "";
  const profile = await readUserProfile(user, email);

  if (profile?.role === "superadmin") {
    const snap = await getDocs(collection(db, "tenants"));
    return { isSuperAdmin: true, tenants: snap.docs.map((d) => d.id) };
  }

  const tenants = new Set<string>();
  if (typeof profile?.tenantId === "string" && profile.tenantId) tenants.add(profile.tenantId);
  if (Array.isArray(profile?.tenants)) {
    for (const t of profile.tenants) if (typeof t === "string" && t) tenants.add(t);
  }

  // Compatibilidad: negocios que tienen el email en allowedEmails
  if (email) {
    try {
      const q = query(collection(db, "tenants"), where("allowedEmails", "array-contains", email));
      const snap = await getDocs(q);
      snap.docs.forEach((d) => tenants.add(d.id));
    } catch (e) {
      console.warn("Consulta allowedEmails falló", e);
    }
  }

  return { isSuperAdmin: false, tenants: Array.from(tenants) };
}

export function canEnter(access: Access, tenantId: string) {
  return access.isSuperAdmin || access.tenants.includes(tenantId);
}

/** A dónde mandar al usuario después de entrar. null = no autorizado. */
export function homePath(access: Access): string | null {
  if (access.isSuperAdmin || access.tenants.length > 1) return "/select-tenant";
  if (access.tenants.length === 1) return `/${access.tenants[0]}/dashboard`;
  return null;
}
