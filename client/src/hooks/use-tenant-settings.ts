import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/firebase";

const TENANTS_COL = "tenants";
const DEFAULT_TENANT_ID = "picania";

export type TenantSettings = {
  pricingPercentage: number;
};

function tenantDoc(tenantId: string = DEFAULT_TENANT_ID) {
  return doc(db, TENANTS_COL, tenantId);
}

export function useTenantSettings(tenantId: string = DEFAULT_TENANT_ID) {
  return useQuery({
    queryKey: ["tenant-settings", tenantId],
    queryFn: async (): Promise<TenantSettings> => {
      const snap = await getDoc(tenantDoc(tenantId));

      if (!snap.exists()) {
        return { pricingPercentage: 50 };
      }

      const data = snap.data();

      return {
        pricingPercentage: Number(data?.pricingPercentage ?? 50),
      };
    },
  });
}

export function useUpdateTenantSettings(tenantId: string = DEFAULT_TENANT_ID) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<TenantSettings>) => {
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