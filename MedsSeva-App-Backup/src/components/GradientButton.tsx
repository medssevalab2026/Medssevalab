import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';

interface GradientButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'glass'; // 'glass' is kept for backwards compatibility
}

export const GradientButton: React.FC<GradientButtonProps> = ({ 
  title, 
  loading = false, 
  variant = 'primary', 
  style, 
  ...props 
}) => {
  if (variant === 'outline') {
    return (
      <TouchableOpacity style={[styles.outlineButton, style]} {...props} disabled={loading || props.disabled}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <Text style={styles.outlineText}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  if (variant === 'glass') {
    return (
      <TouchableOpacity style={[styles.glassButton, style]} {...props} disabled={loading || props.disabled}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <Text style={styles.glassText}>{title}</Text>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.primaryButton, style]} {...props} disabled={loading || props.disabled}>
      {loading ? (
        <ActivityIndicator color={COLORS.textLight} />
      ) : (
        <Text style={styles.primaryText}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: COLORS.accent, // Primary Pink for CTA
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30, // Pill shape
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  primaryText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textLight,
    fontSize: 16,
  },
  outlineButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: COLORS.primary, // Navy outline
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary, // Navy text
    fontSize: 16,
  },
  glassButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  glassText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    fontSize: 16,
  }
});
