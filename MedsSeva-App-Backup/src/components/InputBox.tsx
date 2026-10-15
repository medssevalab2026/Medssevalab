import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Control, Controller } from 'react-hook-form';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../theme/theme';

interface InputBoxProps extends TextInputProps {
  name: string;
  control: Control<any>;
  label: string;
  icon?: string;
  rules?: object;
  secureTextEntry?: boolean;
}

export const InputBox = ({ name, control, label, icon, rules, secureTextEntry, ...props }: InputBoxProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(!secureTextEntry);

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={styles.container}>
          <Text style={styles.label}>{label}</Text>
          <View style={[styles.inputContainer, error && styles.inputError]}>
            {icon && (
              <MaterialCommunityIcons name={icon as any} size={20} color={COLORS.textSecondary} style={styles.icon} />
            )}
            <TextInput
              style={styles.input}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              secureTextEntry={!isPasswordVisible}
              placeholderTextColor="#94A3B8"
              {...props}
            />
            {secureTextEntry && (
              <MaterialCommunityIcons
                name={isPasswordVisible ? 'eye-off' : 'eye'}
                size={20}
                color={COLORS.textSecondary}
                style={styles.eyeIcon}
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              />
            )}
          </View>
          {error && <Text style={styles.errorText}>{error.message}</Text>}
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textDark,
    marginBottom: 6,
    fontWeight: '600',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9', // Slate 100
    borderWidth: 1,
    borderColor: '#E2E8F0', // Slate 200
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
  },
  inputError: {
    borderColor: COLORS.danger,
    backgroundColor: '#FEF2F2', // Red 50
  },
  icon: {
    marginRight: 10,
  },
  eyeIcon: {
    padding: 4,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.textDark,
    height: '100%',
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    marginTop: 4,
    marginLeft: 4,
  },
});
