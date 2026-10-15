import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { store } from '../store';
import { logout as authLogout, setLoggingOut } from '../store/slices/authSlice';
import { clearCart } from '../store/slices/cartSlice';
import { clearBookingFlow } from '../store/slices/bookingSlice';
import { resetFamily } from '../store/slices/familySlice';
import { showInfo } from '../store/toastStore';

let _queryClient: any = null;
let _router: any = null;

export const initLogout = (queryClient: any, router: any) => {
  _queryClient = queryClient;
  _router = router;
};

export const performLogout = async () => {
  store.dispatch(setLoggingOut(true));

  try {
    const { unregisterFcmToken } = await import('../services/notificationService');
    await unregisterFcmToken().catch(() => {});
  } catch {}

  try {
    await AsyncStorage.clear();
    await SecureStore.deleteItemAsync('token');
  } catch {}

  store.dispatch(authLogout());
  store.dispatch(clearCart());
  store.dispatch(clearBookingFlow());
  store.dispatch(resetFamily());

  if (_queryClient) {
    _queryClient.clear();
  }

  if (_router) {
    _router.replace('/(auth)/account-type');
  }
};

export const confirmAndLogout = () => {
  showInfo('Are you sure you want to log out?', {
    duration: 6000,
    action: {
      label: 'Log Out',
      onPress: performLogout,
    },
  });
};