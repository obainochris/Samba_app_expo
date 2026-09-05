import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProvider, useBookings } from '@/context/BookingContext';
import { houseCallSteps } from '@/utils/house-call';

export default function HouseCallTrackerScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bookings } = useBookings();
  const booking = bookings.find((item) => item.id === bookingId);
  const provider = booking ? getProvider(booking.providerId) : undefined;

  if (!booking || booking.mode !== 'home') {
    return (
      <View className="flex-1 items-center justify-center bg-paper px-8">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-blush"><Feather name="map-pin" size={24} color="#D86D55" /></View>
        <Text className="mt-4 text-center text-[18px] font-bold text-ink">House call not found</Text>
        <Pressable onPress={() => router.replace('/bookings')} className="mt-5 rounded-full bg-banner px-5 py-3"><Text className="text-[13px] font-bold text-white">Back to bookings</Text></Pressable>
      </View>
    );
  }

  const activeStatus = booking.trackingStatus ?? 'confirmed';
  const activeIndex = houseCallSteps.findIndex((step) => step.status === activeStatus);
  const statusLabel = activeStatus === 'driving' && booking.etaMinutes ? `Driving · ${booking.etaMinutes} min away` : houseCallSteps[activeIndex]?.label ?? 'Confirmed';

  return (
    <View className="flex-1 bg-paper">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 36 }}>
        <View className="px-5">
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-70"><Feather name="arrow-left" size={19} color="#16253F" /></Pressable>
            <Text className="text-[13px] font-bold uppercase tracking-[1px] text-smoke">Live house call</Text>
            <View className="w-10" />
          </View>

          <View className="mt-7 overflow-hidden rounded-[26px] bg-banner p-5">
            <View className="flex-row items-start">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-white"><Feather name="navigation" size={21} color="#2D6CDF" /></View>
              <View className="ml-3 flex-1">
                <Text className="text-[11px] font-bold uppercase tracking-[1px] text-peach">Your provider is on the move</Text>
                <Text className="mt-2 text-[25px] font-bold leading-7 text-white">{statusLabel}</Text>
                <Text className="mt-2 text-[13px] leading-5 text-[#E3EDFF]">{provider?.firstName ?? booking.providerName} is handling your {booking.serviceName.toLowerCase()} appointment.</Text>
              </View>
            </View>
          </View>

          <View className="mt-6 rounded-[24px] bg-white p-5">
            <Text className="text-[17px] font-bold text-ink">Visit progress</Text>
            <View className="mt-5">
              {houseCallSteps.map((step, index) => {
                const completed = index <= activeIndex;
                const current = index === activeIndex;
                return (
                  <View key={step.status} className="flex-row">
                    <View className="mr-3 items-center">
                      <View className={'h-9 w-9 items-center justify-center rounded-full ' + (completed ? 'bg-banner' : 'bg-cream')}>
                        <Feather name={step.icon} size={16} color={completed ? '#FFFFFF' : '#A8B2C1'} />
                      </View>
                      {index < houseCallSteps.length - 1 && <View className={'my-1 h-8 w-px ' + (index < activeIndex ? 'bg-banner' : 'bg-line')} />}
                    </View>
                    <View className="flex-1 pb-6">
                      <View className="flex-row items-center justify-between">
                        <Text className={'text-[14px] font-bold ' + (completed ? 'text-ink' : 'text-smoke')}>{step.label}</Text>
                        {current && <View className="rounded-full bg-[#EAF2FF] px-2.5 py-1"><Text className="text-[10px] font-bold uppercase tracking-[0.8px] text-banner">Current</Text></View>}
                      </View>
                      {step.status === 'driving' && current && booking.etaMinutes && <Text className="mt-1 text-[12px] text-smoke">Estimated arrival in about {booking.etaMinutes} minutes.</Text>}
                      {step.status === 'arrived' && current && <Text className="mt-1 text-[12px] text-smoke">Your provider has reached the service address.</Text>}
                      {step.status === 'in-progress' && current && <Text className="mt-1 text-[12px] text-smoke">Your appointment is underway.</Text>}
                      {step.status === 'completed' && current && <Text className="mt-1 text-[12px] text-smoke">Thanks for choosing Samba.</Text>}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View className="mt-4 rounded-[24px] bg-white p-5">
            <Text className="text-[17px] font-bold text-ink">Visit details</Text>
            <View className="mt-4 flex-row items-start"><Feather name="scissors" size={15} color="#2D6CDF" /><View className="ml-3 flex-1"><Text className="text-[13px] font-semibold text-ink">{booking.serviceName}</Text><Text className="mt-1 text-[12px] text-smoke">with {booking.providerName}</Text></View></View>
            <View className="mt-4 flex-row items-start"><Feather name="calendar" size={15} color="#2D6CDF" /><View className="ml-3 flex-1"><Text className="text-[13px] font-semibold text-ink">{booking.date} · {booking.time}</Text><Text className="mt-1 text-[12px] text-smoke">{booking.distanceKm?.toFixed(1) ?? '—'} km travel distance</Text></View></View>
            <View className="mt-4 flex-row items-start"><Feather name="home" size={15} color="#2D6CDF" /><View className="ml-3 flex-1"><Text className="text-[13px] font-semibold text-ink">{booking.clientAddress}</Text>{booking.gateInstructions ? <Text className="mt-1 text-[12px] leading-5 text-smoke">Gate note: {booking.gateInstructions}</Text> : <Text className="mt-1 text-[12px] text-smoke">No gate instructions added</Text>}</View></View>
            <View className="mt-4 border-t border-line pt-3"><View className="flex-row justify-between"><Text className="text-[12px] text-smoke">Service</Text><Text className="text-[12px] font-semibold text-ink">{booking.servicePrice ?? booking.price}</Text></View><View className="mt-2 flex-row justify-between"><Text className="text-[12px] text-smoke">Travel fee</Text><Text className="text-[12px] font-semibold text-ink">{booking.travelFee ? `₦${booking.travelFee.toLocaleString('en-NG')}` : 'Included'}</Text></View><View className="mt-3 flex-row justify-between"><Text className="text-[14px] font-bold text-ink">Total</Text><Text className="text-[14px] font-bold text-terracotta">{booking.price}</Text></View></View>
          </View>

          <Pressable onPress={() => router.replace('/bookings')} className="mt-5 items-center py-3 active:opacity-70"><Text className="text-[13px] font-bold text-banner">Back to all bookings</Text></Pressable>
        </View>
      </ScrollView>
    </View>
  );
}