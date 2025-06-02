import { DetailedHTMLProps, HTMLAttributes } from 'react';
import { ICartItem } from '../../interfaces/cart.interface';

export interface CartItemProps extends DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  item: ICartItem;
  onRemove: (id: number, colorId: number) => void;
  onIncrement: (id: number, colorId: number) => void;
  onDecrement: (id: number, colorId: number) => void;
  onToggleSelect: (id: number, colorId: number) => void;
} 