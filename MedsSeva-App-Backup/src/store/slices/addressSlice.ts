import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';
import type { RootState } from '../index';

export interface Address {
  id: string;
  type: 'Home' | 'Work' | 'Other';
  name: string;
  phone: string;
  address: string;
  flatNo?: string;
  landmark?: string;
  area?: string;
  city?: string;
  pincode?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}

interface AddressState {
  addresses: Address[];
}

const initialState: AddressState = {
  addresses: [],
};

export const fetchAddressesThunk = createAsyncThunk(
  'address/fetchAddresses',
  async (mobile: string | undefined, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const user = state.auth.user;
      const userMobile = mobile || user?.mobile;
      
      if (!userMobile) {
        return [];
      }
      
      const response = await apiService.getAddresses(userMobile);
     return response.map((addr: any) => ({
        id: addr.id,
        type: addr.type,
        name: user?.name ?? '',
        phone: user?.mobile ? `+91 ${user.mobile}` : (mobile ?? ''),
        address: `${addr.line1}${addr.line2 ? `, ${addr.line2}` : ''}, ${addr.city}, ${addr.state} ${addr.pincode}`,
        flatNo: addr.line1?.split(',')[0] || '',
        landmark: addr.line2 || '',
        area: addr.line1?.split(',').slice(1).join(',').trim() || '',
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        latitude: addr.latitude || 0,
        longitude: addr.longitude || 0,
      }));
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch addresses');
    }
  }
);

export const removeAddressThunk = createAsyncThunk(
  'address/removeAddress',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      await apiService.removeAddress(id);
      dispatch(removeAddress(id));
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to remove address');
    }
  }
);


const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    addAddress: (state, action: PayloadAction<Address>) => {
      state.addresses.unshift(action.payload);
    },
    removeAddress: (state, action: PayloadAction<string>) => {
      state.addresses = state.addresses.filter(a => a.id !== action.payload);
    },
    updateAddress: (state, action: PayloadAction<Address>) => {
      const index = state.addresses.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.addresses[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchAddressesThunk.fulfilled, (state, action) => {
      state.addresses = action.payload;
    });
  }
});

export const { addAddress, removeAddress, updateAddress } = addressSlice.actions;
export default addressSlice.reducer;
