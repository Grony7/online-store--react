import { HTMLAttributes, Dispatch, SetStateAction } from 'react';

export interface FilterPanelProps extends HTMLAttributes<HTMLDivElement> {
        categorySlug?: string;
        onApply: (selected: Record<string, string[] | number[]>) => void;
        onVisibilityChange?: Dispatch<SetStateAction<boolean>>;
        initialFilters?: Record<string, string[] | number[]>;
}
