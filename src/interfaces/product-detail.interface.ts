export interface IProductDetail {
  id: number
  title: string
  slug: string
  description: DescriptionItem[]
  images: ProductImage[]
  videos: ProductVideo[]
  variantColors: VariantColor[]
  specifications: Specification[]
  reviewCount: number
  averageRating: number | null
}

export interface ProductImage {
  id?: number;
  url: string;
}

export interface ProductVideo {
  id?: number;
  url: string;
  thumbnail?: string;
}

export interface VariantColor {
  id: number;
  color: {
    id: number;
    name: string;
    hex: string;
  };
  image: ProductImage | null;
  images: ProductImage[];
  videos: ProductVideo[];
  price: number;
  sale_price: number | null;
  on_sale: boolean;
  stock: number;
}

export interface Specification {
  id: number;
  name: string;
  slug: string;
  fieldType: string;
  value: string | number;
}

export interface DescriptionItem {
  type: string;
  children: DescriptionChild[];
}

export interface DescriptionChild {
  text: string;
  type: string;
}

export interface IProductDetailResponse {
  data: IProductDetail;
} 