import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { toastStore } from '../store/toastStore';

const CONFIG = {
  success: { icon: 'check-circle' as const, color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.35)' },
  error: { icon: 'alert-circle' as const, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.35)' },
  info: { icon: 'information' as const, color: '#006D6F', bg: 'rgba(0, 109, 111, 0.12)', border: 'rgba(0, 109, 111, 0.35)' },
};

export function ToastHost() {
  const [toast, setToast] = useState(toastStore.getState());
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsub = toastStore.subscribe(setToast);
    return () => { unsub(); };
  }, []);

  useEffect(() => {
    if (!toast.visible) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 9, tension: 80 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    timerRef.current = setTimeout(() => dismiss(), toast.duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.toastId, toast.visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 100, duration: 180, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => toastStore.hideToast());
  };

  if (!toast.visible) return null;

  const { icon: iconName, color, bg, border } = CONFIG[toast.type];

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: insets.bottom + 16, opacity, transform: [{ translateY }] }]}
    >
      <View style={[styles.toast, { backgroundColor: '#FFFFFF', borderColor: border }]}>
        <View style={[styles.iconWrap, { backgroundColor: bg }]}>
          <MaterialCommunityIcons name={iconName} size={18} color={color} />
        </View>
        <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
        {toast.action ? (
          <Pressable onPress={() => { toast.action!.onPress(); dismiss(); }} hitSlop={8}>
            <Text style={[styles.actionLabel, { color }]}>{toast.action.label}</Text>
          </Pressable>
        ) : (
          <Pressable onPress={dismiss} hitSlop={8}>
            <MaterialCommunityIcons name="close" size={18} color="#9CA3AF" />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 20,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    flex: 1,
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '600',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});