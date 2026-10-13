export interface CartLineModifier {
  id: number;
  name: string;
  extra_price: number;
}

export interface CartLine {
  key: string;
  menu_item_id: number;
  name: string;

  price: number;
  quantity: number;
  modifiers: CartLineModifier[];
}
