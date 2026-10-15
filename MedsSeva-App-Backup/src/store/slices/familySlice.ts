import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';

export interface FamilyMember {
  id: string;
  name: string;
  relation: 'Wife' | 'Son' | 'Daughter' | 'Husband' | 'Father' | 'Mother' | 'Other';
  gender: 'male' | 'female' | 'other';
  age?: number;
}

interface FamilyState {
  members: FamilyMember[];
  loading: boolean;
  error: string | null;
}

const initialState: FamilyState = {
  members: [],
  loading: false,
  error: null
};

import { updateProfile } from './authSlice';

export const fetchFamilyMembers = createAsyncThunk(
  'family/fetchMembers',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await apiService.getMe();
      if (response.uhid) {
        dispatch(updateProfile({ uhid: response.uhid }));
      }
      return response.familyMembers || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch family members');
    }
  }
);

export const addFamilyMemberThunk = createAsyncThunk(
  'family/addMember',
  async (memberData: Omit<FamilyMember, 'id'>, { rejectWithValue }) => {
    try {
      const response = await apiService.addFamilyMember(memberData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to add family member');
    }
  }
);

export const removeFamilyMemberThunk = createAsyncThunk(
  'family/removeMember',
  async (id: string, { rejectWithValue }) => {
    try {
      await apiService.removeFamilyMember(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to remove family member');
    }
  }
);

const familySlice = createSlice({
  name: 'family',
  initialState,
  reducers: {
    resetFamily: () => initialState,
  },
  extraReducers: (builder) => {
    // Fetch members
    builder.addCase(fetchFamilyMembers.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchFamilyMembers.fulfilled, (state, action) => {
      state.loading = false;
      state.members = action.payload;
    });
    builder.addCase(fetchFamilyMembers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Add member
    builder.addCase(addFamilyMemberThunk.fulfilled, (state, action) => {
      state.members.push(action.payload);
    });

    // Remove member
    builder.addCase(removeFamilyMemberThunk.fulfilled, (state, action) => {
      state.members = state.members.filter(member => member.id !== action.payload);
    });
  }
});

export const { resetFamily } = familySlice.actions;
export default familySlice.reducer;
