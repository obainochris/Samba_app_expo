import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProvider, useBookings } from '@/context/BookingContext';
import { calculateTravelFee, distanceInKm, formatNaira, getEtaMinutes, parseNaira } from '@/utils/house-call';
import { ServiceMode } from '@/data/providers';

const dates = ['Today', 'Sat, 5 Oct', 'Sun, 6 Oct', 'Mon, 7 Oct'];
const times = ['10:00 AM', '12:30 PM', '3:00 PM', '5:30 PM'];

type LocationStatus = 'idle' | 'requesting' | 'validated' | 'out-of-range' | 'denied' | 'error';

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const provider = getProvider(id ?? '');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addBooking } = useBookings();
  const [mode, setMode] = useState<ServiceMode>('home');
  const [selectedService, setSelectedService] = useState(0);
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedTime, setSelectedTime] = useState(times[0]);
  const [addressLabel, setAddressLabel] = useState('');
  const [gateInstructions, setGateInstructions] = useState('');
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');

  const travelFee = useMemo(
    () => distanceKm === null || !provider ? 0 : calculateTravelFee(distanceKm, provider.baseTravelFee, provider.travelFeePerKm),
    [distanceKm, provider],
  );

  if (!provider) {
    return <View className="flex-1 items-center justify-center bg-paper"><Text className="text-ink">Provider not found</Text></View>;
  }

  const service = provider.services[selectedService];
  const servicePrice = parseNaira(service.price);
  const totalPrice = mode === 'home' ? servicePrice + travelFee : servicePrice;
  const locationReady = locationStatus === 'validated' && distanceKm !== null && distanceKm <= provider.serviceRadiusKm;

  const validateLocation = async () => {
    setLocationStatus('requesting');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationStatus('denied');
        return;
      }
      const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const nextDistance = distanceInKm(
        current.coords.latitude,
        current.coords.longitude,
        provider.latitude,
        provider.longitude,
      );
      setDistanceKm(nextDistance);
      setLocationStatus(nextDistance <= provider.serviceRadiusKm ? 'validated' : 'out-of-range');
    } catch {
      setLocationStatus('error');
    }
  };

  const book = async () => {
    if (mode === 'home') {
      if (!locationReady) {
        Alert.alert('Validate your address first', `This house call is available within ${provider.serviceRadiusKm} km of ${provider.location}.`);
        return;
      }
      if (!addressLabel.trim()) {
        Alert.alert('Add a service address', 'Tell the provider where to meet you at home or at the office.');
        return;
      }
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const bookingId = await addBooking({
      providerId: provider.id,
      providerName: provider.name,
      serviceName: service.name,
      date: selectedDate,
      time: selectedTime,
      mode,
      price: formatNaira(totalPrice),
      servicePrice: service.price,
      location: provider.location,
      ...(mode === 'home' ? {
        clientAddress: addressLabel.trim(),
        gateInstructions: gateInstructions.trim(),
        distanceKm: distanceKm ?? undefined,
        travelFee,
        etaMinutes: getEtaMinutes(distanceKm ?? 0),
        trackingStatus: 'confirmed' as const,
      } : {}),
    });
    Alert.alert(
      mode === 'home' ? 'House call confirmed' : 'Booking confirmed',
      mode === 'home'
        ? `${service.name} is booked at ${addressLabel.trim()}. Track your provider from Bookings.`
        : `Your ${service.name} appointment with ${provider.firstName} is saved.`,
      [{ text: mode === 'home' ? 'Track house call' : 'View bookings', onPress: () => router.replace(mode === 'home' ? `/house-call/${bookingId}` : '/bookings') }],
    );
  };

  return (
    <View className="flex-1 bg-paper">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 38 }}>
        <View className="relative">
          <Image source={provider.image} style={{ width: '100%', height: 330 }} resizeMode="cover" />
          <View className="absolute left-5 flex-row" style={{ top: insets.top + 12 }}>
            <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white/90 active:opacity-70">
              <Feather name="arrow-left" size={19} color="#27221F" />
            </Pressable>
          </View>
          <Pressable className="absolute right-5 h-10 w-10 items-center justify-center rounded-full bg-white/90 active:opacity-70" style={{ top: insets.top + 12 }}>
            <Feather name="heart" size={18} color="#27221F" />
          </Pressable>
        </View>
        <View className="-mt-7 rounded-t-[30px] bg-paper px-5 pt-6">
          <View className="flex-row items-start">
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-[27px] font-bold tracking-[-0.7px] text-ink">{provider.name}</Text>
                <Ionicons name="checkmark-circle" size={19} color="#D86D55" style={{ marginLeft: 7 }} />
              </View>
              <Text className="mt-1 text-[14px] text-smoke">{provider.specialty}</Text>
            </View>
            <View className="items-end">
              <View className="flex-row items-center"><Ionicons name="star" size={14} color="#BC8A4A" /><Text className="ml-1 text-[14px] font-bold text-ink">{provider.rating}</Text></View>
              <Text className="mt-1 text-[11px] text-smoke">{provider.reviews} reviews</Text>
            </View>
          </View>
          <View className="mt-5 flex-row items-center">
            <View className="flex-row items-center rounded-full bg-white px-3 py-2"><Feather name="map-pin" size={13} color="#D86D55" /><Text className="ml-1.5 text-[12px] font-semibold text-ink">{provider.location}</Text></View>
            <Text className="ml-2 text-[12px] text-smoke">{provider.distance}</Text>
          </View>
          <Text className="mt-6 text-[14px] leading-6 text-smoke">{provider.bio}</Text>
          <Pressable onPress={() => router.push({ pathname: '/messages/[providerId]', params: { providerId: provider.id } })} className="mt-5 flex-row items-center justify-center rounded-full border border-banner bg-white py-3.5 active:opacity-75">
            <Feather name="message-circle" size={16} color="#2D6CDF" /><Text className="ml-2 text-[13px] font-bold text-banner">Message {provider.firstName}</Text>
          </Pressable>

          <Text className="mt-7 text-[19px] font-bold text-ink">Choose a service</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingTop: 14 }}>
            {provider.services.map((item, index) => (
              <Pressable key={item.name} onPress={() => setSelectedService(index)} className={'mr-3 w-[156px] rounded-[19px] border p-4 ' + (selectedService === index ? 'border-terracotta bg-blush' : 'border-line bg-white')}>
                <Text className="text-[14px] font-bold text-ink">{item.name}</Text>
                <Text className="mt-2 text-[11px] text-smoke">{item.duration}</Text>
                <Text className="mt-3 text-[14px] font-bold text-terracotta">{item.price}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text className="mt-7 text-[19px] font-bold text-ink">Where would you like it?</Text>
          <View className="mt-3 flex-row rounded-[17px] bg-cream p-1">
            <Pressable onPress={() => setMode('home')} className={'flex-1 rounded-[14px] py-3.5 ' + (mode === 'home' ? 'bg-white' : '')}>
              <View className="items-center"><Feather name="home" size={16} color={mode === 'home' ? '#D86D55' : '#8B8581'} /><Text className={'mt-1 text-[12px] font-semibold ' + (mode === 'home' ? 'text-ink' : 'text-smoke')}>Home / office</Text></View>
            </Pressable>
            <Pressable onPress={() => setMode('shop')} className={'flex-1 rounded-[14px] py-3.5 ' + (mode === 'shop' ? 'bg-white' : '')}>
              <View className="items-center"><Feather name="map-pin" size={16} color={mode === 'shop' ? '#D86D55' : '#8B8581'} /><Text className={'mt-1 text-[12px] font-semibold ' + (mode === 'shop' ? 'text-ink' : 'text-smoke')}>Their place</Text></View>
            </Pressable>
          </View>

          {mode === 'home' && (
            <View className="mt-5 rounded-[22px] border border-line bg-white p-4">
              <View className="flex-row items-start">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-[#EAF2FF]"><Feather name="navigation" size={17} color="#2D6CDF" /></View>
                <View className="ml-3 flex-1"><Text className="text-[16px] font-bold text-ink">House call details</Text><Text className="mt-1 text-[12px] leading-5 text-smoke">This provider travels up to {provider.serviceRadiusKm} km from {provider.location}.</Text></View>
              </View>
              <Pressable onPress={validateLocation} disabled={locationStatus === 'requesting'} className="mt-4 flex-row items-center justify-center rounded-full bg-cream py-3 active:opacity-75">
                <Feather name={locationStatus === 'validated' ? 'check-circle' : 'crosshair'} size={15} color="#2D6CDF" />
                <Text className="ml-2 text-[13px] font-bold text-banner">{locationStatus === 'requesting' ? 'Checking your location…' : locationStatus === 'validated' ? 'Location validated' : 'Validate my service address'}</Text>
              </Pressable>
              {locationStatus === 'validated' && distanceKm !== null && <View className="mt-3 rounded-[14px] bg-[#EAF6EE] px-3 py-2.5"><Text className="text-[12px] font-semibold text-[#34734B]">{distanceKm.toFixed(1)} km away · within service radius</Text></View>}
              {(locationStatus === 'out-of-range' || locationStatus === 'denied' || locationStatus === 'error') && <View className="mt-3 rounded-[14px] bg-[#FFF1F0] px-3 py-2.5"><Text className="text-[12px] leading-5 text-[#B5463E]">{locationStatus === 'out-of-range' ? `This address is outside the ${provider.serviceRadiusKm} km service radius.` : locationStatus === 'denied' ? 'Location access is needed to confirm this house call. You can enable it in device settings and try again.' : 'We could not verify your location. Check your connection and try again.'}</Text></View>}
              <Text className="mt-4 text-[12px] font-bold uppercase tracking-[1px] text-smoke">Home or office address</Text>
              <TextInput value={addressLabel} onChangeText={setAddressLabel} placeholder="e.g. 12 Admiralty Way, Lekki" placeholderTextColor="#A8B2C1" className="mt-2 rounded-[14px] bg-cream px-3.5 py-3.5 text-[14px] text-ink" />
              <Text className="mt-4 text-[12px] font-bold uppercase tracking-[1px] text-smoke">Door or gate instructions <Text className="font-normal normal-case tracking-normal">(optional)</Text></Text>
              <TextInput value={gateInstructions} onChangeText={setGateInstructions} placeholder="Gate code, security desk, parking notes…" placeholderTextColor="#A8B2C1" multiline className="mt-2 min-h-[76px] rounded-[14px] bg-cream px-3.5 py-3.5 text-[14px] text-ink" textAlignVertical="top" />
              {locationReady && <View className="mt-4 border-t border-line pt-3"><View className="flex-row justify-between"><Text className="text-[12px] text-smoke">Service</Text><Text className="text-[12px] font-semibold text-ink">{service.price}</Text></View><View className="mt-2 flex-row justify-between"><Text className="text-[12px] text-smoke">Base travel fee</Text><Text className="text-[12px] font-semibold text-ink">{formatNaira(travelFee)}</Text></View><View className="mt-3 flex-row justify-between"><Text className="text-[14px] font-bold text-ink">Total</Text><Text className="text-[14px] font-bold text-terracotta">{formatNaira(totalPrice)}</Text></View></View>}
            </View>
          )}

          <Text className="mt-7 text-[19px] font-bold text-ink">Pick a time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingTop: 14 }}>{dates.map((date) => <Pressable key={date} onPress={() => setSelectedDate(date)} className={'mr-2 rounded-full px-4 py-2.5 ' + (selectedDate === date ? 'bg-ink' : 'bg-white')}><Text className={'text-[12px] font-semibold ' + (selectedDate === date ? 'text-white' : 'text-ink')}>{date}</Text></Pressable>)}</ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingTop: 10 }}>{times.map((time) => <Pressable key={time} onPress={() => setSelectedTime(time)} className={'mr-2 rounded-full border px-4 py-2.5 ' + (selectedTime === time ? 'border-terracotta bg-blush' : 'border-line bg-white')}><Text className="text-[12px] font-semibold text-ink">{time}</Text></Pressable>)}</ScrollView>

          <Pressable onPress={book} className={'mt-8 flex-row items-center justify-center rounded-full py-4 active:opacity-80 ' + (mode === 'home' && !locationReady ? 'bg-[#B8C7DD]' : 'bg-terracotta')}>
            <Text className="text-[14px] font-bold text-white">{mode === 'home' ? (locationReady ? `Confirm house call · ${formatNaira(totalPrice)}` : 'Validate location to continue') : `Confirm booking · ${formatNaira(totalPrice)}`}</Text>
            <Feather name="arrow-up-right" size={17} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}