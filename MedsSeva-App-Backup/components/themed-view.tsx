import React from 'react';
import { View, type ViewProps } from 'react-native';

export interface ThemedViewProps extends ViewProps {
  lightColor?: string;
  darkColor?: string;
  children?: React.ReactNode;
}

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = lightColor || '#FFFFFF';

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
