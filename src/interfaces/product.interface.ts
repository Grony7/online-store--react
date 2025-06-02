export interface IProduct {
    id: number;
    title: string;
    slug: string;
    price: number;
    sale_price: number;
    discount_percent: number;
    image: string;
    inStock: boolean;
    specifications?: {
        [key: string]: string | number;
    };
} 