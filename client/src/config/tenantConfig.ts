import { isDemo, demoSettings, updateDemoSettings } from "@/lib/demo";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type TenantConfig = {
  displayName?: string;
};

export async function getTenantConfig(tenant: string): Promise<TenantConfig> {
  if (isDemo(tenant)) return demoSettings();
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
  if (isDemo(tenant)) { updateDemoSettings(config); return; }
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