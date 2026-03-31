export type TenantConfig = {
    displayName?: string;
  };
  
  const STORAGE_KEY = "tenant_config";
  
  export function getTenantConfig(tenant: string): TenantConfig {
    if (typeof window === "undefined") return {};
  
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const all = JSON.parse(raw);
      return all[tenant] || {};
    } catch {
      return {};
    }
  }
  
  export function setTenantConfig(tenant: string, config: TenantConfig) {
    if (typeof window === "undefined") return;
  
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const all = raw ? JSON.parse(raw) : {};
  
      all[tenant] = {
        ...all[tenant],
        ...config,
      };
  
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {}
  }