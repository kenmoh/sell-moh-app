export interface BusinessSettings {
  name: string | null;
  phone: string | null;
  address: string | null;
  tax_rate: number | null;
  currency: string | null;
  logo_url: string | null;
  settings: Record<string, unknown>;
}

export interface BusinessUpdate {
  name?: string;
  phone?: string;
  address?: string;
  tax_rate?: number;
  currency?: string;
  logo_url?: string;
  settings?: Record<string, unknown>;
}
