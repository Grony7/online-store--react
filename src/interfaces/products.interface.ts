export interface IProduct {
  id: number;
  listImages: string;
  name: string;
  colors: string[];
  characteristics: Record<string, string>;
  price: number;
  type: string;
  quantity: number;
  discount: string;
}

export interface ICatalogCategory {
  id: number;
  imageURL: string;
  url: string;
  name: string;
}
