import { HTMLAttributes } from 'react';

export interface NavigationProps extends HTMLAttributes<HTMLDivElement> {
  device?: 'desktop' | 'mobile'
}


