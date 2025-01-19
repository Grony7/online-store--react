import { InputHTMLAttributes, RefObject } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>{
  isValid?: boolean;
  ref?: RefObject<HTMLInputElement>;
}
