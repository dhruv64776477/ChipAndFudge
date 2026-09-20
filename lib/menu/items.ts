/**
 * The Chip & Fudge — Menu Items
 * Single source of truth for all menu items and pricing.
 * originalPrice is the display/cancelled price (optional).
 * sellingPrice is always used for calculations.
 */

export interface MenuItem {
  name: string;
  sellingPrice: number;
  originalPrice?: number; // display-only cancelled price
}

export const MENU_ITEMS: MenuItem[] = [
  {
    name: 'Chocolate Fudge Bowl',
    originalPrice: 129,
    sellingPrice: 99,
  },
  {
    name: 'BYOB – Loaded Chips',
    originalPrice: 99,
    sellingPrice: 69,
  },
  {
    name: 'Fusion Jhal Muri',
    originalPrice: 49,
    sellingPrice: 39,
  },
  {
    name: 'Combo',
    sellingPrice: 169,
  },
];

/** Lookup map: item name → MenuItem */
export const MENU_MAP: Map<string, MenuItem> = new Map(
  MENU_ITEMS.map((item) => [item.name, item])
);

/** Valid menu item names for validation */
export const VALID_MENU_NAMES: string[] = MENU_ITEMS.map((item) => item.name);
