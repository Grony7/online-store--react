import { ButtonHTMLAttributes, Ref } from 'react';

export interface FavoritesButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>
}
