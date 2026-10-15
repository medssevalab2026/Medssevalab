import { CartItem } from '../store/slices/cartSlice';

/**
 * Maps the frontend Redux cart state to the backend Booking API payload structure.
 */
export const mapCartToBookingPayload = (cartItems: CartItem[], totalAmount: number, userId: string) => {
  const testIds: string[] = [];
  const packageIds: string[] = [];
  let requiresHomeCollection = false;

  cartItems.forEach(item => {
    if (item.itemType === 'test') {
      testIds.push(item.id);
    } else if (item.itemType === 'package') {
      packageIds.push(item.id);
    }
    
    // If any item requires/allows home collection, flag the booking for it
    if (item.homeCollection) {
      requiresHomeCollection = true;
    }
  });

  return {
    patientId: userId,
    tests: testIds,
    packages: packageIds,
    totalAmount: totalAmount,
    bookingType: requiresHomeCollection ? 'Home Collection' : 'Lab Visit',
    status: 'Pending',
    // Scheduled Date and Address will be added during the checkout flow
    scheduledDate: null, 
    addressId: null 
  };
};
