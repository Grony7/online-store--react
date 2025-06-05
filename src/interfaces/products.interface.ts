export interface IProduct {
  id: number;
  title: string;
  price: number;
  on_sale?: boolean;
  sale_price?: number | null;
  discount_percent?: number;
  slug?: string;
  image?: string;
  images?: Array<{
    id?: number;
    url: string;
  }>;
  averageRating?: number | null;
  reviewCount?: number;
  inStock?: boolean;
  colorId?: number;
  variantColorIds?: number[];
  specifications?: {
    [key: string]: string | number;
  };
}

export interface IGetCatalogCategory {
  data: ICatalogCategory[]
}

export interface ICatalogCategory {
  id: number;
  slug: string;
  name: string;
  image?: {
    url: string;
    name: string;
  };
}
