import { InputHTMLAttributes, ReactNode } from 'react';

export interface TitleProps extends InputHTMLAttributes<HTMLHeadingElement>{
  children: ReactNode;
}

