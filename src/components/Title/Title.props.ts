import { HTMLAttributes, ReactNode } from 'react';

export interface TitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}
