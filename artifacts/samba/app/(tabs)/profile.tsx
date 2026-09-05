import { Feather, Ionicons } from '@expo/vector-icons';
import { type Href, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth, useClerk, useUser } from '@clerk/expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark } from '@/components/BrandMark';
import { useBookings } from '@/context/BookingContext';
import { useAccount } from '@/context/AccountContext';

const menu = [{ label: 'Messages', icon: 'message-circle' as const }, { label: 'Personal details', icon: 'user' as const }, { label: 'Saved providers', icon: 'heart' as const }, { label: 'Payment methods', icon: 'credit-card' as const }, { label: 'Help & support', icon: 'help-circle' as const }];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bookings } = useBookings();
  const { setMode } = useAccount();
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const displayName = user?.firstName || user?.username || 'Welcome to Samba';
  const initials = user ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'S' : 'S';
  const openProviderHub = async () => {
    await setMode('provider');
    router.push('/provider-hub');
  };
  return <View className="flex-1 bg-paper"><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: 116 }}><View className="px-5"><View className="flex-row items-center justify-between"><BrandMark compact /><Pressable className="h-10 w-10 items-center justify-center rounded-full bg-white"><Feather name="settings" size={18} color="#16253F" /></Pressable></View><View className="mt-8 flex-row items-center"><View className="h-[76px] w-[76px] items-center justify-center rounded-full bg-peach"><Text className="text-[28px] font-bold text-ink">{initials}</Text></View><View className="ml-4 flex-1"><Text className="text-[21px] font-bold text-ink">{displayName}</Text><Text className="mt-1 text-[13px] text-smoke">{user?.primaryEmailAddress?.emailAddress || 'Browse beauty providers as a guest'}</Text><View className="mt-2 flex-row items-center"><Ionicons name="sparkles" size={13} color="#2D6CDF" /><Text className="ml-1 text-[12px] font-semibold text-terracotta">{isSignedIn ? 'Samba member' : 'Guest mode'}</Text></View></View></View>{isSignedIn ? <Pressable onPress={() => signOut()} className="mt-5 flex-row items-center justify-center rounded-full border border-line bg-white py-3 active:opacity-75"><Feather name="log-out" size={15} color="#68758A" /><Text className="ml-2 text-[13px] font-bold text-smoke">Sign out</Text></Pressable> : <Pressable onPress={() => router.push('/sign-in' as Href)} className="mt-5 flex-row items-center justify-center rounded-full bg-banner py-3.5 active:opacity-80"><Feather name="log-in" size={15} color="#FFFFFF" /><Text className="ml-2 text-[13px] font-bold text-white">Sign in to your Samba account</Text></Pressable>}<Pressable onPress={openProviderHub} className="mt-7 flex-row items-center rounded-[22px] bg-banner p-4 active:opacity-85"><View className="h-11 w-11 items-center justify-center rounded-full bg-white"><Ionicons name="briefcase-outline" size={21} color="#2D6CDF" /></View><View className="ml-3 flex-1"><Text className="text-[11px] font-bold uppercase tracking-[1px] text-peach">For beauty professionals</Text><Text className="mt-1 text-[17px] font-bold text-white">Open your Provider Hub</Text><Text className="mt-1 text-[12px] text-[#E3EDFF]">Manage services and receive bookings.</Text></View><Feather name="arrow-up-right" size={19} color="#FFFFFF" /></Pressable><View className="mt-6 flex-row rounded-[22px] bg-banner p-4"><View className="flex-1"><Text className="text-[11px] uppercase tracking-[1px] text-peach">Your beauty journey</Text><Text className="mt-2 text-[22px] font-bold text-white">{bookings.length} appointment{bookings.length === 1 ? '' : 's'} booked</Text><Text className="mt-1 text-[12px] text-[#E3EDFF]">Keep showing up for yourself.</Text></View><View className="h-12 w-12 items-center justify-center rounded-full bg-white"><Ionicons name="heart" size={22} color="#2D6CDF" /></View></View><View className="mt-8 overflow-hidden rounded-[22px] bg-white">{menu.map((item, index) => <Pressable key={item.label} onPress={() => { if (item.label === 'Messages') router.push('/messages'); if (item.label === 'Saved providers') router.push('/explore'); }} className={'flex-row items-center px-4 py-4 active:bg-cream ' + (index !== menu.length - 1 ? 'border-b border-line' : '')}><View className="h-9 w-9 items-center justify-center rounded-full bg-cream"><Feather name={item.icon} size={16} color="#2D6CDF" /></View><Text className="ml-3 flex-1 text-[14px] font-semibold text-ink">{item.label}</Text><Feather name="chevron-right" size={17} color="#A8B2C1" /></Pressable>)}</View><View className="mt-7 flex-row items-center justify-center"><Feather name="shield" size={13} color="#68758A" /><Text className="ml-1.5 text-[11px] text-smoke">Your data is safe with Samba</Text></View></View></ScrollView></View>;
}