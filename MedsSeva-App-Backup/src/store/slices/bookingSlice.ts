import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PatientDetails {
  name: string;
  age: string;
  gender: string;
  mobile: string;
  symptoms: string;
}

interface BookingState {
  selectedAddress: string | null;
  selectedAddressId: string | null;
  selectedBranchId: string | null;
  selectedBranchName: string | null;
  selectedDate: string | null;
  selectedTimeSlot: string | null;
  patientDetails: PatientDetails | null;
  paymentMethod: string | null;
  collectionMode: 'home' | 'lab';
  appliedCouponCode: string | null;
  bookings: any[];
  pastBookings: any[];
  bookingsLastFetched: number | null;
}

const initialState: BookingState = {
  selectedAddress: null,
  selectedAddressId: null,
  selectedBranchId: null,
  selectedBranchName: null,
  selectedDate: null,
  selectedTimeSlot: null,
  patientDetails: null,
  paymentMethod: null,
  collectionMode: 'home',
  appliedCouponCode: null,
  bookings: [],
  pastBookings: [],
  bookingsLastFetched: null,
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setAddress: (state, action: PayloadAction<string>) => {
      state.selectedAddress = action.payload;
    },
 setAddressId: (state, action: PayloadAction<string | null>) => {
      state.selectedAddressId = action.payload;
    },
    setBranch: (state, action: PayloadAction<{ id: string; name: string } | null>) => {
      state.selectedBranchId = action.payload?.id || null;
      state.selectedBranchName = action.payload?.name || null;
    },
    setSlot: (state, action: PayloadAction<{ date: string; time: string }>) => {
      state.selectedDate = action.payload.date;
      state.selectedTimeSlot = action.payload.time;
    },
    setPatientDetails: (state, action: PayloadAction<PatientDetails>) => {
      state.patientDetails = action.payload;
    },
   setPaymentMethod: (state, action: PayloadAction<string>) => {
      state.paymentMethod = action.payload;
    },
    setAppliedCouponCode: (state, action: PayloadAction<string | null>) => {
      state.appliedCouponCode = action.payload;
    },
finalizeBooking: (state, action: PayloadAction<any>) => {
      state.pastBookings.unshift(action.payload);
      state.bookings.unshift(action.payload);
      state.bookingsLastFetched = Date.now();
      state.selectedAddress = null;
      state.selectedAddressId = null;
      state.selectedDate = null;
      state.selectedTimeSlot = null;
      state.patientDetails = null;
      state.paymentMethod = null;
      state.appliedCouponCode = null;
      state.selectedBranchId = null;
      state.selectedBranchName = null;
    },
    setBookings:(state, action: PayloadAction<any[]>) => {
      state.bookings = action.payload;
      state.bookingsLastFetched = Date.now();
    },
setCollectionMode: (state, action: PayloadAction<'home' | 'lab'>) => {
      state.collectionMode = action.payload;
    },
clearBookingFlow: (state) => {
      state.selectedAddress = null;
      state.selectedAddressId = null;
      state.selectedDate = null;
      state.selectedTimeSlot = null;
      state.patientDetails = null;
      state.paymentMethod = null;
     state.collectionMode = 'home';
      state.appliedCouponCode = null;
      state.selectedBranchId = null;
      state.selectedBranchName = null;
      state.bookings = [];
      state.pastBookings = [];
      state.bookingsLastFetched = null;
    }
  },
});

export const { 
  setAddress,   
  setAddressId,
  setBranch,
  setSlot, 
  setPatientDetails, 
  setPaymentMethod,
  setAppliedCouponCode,
  setCollectionMode,
  finalizeBooking,
  setBookings,
  clearBookingFlow 
} = bookingSlice.actions;

export default bookingSlice.reducer;
