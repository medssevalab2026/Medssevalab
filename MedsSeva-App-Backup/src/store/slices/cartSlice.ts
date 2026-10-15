import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  id: string;
  itemType: 'test' | 'package';
  name: string;
  price: number;
  discountedPrice: number;
  homeCollection: boolean;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existing = state.items.find(
        i => i.id === action.payload.id && i.itemType === action.payload.itemType
      );
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push(action.payload);
      }
    },
    removeFromCart: (state, action: PayloadAction<{ id: string; itemType: 'test' | 'package' }>) => {
      state.items = state.items.filter(
        i => !(i.id === action.payload.id && i.itemType === action.payload.itemType)
      );
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; itemType: 'test' | 'package'; quantity: number }>) => {
      const item = state.items.find(
        i => i.id === action.payload.id && i.itemType === action.payload.itemType
      );
      if (item && action.payload.quantity > 0) {
        item.quantity = action.payload.quantity;
      } else if (item && action.payload.quantity === 0) {
        state.items = state.items.filter(
          i => !(i.id === action.payload.id && i.itemType === action.payload.itemType)
        );
      }
    },
    clearCart: (state) => {
      state.items = [];
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;