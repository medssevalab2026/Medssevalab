import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Dimensions, ActivityIndicator, DeviceEventEmitter, Keyboard } from 'react-native';
import { showError, showInfo } from '../store/toastStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import dayjs from 'dayjs';
import { useAppDispatch, useAppSelector } from '../store';
import { addToCart } from '../store/slices/cartSlice';
import { useRouter } from 'expo-router';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';

import { MaterialDatePickerModal } from './MaterialDatePickerModal';
import { MaterialTimeSlotModal } from './MaterialTimeSlotModal';
import { apiService } from '../services/api';
const { width, height } = Dimensions.get('window');

const CITIES = ['Delhi NCR', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad'];

const TIME_SLOTS = [
  '07:00 AM - 08:00 AM',
  '08:00 AM - 09:00 AM',
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 01:00 PM',
  '01:00 PM - 02:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM',
  '04:00 PM - 05:00 PM',
  '05:00 PM - 06:00 PM',
  '06:00 PM - 07:00 PM',
  '07:00 PM - 08:00 PM',
];


export function GlobalSchedulerOverlay() {
const [isOpen, setIsOpen] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const router = useRouter();
  // Active picker controller: 'city' | 'test' | 'date' | 'slot' | null
  const [activePicker, setActivePicker] = useState<'city' | 'test' | 'date' | 'slot' | null>(null);

  // Form Values
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<any | null>(null);
  const [showAddressPicker, setShowAddressPicker] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<'self' | string>('self');
  const [targetTest, setTargetTest] = useState('');
  const [prefDate, setPrefDate] = useState('');
  const [selectedDateObj, setSelectedDateObj] = useState<dayjs.Dayjs | null>(null);
  const [prefSlot, setPrefSlot] = useState('');
  const [pincode, setPincode] = useState('');
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [notes, setNotes] = useState('');

  // Mode states
const [collectionMode, setCollectionMode] = useState<'home' | 'lab'>('home');
  const [address, setAddress] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [allTests, setAllTests] = useState<any[]>([]);
  const [allPackages, setAllPackages] = useState<any[]>([]);
// Global Event Listener
useEffect(() => {
    const sub = DeviceEventEmitter.addListener('openGlobalScheduler', (payload?: { testName?: string }) => {
      if (payload?.testName) {
        setTargetTest(payload.testName);
        setTestSearchQuery('');
      }
      setIsOpen(true);
    });
    return () => sub.remove();
  }, []);

useEffect(() => {
    if (!isOpen) return;

    // Pre-fill user profile
    if (user) {
      setFullName(user.name || '');
      setPhone(user.mobile || '');
      setEmail(user.email || '');
    }

    if (!user?.mobile) return;

    setIsLoadingProfile(true);

    // Fetch addresses and family members in parallel
    Promise.all([
      apiService.getAddresses(user.mobile).catch(() => []),
      apiService.getMe().catch(() => null),
    ]).then(([addrRes, meRes]) => {
      // Handle addresses
      const addrs = Array.isArray(addrRes) ? addrRes : [];
      setSavedAddresses(addrs);
      const def = addrs.find((a: any) => a.isDefault) || addrs[0];
      if (def) {
        setSelectedAddress(def);
        const full = [def.line1, def.line2, def.landmark, def.city, def.state]
          .filter(Boolean).join(', ');
        setAddress(full);
        if (def.pincode) setPincode(def.pincode);
        if (def.city) setCity(def.city);
        if (def.state) setAddrState(def.state);
      }

      // Handle family members
      if (meRes?.family && Array.isArray(meRes.family)) {
        setFamilyMembers(meRes.family);
      }
    }).finally(() => {
      setIsLoadingProfile(false);
    });
  }, [isOpen]);

useEffect(() => {
    Promise.all([
      apiService.getAllTests().catch(() => []),
      apiService.getAllPackages().catch(() => []),
    ]).then(([tests, packages]) => {
      setAllTests(Array.isArray(tests) ? tests : []);
      setAllPackages(Array.isArray(packages) ? packages : []);
    });
  }, []);

  const resetForm = () => {
    setFullName(''); setPhone(''); setEmail(''); setCity(''); setAddrState('');
    setTargetTest(''); setPrefDate(''); setSelectedDateObj(null);
    setPrefSlot(''); setPincode(''); setAddress(''); setNotes('');
    setSelectedAddress(null); setSavedAddresses([]); setFamilyMembers([]);
    setSelectedPatient('self'); setCollectionMode('home');
  };

// Returns true if a slot's end time has already passed for a given date
  const isSlotExpired = (slot: string, date: dayjs.Dayjs): boolean => {
    const now = dayjs();
    const isToday = date.isSame(now, 'day');
    if (!isToday) return false;
    const endPart = slot.split(' - ')[1];
    const [time, meridiem] = endPart.split(' ');
    const [hourStr, minuteStr] = time.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (meridiem === 'PM' && hour !== 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;
    const slotEnd = now.hour(hour).minute(minute).second(0).millisecond(0);
    return slotEnd.isBefore(now) || slotEnd.isSame(now);
  };

const handleBook = () => {
    if (!targetTest) {
     showInfo('Please search and select a test or package to continue.');
      return;
    }

    dispatch(addToCart({
      id: targetTest,
      itemType: 'test',
      name: targetTest,
      price: 0,
      discountedPrice: 0,
      homeCollection: true,
      quantity: 1,
    }));

    resetForm();
    setIsOpen(false);
    router.push('/checkout/cart');
  };

  const handleUseLiveLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
      showInfo('Please enable location permission in settings to auto-fill address.');
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

  if (geocode && geocode.length > 0) {
        const addr = geocode[0];
        const fullAddr = [
          addr.name,
          addr.streetNumber ? `${addr.streetNumber} ${addr.street}` : addr.street,
          addr.district || addr.subregion,
          addr.city,
          addr.region,
          addr.postalCode
        ].filter(item => item && item !== 'Unnamed Road').join(', ');

        setAddress(fullAddr);
        if (addr.postalCode) setPincode(addr.postalCode);
        if (addr.city) setCity(addr.city);
        if (addr.region) setAddrState(addr.region);

        // Save live location as a backend address so addressId is real
        try {
          const saved = await apiService.addAddress({
            mobile: user?.mobile || '',
            type: 'Home',
            line1: [addr.name, addr.streetNumber ? `${addr.streetNumber} ${addr.street}` : addr.street]
              .filter(Boolean).join(', ') || fullAddr,
            line2: addr.district || addr.subregion || '',
            city: addr.city || addr.subregion || '',
            state: addr.region || '',
            pincode: addr.postalCode || '',
            isDefault: false,
          });
          setSelectedAddress(saved);
        } catch (e) {
          console.warn('Live location address save failed:', e);
        }
      }
    } catch (error) {
    showError('Unable to determine location accurately. Please type address manually.');
    } finally {
      setLocationLoading(false);
    }
  };

  // Render Custom Bottom Sheet Wrapper
  const renderDrawer = (title: string, contentKey: 'city' | 'test' | 'date' | 'slot', children: React.ReactNode) => {
    const isVisible = activePicker === contentKey;
    return (
      <Modal visible={isVisible} transparent animationType="slide" onRequestClose={() => setActivePicker(null)}>
        <TouchableOpacity style={styles.drawerBackdrop} activeOpacity={1} onPress={() => setActivePicker(null)}>
          <View style={styles.drawerSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>{title}</Text>
              <TouchableOpacity style={styles.drawerCloseBtn} onPress={() => setActivePicker(null)}>
                <MaterialCommunityIcons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.drawerScrollContainer}>
              {children}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };



const filteredPackages = testSearchQuery.trim() === '' ? [] : allPackages.filter(pkg =>
    pkg.name.toLowerCase().includes(testSearchQuery.toLowerCase()) ||
    (pkg.subtitle && pkg.subtitle.toLowerCase().includes(testSearchQuery.toLowerCase()))
  ).slice(0, 3);

  const filteredTests = testSearchQuery.trim() === '' ? [] : allTests.filter(t =>
    t.name.toLowerCase().includes(testSearchQuery.toLowerCase()) ||
    (t.category?.toLowerCase() || '').includes(testSearchQuery.toLowerCase())
  ).slice(0, 5);
  return (
    <>
      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={() => setIsOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollArea}>
              
              {/* Header */}
              <View style={styles.headerArea}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.headTitle}>Schedule Appointment</Text>
                  <Text style={styles.headSubtitle}>Fill details - we confirm within 30 minutes</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setIsOpen(false)}>
                  <MaterialCommunityIcons name="close" size={20} color="#475569" />
                </TouchableOpacity>
              </View>

              {/* Badges */}
              <View style={styles.badgesRow}>
                <View style={styles.badgeChip}>
                  <MaterialCommunityIcons name="shield-check" size={12} color="#047857" />
                  <Text style={styles.badgeLabel}>Secure</Text>
                </View>
                <View style={styles.badgeChip}>
                  <MaterialCommunityIcons name="certificate-outline" size={12} color="#047857" />
                  <Text style={styles.badgeLabel}>ISO Certified</Text>
                </View>
                <View style={styles.badgeChip}>
                  <MaterialCommunityIcons name="home-heart" size={12} color="#047857" />
                  <Text style={styles.badgeLabel}>Free Collection</Text>
                </View>
                <View style={styles.badgeChip}>
                  <MaterialCommunityIcons name="star" size={12} color="#047857" />
                  <Text style={styles.badgeLabel}>50K+ Patients</Text>
                </View>
              </View>

                         <View style={styles.divider} />

          {/* Patient Info Card */}
              {user ? (
                isLoadingProfile ? (
                  <View style={styles.skeletonCard}>
                    <View style={styles.skeletonLine} />
                    <View style={[styles.skeletonLine, { width: '60%', marginTop: 8 }]} />
                    <View style={[styles.skeletonLine, { width: '75%', marginTop: 8 }]} />
                  </View>
                ) : (
                  <>
                    <View style={styles.patientCard}>
                      <View style={styles.patientCardHeader}>
                        <Text style={styles.patientCardTitle}>Patient Details</Text>
                        <TouchableOpacity onPress={() => setIsOpen(false)}>
                          <Text style={styles.editLink}>Edit Profile</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.patientRow}>
                        <MaterialCommunityIcons name="account" size={14} color={COLORS.primary} />
                        <Text style={styles.patientText}>{user.name}</Text>
                      </View>
                      <View style={styles.patientRow}>
                        <MaterialCommunityIcons name="phone" size={14} color={COLORS.primary} />
                        <Text style={styles.patientText}>+91 {user.mobile}</Text>
                      </View>
                      {user.email ? (
                        <View style={styles.patientRow}>
                          <MaterialCommunityIcons name="email" size={14} color={COLORS.primary} />
                          <Text style={styles.patientText}>{user.email}</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Family Member Selector */}
                    {familyMembers.length > 0 && (
                      <View style={styles.formField}>
                        <Text style={styles.fieldLabel}>Select Patient</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
                          <TouchableOpacity
                            style={[styles.cityChip, selectedPatient === 'self' && styles.cityChipActive]}
                            onPress={() => setSelectedPatient('self')}
                          >
                            <Text style={[styles.cityChipLabel, selectedPatient === 'self' && styles.cityChipLabelActive]}>Myself</Text>
                          </TouchableOpacity>
                          {familyMembers.map((member: any) => (
                            <TouchableOpacity
                              key={member.id}
                              style={[styles.cityChip, selectedPatient === member.id && styles.cityChipActive]}
                              onPress={() => setSelectedPatient(member.id)}
                            >
                              <Text style={[styles.cityChipLabel, selectedPatient === member.id && styles.cityChipLabelActive]}>
                                {member.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </>
                )
              ) : (
                <>
                  <View style={styles.dualInputsRow}>
                    <View style={[styles.formField, { flex: 1.1, marginRight: 10 }]}>
                      <Text style={styles.fieldLabel}>Full Name <Text style={styles.red}>*</Text></Text>
                      <TextInput
                        style={styles.boxInput}
                        placeholder="Your full name"
                        placeholderTextColor="#94A3B8"
                        value={fullName}
                        onChangeText={setFullName}
                      />
                    </View>
                    <View style={[styles.formField, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>Phone <Text style={styles.red}>*</Text></Text>
                      <TextInput
                        style={styles.boxInput}
                        placeholder="+91 XXXXX XXXXX"
                        keyboardType="numeric"
                        placeholderTextColor="#94A3B8"
                        value={phone}
                        onChangeText={setPhone}
                      />
                    </View>
                  </View>
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Email <Text style={styles.grayText}>(for report delivery)</Text></Text>
                    <TextInput
                      style={styles.boxInput}
                      placeholder="your@email.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor="#94A3B8"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                </>
              )}
            
              {/* Test / Package typable input with inline suggestions */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Test / Package <Text style={styles.red}>*</Text></Text>
                <View style={styles.cityInputContainer}>
                  <MaterialCommunityIcons name="clipboard-text-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                  <TextInput 
                    style={styles.cityTextInput} 
                    placeholder="Search or type test/package (e.g. CBC, Lipid, Diabetes)" 
                    placeholderTextColor="#94A3B8"
                    value={targetTest}
                    onChangeText={(val) => {
                      setTargetTest(val);
                      setTestSearchQuery(val);
                    }}
                  />
                  {targetTest !== '' && (
                    <TouchableOpacity onPress={() => {
                      setTargetTest('');
                      setTestSearchQuery('');
                    }}>
                      <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Inline Suggestions dropdown list */}
                {(filteredPackages.length > 0 || filteredTests.length > 0) && (
                  <View style={styles.suggestionsContainer}>
                    {filteredPackages.map((pkg) => (
                      <TouchableOpacity 
                        key={pkg.id} 
                        style={styles.suggestionItem}
                        onPress={() => {
                          setTargetTest(pkg.name);
                          setTestSearchQuery(''); // hide suggestion list
                        }}
                      >
                        <MaterialCommunityIcons name="package-variant-closed" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.suggestionText}>{pkg.name}</Text>
                          <Text style={styles.suggestionSubtext}>{pkg.subtitle} · ₹{pkg.price}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}

                    {filteredTests.map((t) => (
                      <TouchableOpacity 
                        key={t.id} 
                        style={styles.suggestionItem}
                        onPress={() => {
                          setTargetTest(t.name);
                          setTestSearchQuery(''); // hide suggestion list
                        }}
                      >
                        <MaterialCommunityIcons name="test-tube" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.suggestionText}>{t.name}</Text>
                          <Text style={styles.suggestionSubtext}>₹{t.discountedPrice} · Report: {t.reportTime}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Visit Mode Selector */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Choose Booking Mode <Text style={styles.red}>*</Text></Text>
                <View style={styles.toggleGroup}>
                  <TouchableOpacity 
                    style={[styles.toggleOption, collectionMode === 'home' && styles.toggleOptionActive]}
                    onPress={() => setCollectionMode('home')}
                  >
                    <MaterialCommunityIcons 
                      name="home-outline" 
                      size={18} 
                      color={collectionMode === 'home' ? '#FFF' : '#64748B'} 
                    />
                    <Text style={[styles.toggleLabel, collectionMode === 'home' && styles.toggleLabelActive]}>Home Collection</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.toggleOption, collectionMode === 'lab' && styles.toggleOptionActive]}
                    onPress={() => setCollectionMode('lab')}
                  >
                    <MaterialCommunityIcons 
                      name="hospital-building" 
                      size={18} 
                      color={collectionMode === 'lab' ? '#FFF' : '#64748B'} 
                    />
                    <Text style={[styles.toggleLabel, collectionMode === 'lab' && styles.toggleLabelActive]}>Lab Visit</Text>
                  </TouchableOpacity>
                </View>
              </View>

           {/* Address block (shown only if Home) */}
              {collectionMode === 'home' && (
                <View style={styles.addressCard}>
                  <View style={styles.addressCardHeader}>
                    <Text style={styles.fieldLabel}>Collection Address <Text style={styles.red}>*</Text></Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {savedAddresses.length > 0 && (
                        <TouchableOpacity style={styles.gpsBtn} onPress={() => setShowAddressPicker(true)}>
                          <MaterialCommunityIcons name="map-marker-multiple" size={14} color={COLORS.primary} />
                          <Text style={styles.gpsBtnLabel}>Change</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={styles.gpsBtn} onPress={handleUseLiveLocation} disabled={locationLoading}>
                        {locationLoading ? (
                          <ActivityIndicator size="small" color={COLORS.primary} />
                        ) : (
                          <>
                            <MaterialCommunityIcons name="crosshairs-gps" size={14} color={COLORS.primary} />
                            <Text style={styles.gpsBtnLabel}>Live Location</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {isLoadingProfile ? (
                    <View style={[styles.skeletonLine, { height: 60, borderRadius: 10, marginTop: 4 }]} />
                  ) : selectedAddress ? (
                    <View style={styles.addressDisplayBox}>
                      {selectedAddress.label ? (
                        <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
                      ) : null}
                      <Text style={styles.addressFullText}>{address}</Text>
                      {pincode ? <Text style={styles.addressPinText}>Pincode: {pincode}</Text> : null}
                    </View>
                  ) : (
                    <TextInput
                      style={styles.areaInput}
                      multiline
                      numberOfLines={3}
                      placeholder="Enter full address (Flat/House No, Building, Street, Landmark)"
                      placeholderTextColor="#94A3B8"
                      value={address}
                      onChangeText={setAddress}
                    />
                  )}
                </View>
              )}
              {/* Date + Slot triggers */}
              <View style={styles.dualInputsRow}>
                <View style={[styles.formField, { flex: 1.1, marginRight: 10 }]}>
                  <Text style={styles.fieldLabel}>Preferred Date <Text style={styles.red}>*</Text></Text>
                  <TouchableOpacity style={styles.pickerTrigger} onPress={() => {
                    Keyboard.dismiss();
                    setActivePicker('date');
                  }}>
                    <Text style={prefDate ? styles.pickerTextActive : styles.pickerTextPlaceholder}>
                      {prefDate || 'Choose Date'}
                    </Text>
                    <MaterialCommunityIcons name="calendar" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
                <View style={[styles.formField, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Time Slot <Text style={styles.red}>*</Text></Text>
                  <TouchableOpacity style={styles.pickerTrigger} onPress={() => {
                    Keyboard.dismiss();
                    setActivePicker('slot');
                  }}>
                    <Text 
                      style={prefSlot ? styles.pickerTextActive : styles.pickerTextPlaceholder}
                      numberOfLines={1}
                    >
                      {prefSlot ? prefSlot.split(' ')[0] + ' ' + prefSlot.split(' ')[1] : 'Select Slot'}
                    </Text>
                    <MaterialCommunityIcons name="clock-outline" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>
{/* Optional Notes */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Additional Notes <Text style={styles.grayText}>(optional)</Text></Text>
                <TextInput
                  style={styles.boxInput}
                  placeholder="e.g. fasting sample, specific instructions..."
                  placeholderTextColor="#94A3B8"
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>
              {/* Action Button */}
           <TouchableOpacity 
                style={styles.submitAction} 
                activeOpacity={0.9}
                onPress={handleBook}
              >
                <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.submitGrad}>
                  <MaterialCommunityIcons name="cart-plus" size={18} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.submitText}>Add to Cart & Review Order</Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.smallDisclaimer}>
                No payment now · Pay after sample · Cancel anytime free
              </Text>

            </ScrollView>

            {/* Absolute Overlay Pickers rendered INSIDE the main Modal context */}
            <MaterialDatePickerModal
              visible={activePicker === 'date'}
              onClose={() => setActivePicker(null)}
              initialDate={selectedDateObj}
              onDateSelect={(date) => {
                setSelectedDateObj(date);
                setPrefDate(date.format('DD MMM YYYY'));
              }}
            />

      <MaterialTimeSlotModal
              visible={activePicker === 'slot'}
              onClose={() => setActivePicker(null)}
              slots={TIME_SLOTS}
              initialSlot={prefSlot}
              selectedDate={selectedDateObj}
              onSlotSelect={(slot) => {
                setPrefSlot(slot);
              }}
            />
          </View>
        </View>
      </Modal>

      {/* ----------------- CITY DRAWER ----------------- */}
      {renderDrawer('Select City', 'city', (
        <ScrollView style={styles.pickerList}>
          {CITIES.map((c) => (
            <TouchableOpacity 
              key={c} 
              style={[styles.pickerItem, city === c && styles.pickerItemActive]} 
              onPress={() => {
                setCity(c);
                setActivePicker(null);
              }}
            >
              <Text style={[styles.pickerItemLabel, city === c && styles.pickerItemLabelActive]}>{c}</Text>
              {city === c && <MaterialCommunityIcons name="check" size={18} color={COLORS.primary} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      ))}

    
      {renderDrawer('Select Test or Package', 'test', (() => {
const filteredPackages = allPackages.filter(pkg =>
          pkg.name.toLowerCase().includes(testSearchQuery.toLowerCase()) ||
          (pkg.subtitle && pkg.subtitle.toLowerCase().includes(testSearchQuery.toLowerCase()))
        );

        const filteredTests = allTests.filter(t =>
          t.name.toLowerCase().includes(testSearchQuery.toLowerCase()) ||
          (t.category?.toLowerCase() || '').includes(testSearchQuery.toLowerCase())
        );

        const uniqueCategories = Array.from(new Set(filteredTests.map(t => t.category)));

        return (
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            <View style={styles.searchBoxContainer}>
              <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchBarInput}
                placeholder="Search tests or health packages..."
                placeholderTextColor="#94A3B8"
                value={testSearchQuery}
                onChangeText={setTestSearchQuery}
                autoCapitalize="none"
              />
              {testSearchQuery !== '' && (
                <TouchableOpacity onPress={() => setTestSearchQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
              {/* Packages Section */}
              {filteredPackages.length > 0 && (
                <>
                  <View style={styles.catHeader}>
                    <Text style={styles.catHeaderText}>Health Packages</Text>
                  </View>
                  {filteredPackages.map((pkg) => (
                    <TouchableOpacity 
                      key={pkg.id} 
                      style={[styles.pickerItem, targetTest === pkg.name && styles.pickerItemActive]}
                      onPress={() => {
                        setTargetTest(pkg.name);
                        setActivePicker(null);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pickerItemLabel, targetTest === pkg.name && styles.pickerItemLabelActive]}>
                          {pkg.name}
                        </Text>
                        <Text style={styles.pickerSubLabel}>{pkg.subtitle} • ₹{pkg.price}</Text>
                      </View>
                      {targetTest === pkg.name && <MaterialCommunityIcons name="check" size={18} color={COLORS.primary} />}
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {/* Individual Tests Section */}
              {filteredTests.length > 0 && (
                <>
                  <View style={[styles.catHeader, { marginTop: 15 }]}>
                    <Text style={styles.catHeaderText}>Individual Tests</Text>
                  </View>
                  {uniqueCategories.map(category => {
                    const catTests = filteredTests.filter(t => t.category === category);
                    return (
                      <View key={category}>
                        <Text style={styles.subCatTitle}>{category}</Text>
                        {catTests.map((t) => (
                          <TouchableOpacity 
                            key={t.id} 
                            style={[styles.pickerItem, { paddingLeft: 24 }, targetTest === t.name && styles.pickerItemActive]}
                            onPress={() => {
                              setTargetTest(t.name);
                              setActivePicker(null);
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.pickerItemLabel, targetTest === t.name && styles.pickerItemLabelActive]}>
                                {t.name}
                              </Text>
                              <Text style={styles.pickerSubLabel}>₹{t.discountedPrice} • Report: {t.reportTime}</Text>
                            </View>
                            {targetTest === t.name && <MaterialCommunityIcons name="check" size={18} color={COLORS.primary} />}
                          </TouchableOpacity>
                        ))}
                      </View>
                    );
                  })}
                </>
              )}

              {filteredPackages.length === 0 && filteredTests.length === 0 && (
                <View style={styles.emptySearchContainer}>
                  <MaterialCommunityIcons name="clipboard-alert-outline" size={48} color="#94A3B8" style={{ marginBottom: 12 }} />
                  <Text style={styles.emptySearchText}>No matching tests or packages found.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        );
      })())}

 {/* Address Picker Modal */}
      <Modal visible={showAddressPicker} transparent animationType="slide" onRequestClose={() => setShowAddressPicker(false)}>
        <TouchableOpacity style={styles.drawerBackdrop} activeOpacity={1} onPress={() => setShowAddressPicker(false)}>
          <View style={styles.drawerSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Select Address</Text>
              <TouchableOpacity style={styles.drawerCloseBtn} onPress={() => setShowAddressPicker(false)}>
                <MaterialCommunityIcons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {savedAddresses.map((addr: any) => {
                const full = [addr.line1, addr.line2, addr.landmark, addr.city, addr.state].filter(Boolean).join(', ');
                return (
              <TouchableOpacity key={addr.id} style={styles.pickerItem} onPress={() => {
                    setSelectedAddress(addr);
                    setAddress(full);
                    if (addr.pincode) setPincode(addr.pincode);
                    if (addr.city) setCity(addr.city);
                    if (addr.state) setAddrState(addr.state);
                    setShowAddressPicker(false);
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickerItemLabel}>{addr.label || 'Address'}</Text>
                      <Text style={styles.pickerSubLabel}>{full}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(4, 47, 46, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: height * 0.9,
    ...SHADOWS.soft,
    elevation: 8,
  },
  scrollArea: {
    padding: 20,
    paddingBottom: 36,
  },
  headerArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  headTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  headSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  closeBtn: {
    backgroundColor: '#F1F5F9',
    padding: 6,
    borderRadius: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginBottom: 8,
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  badgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#047857',
    marginLeft: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  dualInputsRow: {
    flexDirection: 'row',
  },
  formField: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  red: {
    color: '#EF4444',
    fontWeight: 'bold',
  },
  grayText: {
    fontWeight: 'normal',
    color: '#94A3B8',
  },
  boxInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: COLORS.textDark,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  pickerTextPlaceholder: {
    fontSize: 13,
    color: '#94A3B8',
  },
  pickerTextActive: {
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 4,
    borderRadius: 12,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  toggleOptionActive: {
    backgroundColor: COLORS.primary,
  },
  toggleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 6,
  },
  toggleLabelActive: {
    color: '#FFF',
  },
  addressCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  addressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gpsBtnLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 4,
  },
  areaInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: COLORS.textDark,
    height: 70,
    textAlignVertical: 'top',
  },
  submitAction: {
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 12,
    ...SHADOWS.soft,
  },
  submitGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  submitText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  smallDisclaimer: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10,
  },

  // DRAWER SPECIFIC STYLES
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  drawerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: height * 0.4,
    maxHeight: height * 0.75,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  drawerCloseBtn: {
    backgroundColor: '#F1F5F9',
    padding: 5,
    borderRadius: 15,
  },
  drawerScrollContainer: {
    flex: 1,
  },
  pickerList: {
    padding: 12,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    borderRadius: 8,
  },
  pickerItemActive: {
    backgroundColor: '#E0F2F1',
  },
  pickerItemLabel: {
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  pickerItemLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  pickerSubLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  catHeader: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginVertical: 6,
  },
  catHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subCatTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },

  // CALENDAR SPECIFIC
  calNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calNavTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekHeaderCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: `${100 / 7}%`,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderRadius: 8,
  },
  cellToday: {
    backgroundColor: '#E0F2F1',
  },
  cellSelected: {
    backgroundColor: COLORS.primary,
  },
  cellText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  cellTextDisabled: {
    color: '#CBD5E1',
  },
  cellTextToday: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  cellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // TIME SLOTS
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  slotBtn: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  slotBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  slotBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  slotBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  
  // NEW STYLES
  cityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  cityTextInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  chipsScroll: {
    marginTop: 8,
  },
  chipsContent: {
    paddingRight: 10,
  },
  cityChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cityChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  cityChipLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  cityChipLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  searchBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginVertical: 12,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  emptySearchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptySearchText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
 patientCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  patientCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  patientCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editLink: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  patientText: {
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: '500',
    marginLeft: 8,
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginTop: 6,
    maxHeight: 200,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 99,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggestionText: {
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: '600',
  },
suggestionSubtext: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },

  // SKELETON LOADER
  skeletonCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    width: '90%',
  },

  // ADDRESS DISPLAY
  addressDisplayBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  addressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  addressFullText: {
    fontSize: 12,
    color: COLORS.textDark,
    fontWeight: '500',
    lineHeight: 18,
  },
  addressPinText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
});
// MedsSeva Scheduler Overlay Component

