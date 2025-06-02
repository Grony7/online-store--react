export interface IProduct {
  id: number
  title: string
  slug: string
  price?: number
  inStock?: boolean
  sale_price: number,
  discount_percent: number,  
  image?: string
  variantColorIds?: number[]
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
