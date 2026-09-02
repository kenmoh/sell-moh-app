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
  createdAt?: Date;
  updatedAt?: Date;
}

export type ProductFilter = {
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  category?: string;
};


