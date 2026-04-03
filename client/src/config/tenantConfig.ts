import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type TenantConfig = {
  displayName?: string;
};

export async function getTenantConfig(tenant: string): Promise<TenantConfig> {
  try {
    const ref = doc(db, "tenants", tenant);
    const snap = await getDoc(ref);

    if (!snap.exists()) return {};

    return snap.data() as TenantConfig;
  } catch {
    return {};
  }
}

export async function setTenantConfig(
  tenant: string,
  config: TenantConfig
) {
  try {
    const ref = doc(db, "tenants", tenant);

    await setDoc(
      ref,
      {
        ...config,
      },
      { merge: true }
    );
  } catch {}
}