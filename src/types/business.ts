export interface BusinessSettings {
  name: string | null;
  phone: string | null;
  address: string | null;
  country: string | null;
  tax_rate: number | null;
  currency: string | null;
  logo_url: string | null;
  allow_price_override: boolean | null;
  settings: Record<string, unknown>;
}

export interface BusinessUpdate {
  name?: string;
  phone?: string;
  address?: string;
  country?: string;
  tax_rate?: number;
  currency?: string;
  logo_url?: string;
  allow_price_override?: boolean;
  settings?: Record<string, unknown>;
}
