import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { COLORS, SHADOWS } from '../theme/theme';

interface MaterialDatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onDateSelect: (date: dayjs.Dayjs) => void;
  initialDate?: dayjs.Dayjs | null;
}

export const MaterialDatePickerModal: React.FC<MaterialDatePickerModalProps> = ({
  visible,
  onClose,
  onDateSelect,
  initialDate
}) => {
  const today = dayjs();
  const [calendarMonth, setCalendarMonth] = useState(dayjs());
  const [tempSelectedDate, setTempSelectedDate] = useState<dayjs.Dayjs>(today);

  useEffect(() => {
    if (visible) {
      const initial = initialDate || today;
      setTempSelectedDate(initial);
      setCalendarMonth(initial.startOf('month'));
    }
  }, [visible, initialDate]);

  const handleMonthPrev = () => {
    // Block navigating before current month
    if (calendarMonth.isSame(today, 'month')) return;
    setCalendarMonth(curr => curr.subtract(1, 'month'));
  };

  const handleMonthNext = () => {
    setCalendarMonth(curr => curr.add(1, 'month'));
  };

  const getDaysGrid = () => {
    const start = calendarMonth.startOf('month');
    const startDayIdx = start.day();
    const daysCount = calendarMonth.daysInMonth();
    const grid = [];
    
    // Padding for weekday offsets
    for (let i = 0; i < startDayIdx; i++) {
      grid.push(null);
    }
    // Month Days
    for (let d = 1; d <= daysCount; d++) {
      grid.push(calendarMonth.date(d));
    }
    return grid;
  };

  const handleOk = () => {
    onDateSelect(tempSelectedDate);
    onClose();
  };

return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          
          {/* Material Header Section */}
          <View style={styles.header}>
            <Text style={styles.headerSub}>Select Date</Text>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>
                {tempSelectedDate.format('MMM D, YYYY')}
              </Text>
              <TouchableOpacity activeOpacity={0.6}>
                <MaterialCommunityIcons name="pencil-outline" size={22} color={COLORS.textDark} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Month Switcher Row */}
          <View style={styles.monthSwitcher}>
            <TouchableOpacity style={styles.monthDropdownBtn} activeOpacity={0.7}>
              <Text style={styles.monthLabel}>{calendarMonth.format('MMMM YYYY')}</Text>
              <MaterialCommunityIcons name="menu-down" size={22} color={COLORS.textDark} style={{ marginLeft: 2 }} />
            </TouchableOpacity>

            <View style={styles.navGroup}>
              <TouchableOpacity 
                onPress={handleMonthPrev} 
                style={styles.navBtn}
                disabled={calendarMonth.isSame(today, 'month')}
              >
                <MaterialCommunityIcons 
                  name="chevron-left" 
                  size={26} 
                  color={calendarMonth.isSame(today, 'month') ? '#CBD5E1' : '#475569'} 
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleMonthNext} style={[styles.navBtn, { marginLeft: 12 }]}>
                <MaterialCommunityIcons name="chevron-right" size={26} color="#475569" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Weekday Headers Grid */}
          <View style={styles.weekdaysRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <Text key={i} style={styles.weekdayLabel}>{day}</Text>
            ))}
          </View>

          {/* Calendar Day Grid */}
          <View style={styles.daysGrid}>
            {getDaysGrid().map((date, idx) => {
              if (!date) {
                return <View key={`empty-${idx}`} style={styles.dayCell} />;
              }

              const isPast = date.isBefore(today, 'day');
              const isSelected = tempSelectedDate.isSame(date, 'day');
              const isToday = today.isSame(date, 'day');

              return (
                <TouchableOpacity
                  key={date.toString()}
                  style={[styles.dayCell]}
                  disabled={isPast}
                  onPress={() => {
                    setTempSelectedDate(date);
                    onDateSelect(date);
                    onClose();
                  }}
                  activeOpacity={0.6}
                >
                  <View style={[
                    styles.dayCircle,
                    isSelected && styles.circleSelected,
                    isToday && !isSelected && styles.circleToday
                  ]}>
                    <Text style={[
                      styles.dayText,
                      isPast && styles.textPast,
                      isSelected && styles.textSelected,
                      isToday && !isSelected && styles.textToday
                    ]}>
                      {date.date()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Action Buttons Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.actionBtn} onPress={onClose}>
              <Text style={styles.actionBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { marginLeft: 16 }]} onPress={handleOk}>
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
  monthSwitcher: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  monthDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navBtn: {
    padding: 4,
  },
  weekdaysRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleSelected: {
    backgroundColor: COLORS.primary, // MedsSeva Deep Teal
  },
  circleToday: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textDark,
  },
  textPast: {
    color: '#CBD5E1',
  },
  textSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  textToday: {
    color: COLORS.primary,
    fontWeight: 'bold',
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
    color: COLORS.primary, // Teal
  },

});
