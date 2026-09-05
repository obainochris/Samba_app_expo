import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBookings } from '@/context/BookingContext';

const statusLabels = {
  confirmed: 'Confirmed',
  driving: 'Driving',
  arrived: 'Arrived',
  'in-progress': 'In progress',
  completed: 'Completed',
} as const;

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bookings, cancelBooking } = useBookings();
  const upcoming = bookings.filter((booking) => booking.status === 'upcoming');
  const cancel = (id: string) => Alert.alert('Cancel booking?', 'This appointment will be removed from your upcoming bookings.', [{ text: 'Keep it', style: 'cancel' }, { text: 'Cancel booking', style: 'destructive', onPress: () => cancelBooking(id) }]);

  return (
    <View className="flex-1 bg-paper">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: 116 }}>
        <View className="px-5">
          <Text className="text-[29px] font-bold tracking-[-0.8px] text-ink">Your bookings</Text>
          <Text className="mt-1 text-[15px] text-smoke">Everything you have planned with Samba.</Text>
          {upcoming.length > 0 ? (
            <View className="mt-7">
              {upcoming.map((booking) => {
                const isHouseCall = booking.mode === 'home';
                const trackingStatus = booking.trackingStatus ?? 'confirmed';
                return (
                  <View key={booking.id} className="mb-4 rounded-[24px] bg-white p-4">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <View className={'h-8 w-8 items-center justify-center rounded-full ' + (isHouseCall ? 'bg-[#EAF2FF]' : 'bg-blush')}>
                            <Ionicons name={isHouseCall ? 'navigate-outline' : 'calendar-outline'} size={16} color={isHouseCall ? '#2D6CDF' : '#D86D55'} />
                          </View>
                          <View className="ml-3"><Text className="text-[16px] font-bold text-ink">{booking.serviceName}</Text><Text className="mt-0.5 text-[12px] text-smoke">with {booking.providerName}</Text></View>
                        </View>
                        <View className="mt-4 flex-row items-center"><View className="rounded-full bg-cream px-3 py-2"><Text className="text-[12px] font-semibold text-ink">{booking.date}</Text></View><Text className="ml-2 rounded-full bg-cream px-3 py-2 text-[12px] font-semibold text-ink">{booking.time}</Text></View>
                      </View>
                      <View className={'rounded-full px-2.5 py-1 ' + (isHouseCall ? 'bg-[#EAF2FF]' : 'bg-[#E6F0EA]')}><Text className={'text-[10px] font-bold uppercase tracking-[0.8px] ' + (isHouseCall ? 'text-banner' : 'text-[#567A63]')}>{isHouseCall ? statusLabels[trackingStatus] : 'Confirmed'}</Text></View>
                    </View>
                    <View className="mt-4 border-t border-line pt-3">
                      <View className="flex-row items-center justify-between"><View className="flex-1 flex-row items-center"><Feather name={isHouseCall ? 'home' : 'map-pin'} size={13} color="#8B8581" /><Text className="ml-1.5 flex-1 text-[12px] text-smoke">{isHouseCall ? booking.clientAddress : booking.location}</Text></View><Text className="ml-3 text-[13px] font-bold text-terracotta">{booking.price}</Text></View>
                      {isHouseCall && <View className="mt-2 flex-row items-center justify-between"><Text className="text-[11px] text-smoke">{booking.distanceKm?.toFixed(1) ?? '—'} km house call</Text><Text className="text-[11px] text-smoke">{booking.travelFee ? `Includes ₦${booking.travelFee.toLocaleString('en-NG')} travel` : ''}</Text></View>}
                    </View>
                    {isHouseCall && <Pressable onPress={() => router.push({ pathname: '/house-call/[bookingId]', params: { bookingId: booking.id } })} className="mt-4 flex-row items-center justify-center rounded-full bg-banner py-3 active:opacity-80"><Feather name="navigation" size={14} color="#FFFFFF" /><Text className="ml-2 text-[12px] font-bold text-white">{trackingStatus === 'confirmed' ? 'View house call details' : 'Track your provider'}</Text></Pressable>}
                    <Pressable onPress={() => cancel(booking.id)} className="mt-3 self-start"><Text className="text-[12px] font-semibold text-smoke">Cancel booking</Text></Pressable>
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="mt-10 items-center rounded-[24px] bg-white px-6 py-12">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-blush"><Ionicons name="calendar-outline" size={25} color="#D86D55" /></View>
              <Text className="mt-4 text-[17px] font-bold text-ink">No bookings yet</Text>
              <Text className="mt-1 text-center text-[13px] leading-5 text-smoke">When you find the right pro, your appointments will show up here.</Text>
              <Pressable onPress={() => router.push('/explore')} className="mt-5 rounded-full bg-ink px-5 py-3 active:opacity-80"><Text className="text-[12px] font-bold text-white">Find a provider</Text></Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}