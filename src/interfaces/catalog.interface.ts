export interface ICatalogCategory {
  id: number;
  slug: string;
  name: string;
  image?: {
    url: string;
    name: string;
  };
}
