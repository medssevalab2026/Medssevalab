import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, 
  Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { COLORS, SHADOWS } from '../theme/theme';

interface MaterialTimeSlotModalProps {
  visible: boolean;
  onClose: () => void;
  onSlotSelect: (slot: string) => void;
  slots: string[];
  initialSlot?: string;
  selectedDate?: dayjs.Dayjs | null;
}
// Parses "07:00 AM - 08:00 AM" and returns the END time as a dayjs object for today
const parseSlotEndTime = (slot: string, referenceDate: dayjs.Dayjs): dayjs.Dayjs => {
  const endPart = slot.split(' - ')[1]; // "08:00 AM"
  const [time, meridiem] = endPart.split(' ');
  const [hourStr, minuteStr] = time.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  return referenceDate.hour(hour).minute(minute).second(0).millisecond(0);
};

const isSlotDisabled = (slot: string, selectedDate: dayjs.Dayjs | null | undefined): boolean => {
  if (!selectedDate) return false;
  const now = dayjs();
  const isToday = selectedDate.isSame(now, 'day');
  if (!isToday) return false;
  // Disable slot if its END time has already passed
  const slotEnd = parseSlotEndTime(slot, now);
  return slotEnd.isBefore(now) || slotEnd.isSame(now);
};

export const MaterialTimeSlotModal: React.FC<MaterialTimeSlotModalProps> = ({
  visible,
  onClose,
  onSlotSelect,
  slots,
  initialSlot,
  selectedDate,
}) => {
  const [tempSelectedSlot, setTempSelectedSlot] = useState<string>('');

  useEffect(() => {
    if (visible) {
      setTempSelectedSlot(initialSlot || '');
    }
  }, [visible, initialSlot]);

  const handleOk = () => {
    if (tempSelectedSlot) {
      onSlotSelect(tempSelectedSlot);
    }
    onClose();
  };

  const formatDisplayTime = (slot: string) => {
    if (!slot) return 'Select Time';
    // Shorten '08:00 AM - 09:00 AM' -> '08:00 AM' for the header display
    return slot.split(' - ')[0];
  };

return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerSub}>Select Arrival Slot</Text>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>
                {formatDisplayTime(tempSelectedSlot)}
              </Text>
              <MaterialCommunityIcons name="clock-outline" size={22} color={COLORS.textDark} />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Grid list of slots */}
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.slotsGrid}>
           {slots.map((slot, idx) => {
                const isSelected = tempSelectedSlot === slot;
                const disabled = isSlotDisabled(slot, selectedDate);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.slotChip,
                      isSelected && styles.chipSelected,
                      disabled && styles.chipDisabled,
                    ]}
                    activeOpacity={disabled ? 1 : 0.7}
                    disabled={disabled}
                    onPress={() => {
                      if (disabled) return;
                      setTempSelectedSlot(slot);
                      onSlotSelect(slot);
                      onClose();
                    }}
                  >
                    <Text style={[
                      styles.slotText,
                      isSelected && styles.textSelected,
                      disabled && styles.textDisabled,
                    ]}>
                      {slot.replace(':00', '')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.actionBtn} onPress={onClose}>
              <Text style={styles.actionBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, { marginLeft: 16 }, !tempSelectedSlot && { opacity: 0.5 }]} 
              onPress={handleOk}
              disabled={!tempSelectedSlot}
            >
              <Text style={[styles.actionBtnText, { fontWeight: 'bold' }]}>OK</Text>
            </TouchableOpacity>
          </View>

        </View>
</View>
    </Modal>
  );
};
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    width: '88%',
    maxWidth: 328,
    maxHeight: Dimensions.get('window').height * 0.75,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    overflow: 'hidden',
    ...SHADOWS.glow,
    elevation: 10,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
    fontWeight: '600',
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollContainer: {
    padding: 16,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  slotChip: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
slotText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  textSelected: {
    color: '#FFFFFF',
  },
  textDisabled: {
    color: '#CBD5E1',
  },
  chipDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },

});
