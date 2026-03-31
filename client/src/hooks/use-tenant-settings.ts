import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/firebase";

const TENANTS_COL = "tenants";

export type TenantSettings = {
  pricingPercentage: number;
};

// Función auxiliar para obtener la referencia al documento del tenant específico
function tenantDoc(tenantId: string) {
  return doc(db, TENANTS_COL, tenantId);
}

// Hook para obtener la configuración
export function useTenantSettings(tenantId: string) {
  return useQuery({
    queryKey: ["tenant-settings", tenantId],
    queryFn: async (): Promise<TenantSettings> => {
      // Si no hay ID, no intentamos buscar nada
      if (!tenantId) throw new Error("Tenant ID es requerido");

      const snap = await getDoc(tenantDoc(tenantId));

      if (!snap.exists()) {
        // Valor por defecto si el documento aún no existe en Firestore
        return { pricingPercentage: 50 };
      }

      const data = snap.data();

      return {
        pricingPercentage: Number(data?.pricingPercentage ?? 50),
      };
    },
    enabled: !!tenantId, // Solo se ejecuta si tenantId tiene un valor
  });
}

// Hook para actualizar la configuración (Aquí es donde se genera el updatedAt "natural")
export function useUpdateTenantSettings(tenantId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<TenantSettings>) => {
      if (!tenantId) throw new Error("Tenant ID es requerido para actualizar");

      await setDoc(
        tenantDoc(tenantId),
        {
          ...data,
          updatedAt: serverTimestamp(), // Esto actualizará el campo en el documento padre
        },
        { merge: true }
      );
    },
    onSuccess: async () => {
      // Refresca los datos en la app para mostrar el cambio al instante
      await qc.invalidateQueries({ queryKey: ["tenant-settings", tenantId] });
    },
  });
}