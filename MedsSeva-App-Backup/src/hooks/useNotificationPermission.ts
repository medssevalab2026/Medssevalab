import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { registerFcmToken, setupTokenRefreshListener } from '../services/notificationService';

const NOTIF_ASKED_KEY = 'notif_permission_asked';

export const useNotificationPermission = () => {
  useEffect(() => {
    let tokenRefreshUnsubscribe: (() => void) | null = null;

    const requestIfNeeded = async () => {
      try {
        const { status: currentStatus } = await Notifications.getPermissionsAsync();

        if (currentStatus === 'granted') {
          await registerFcmToken();
          tokenRefreshUnsubscribe = setupTokenRefreshListener();
          return;
        }

        if (currentStatus === 'denied') {
          return;
        }

        const alreadyAsked = await AsyncStorage.getItem(NOTIF_ASKED_KEY);
        if (alreadyAsked === 'true') {
          return;
        }

        await AsyncStorage.setItem(NOTIF_ASKED_KEY, 'true');
        await registerFcmToken();

        const { status: afterRequest } = await Notifications.getPermissionsAsync();
        if (afterRequest === 'granted') {
          tokenRefreshUnsubscribe = setupTokenRefreshListener();
        }
      } catch (e) {
        console.warn('Notification permission flow failed', e);
      }
    };

    const timer = setTimeout(requestIfNeeded, 1500);

    return () => {
      clearTimeout(timer);
      if (tokenRefreshUnsubscribe) tokenRefreshUnsubscribe();
    };
  }, []);
};