export interface IFilters {
    priceRange: IPriceRange;
    specifications: ISpecification[];
}

export interface IPriceRange {
    min: number;
    max: number;
}

export interface ISpecification {
    id: number;
    name: string;
    slug: string;
    fieldType: 'string' | 'number';
    options: null;
    values: Array<string | number>;
}

export interface IActiveFilters {
    priceRange: {
        min: number;
        max: number;
    };
    specifications: {
        [key: string]: Array<string | number>;
    };
} 