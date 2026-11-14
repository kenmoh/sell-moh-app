import type { TaxEntry } from "./product";

interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category?: Category;
  in_stock: number;
  reorder_point?: number;
  tax_id?: string;
  tax_rate?: number;
  /** Best-before date (YYYY-MM-DD), null when the product never expires. */
  expiry_date?: string | null;
  /** When true the POS refuses this product after its expiry day. */
  block_sale_after_expiry?: boolean;
  /** What this product is taxed by, resolved by the server. */
  taxes?: TaxEntry[];
  /** When true, selling_price includes tax; tax is deducted at sale time. */
  auto_calc_tax?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ProductFilter = {
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  category?: string;
};


