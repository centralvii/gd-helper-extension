import {
  Landmark, Castle, Palette, Trees, UtensilsCrossed, ShoppingBag, Moon, Mountain, Ticket,
  type LucideIcon,
} from 'lucide-react';
import type { PlaceCategory } from '../data/types';

export const CATEGORIES: { id: PlaceCategory; label: string; icon: LucideIcon }[] = [
  { id: 'sight', label: 'Достопримечательности', icon: Landmark },
  { id: 'palace', label: 'Дворцы и храмы', icon: Castle },
  { id: 'museum', label: 'Музеи', icon: Palette },
  { id: 'nature', label: 'Природа', icon: Trees },
  { id: 'food', label: 'Еда и рынки', icon: UtensilsCrossed },
  { id: 'shopping', label: 'Шопинг', icon: ShoppingBag },
  { id: 'nightlife', label: 'Ночная жизнь', icon: Moon },
  { id: 'viewpoint', label: 'Смотровые', icon: Mountain },
  { id: 'activity', label: 'Развлечения', icon: Ticket },
];

export function categoryMeta(id: PlaceCategory | undefined) {
  return CATEGORIES.find((c) => c.id === id);
}
