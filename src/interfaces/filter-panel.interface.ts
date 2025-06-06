export interface IGetFilters {
  filters: IFilters;
  category: Category;
}

export interface IFilters {
  priceRange: PriceRange;
  specifications: Spec[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}


interface PriceRange {
  min: number;
  max: number;
}

interface Spec {
  id: number;
  name: string;
  slug: string;
  fieldType: 'string' | 'number' | 'boolean';
  options: string[] | null;
  values: string[];
}
