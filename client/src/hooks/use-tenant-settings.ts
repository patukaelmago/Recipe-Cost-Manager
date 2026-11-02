import { isDemo, demoSettings, updateDemoSettings } from "@/lib/demo";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/firebase";

const TENANTS_COL = "tenants";

export type TenantSettings = {
  pricingPercentage: number;
  displayName: string;
};

function tenantDoc(tenantId: string) {
  return doc(db, TENANTS_COL, tenantId);
}

export function useTenantSettings(tenantId: string) {
  return useQuery({
    queryKey: ["tenant-settings", tenantId],
    queryFn: async (): Promise<TenantSettings> => {
      if (!tenantId) throw new Error("Tenant ID es requerido");

      if (isDemo(tenantId)) return demoSettings();
      const snap = await getDoc(tenantDoc(tenantId));

      if (!snap.exists()) {
        return {
          pricingPercentage: 50,
          displayName: "",
        };
      }

      const data = snap.data();

      return {
        pricingPercentage: Number(data?.pricingPercentage ?? 50),
        displayName: String(data?.displayName ?? ""),
      };
    },
    enabled: !!tenantId,
  });
}

export function useUpdateTenantSettings(tenantId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<TenantSettings>) => {
      if (!tenantId) throw new Error("Tenant ID es requerido para actualizar");

      if (isDemo(tenantId)) { updateDemoSettings(data); return; }
      await setDoc(
        tenantDoc(tenantId),
        {
          ...data,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tenant-settings", tenantId] });
    },
  });
}