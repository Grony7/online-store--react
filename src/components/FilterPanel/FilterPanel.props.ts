import { HTMLAttributes, Dispatch, SetStateAction } from 'react';

export interface FilterPanelProps extends HTMLAttributes<HTMLDivElement> {
        categorySlug?: string;
        onApply: (selected: Record<string, string[] | number[]>) => void;
        onVisibilityChange?: Dispatch<SetStateAction<boolean>>;
        initialFilters?: Record<string, string[] | number[]>;
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
    // backend может отдавать либо options, либо values
    options: string[] | null;
    values:   string[];
  }
  
  export interface IFilters {
    priceRange: PriceRange;
    specifications: Spec[];
  }
