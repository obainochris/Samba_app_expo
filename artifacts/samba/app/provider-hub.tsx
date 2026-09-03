import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { BrandMark } from '@/components/BrandMark';
import { AccountMode, useAccount } from '@/context/AccountContext';

const categories = ['Hair stylist', 'Barber', 'Makeup artist'];

export default function ProviderHubScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { providerAccount, saveProviderAccount, setMode, toggleProviderLive } = useAccount();
  const [displayName, setDisplayName] = useState(providerAccount.displayName);
  const [category, setCategory] = useState(providerAccount.category);
  const [specialty, setSpecialty] = useState(providerAccount.specialty);
  const [location, setLocation] = useState(providerAccount.location);
  const [startingPrice, setStartingPrice] = useState(providerAccount.startingPrice);

  const switchToClient = async () => {
    await setMode('client');
    router.replace('/');
  };

  const save = async () => {
    if (!displayName.trim() || !specialty.trim() || !location.trim() || !startingPrice.trim()) {
      Alert.alert('Complete your profile', 'Add your business name, specialty, location, and starting price before saving.');
      return;
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await saveProviderAccount({ displayName: displayName.trim(), category, specialty: specialty.trim(), location: location.trim(), startingPrice: startingPrice.trim(), isLive: providerAccount.isLive });
    Alert.alert('Provider profile saved', 'Your Provider Hub profile is ready to share with Samba clients.');
  };

  const toggleLive = async () => {
    await Haptics.selectionAsync();
    await toggleProviderLive();
  };

  return (
    <View className="flex-1 bg-paper">
      <KeyboardAwareScrollViewCompat keyboardShouldPersistTaps="handled" bottomOffset={30} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 36 }}>
        <View className="px-5">
          <View className="flex-row items-center justify-between">
            <Pressable onPress={switchToClient} className="flex-row items-center active:opacity-70">
              <Feather name="arrow-left" size={19} color="#16253F" />
              <Text className="ml-2 text-[13px] font-semibold text-ink">Client mode</Text>
            </Pressable>
            <BrandMark compact />
          </View>
          <View className="mt-7 overflow-hidden rounded-[26px] bg-banner p-5">
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-[11px] font-bold uppercase tracking-[1.2px] text-peach">Samba for pros</Text>
                <Text className="mt-2 text-[28px] font-bold leading-8 text-white">Your craft, your way.</Text>
                <Text className="mt-2 text-[13px] leading-5 text-[#E3EDFF]">Build your profile, set your services, and let the right clients find you.</Text>
              </View>
              <View className="ml-3 h-12 w-12 items-center justify-center rounded-full bg-white"><Ionicons name="briefcase" size={22} color="#2D6CDF" /></View>
            </View>
            <View className="mt-5 flex-row items-center justify-between border-t border-white/20 pt-4">
              <View><Text className="text-[11px] text-[#E3EDFF]">Profile status</Text><Text className="mt-1 text-[13px] font-bold text-white">{providerAccount.displayName ? 'Ready to publish' : 'Setup needed'}</Text></View>
              <Pressable onPress={toggleLive} className={'flex-row items-center rounded-full px-3.5 py-2 ' + (providerAccount.isLive ? 'bg-white' : 'bg-[#1C55B8]')}><View className={'mr-2 h-2 w-2 rounded-full ' + (providerAccount.isLive ? 'bg-[#39A66B]' : 'bg-[#AFCBFF]')} /><Text className="text-[12px] font-bold text-white">{providerAccount.isLive ? 'Live' : 'Go live'}</Text></Pressable>
            </View>
          </View>

          <View className="mt-7 flex-row items-end justify-between"><View><Text className="text-[21px] font-bold text-ink">Provider account</Text><Text className="mt-1 text-[13px] text-smoke">This is how clients will see you.</Text></View><View className="rounded-full bg-blush px-3 py-1.5"><Text className="text-[11px] font-bold text-terracotta">{providerAccount.displayName ? 'Complete' : '60% complete'}</Text></View></View>
          <View className="mt-4 rounded-[23px] bg-white p-4">
            <Text className="text-[12px] font-bold uppercase tracking-[1px] text-smoke">Public name</Text>
            <TextInput value={displayName} onChangeText={setDisplayName} placeholder="e.g. Amara Hair Studio" placeholderTextColor="#A8B2C1" className="mt-2 rounded-[14px] bg-cream px-3.5 py-3.5 text-[14px] text-ink" />
            <Text className="mt-4 text-[12px] font-bold uppercase tracking-[1px] text-smoke">Your category</Text>
            <View className="mt-2 flex-row flex-wrap">{categories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} className={'mr-2 mb-2 rounded-full px-3.5 py-2.5 ' + (category === item ? 'bg-banner' : 'bg-cream')}><Text className={'text-[12px] font-semibold ' + (category === item ? 'text-white' : 'text-ink')}>{item}</Text></Pressable>)}</View>
            <Text className="mt-2 text-[12px] font-bold uppercase tracking-[1px] text-smoke">Specialty</Text>
            <TextInput value={specialty} onChangeText={setSpecialty} placeholder="e.g. Natural hair & protective styles" placeholderTextColor="#A8B2C1" className="mt-2 rounded-[14px] bg-cream px-3.5 py-3.5 text-[14px] text-ink" />
            <View className="mt-4 flex-row"><View className="mr-2 flex-1"><Text className="text-[12px] font-bold uppercase tracking-[1px] text-smoke">Location</Text><TextInput value={location} onChangeText={setLocation} placeholder="e.g. Lekki Phase 1" placeholderTextColor="#A8B2C1" className="mt-2 rounded-[14px] bg-cream px-3.5 py-3.5 text-[14px] text-ink" /></View><View className="w-[116px]"><Text className="text-[12px] font-bold uppercase tracking-[1px] text-smoke">From</Text><TextInput value={startingPrice} onChangeText={setStartingPrice} placeholder="₦15,000" placeholderTextColor="#A8B2C1" className="mt-2 rounded-[14px] bg-cream px-3.5 py-3.5 text-[14px] text-ink" keyboardType="number-pad" /></View></View>
            <Pressable onPress={save} className="mt-5 flex-row items-center justify-center rounded-full bg-banner py-3.5 active:opacity-80"><Text className="text-[13px] font-bold text-white">Save provider profile</Text><Feather name="check" size={16} color="#FFFFFF" style={{ marginLeft: 8 }} /></Pressable>
          </View>

          <Text className="mt-8 text-[21px] font-bold text-ink">Your hub</Text>
          <View className="mt-4 flex-row"><View className="mr-2 flex-1 rounded-[20px] bg-white p-4"><Ionicons name="calendar-outline" size={18} color="#2D6CDF" /><Text className="mt-4 text-[22px] font-bold text-ink">0</Text><Text className="mt-1 text-[12px] text-smoke">Upcoming bookings</Text></View><View className="ml-2 flex-1 rounded-[20px] bg-white p-4"><Ionicons name="wallet-outline" size={18} color="#2D6CDF" /><Text className="mt-4 text-[22px] font-bold text-ink">₦0</Text><Text className="mt-1 text-[12px] text-smoke">This month</Text></View></View>
          <View className="mt-3 flex-row items-center rounded-[20px] border border-line bg-white p-4"><View className="h-10 w-10 items-center justify-center rounded-full bg-blush"><Ionicons name="sparkles-outline" size={18} color="#2D6CDF" /></View><View className="ml-3 flex-1"><Text className="text-[14px] font-bold text-ink">No new client requests</Text><Text className="mt-1 text-[12px] leading-4 text-smoke">Go live when you are ready to start receiving bookings.</Text></View><Feather name="chevron-right" size={17} color="#A8B2C1" /></View>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}