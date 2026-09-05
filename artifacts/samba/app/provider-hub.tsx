import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { BrandMark } from '@/components/BrandMark';
import { useAccount } from '@/context/AccountContext';
import { useMessages } from '@/context/MessageContext';
import { useBookings } from '@/context/BookingContext';
import { providers } from '@/data/providers';
import { HouseCallStatus } from '@/utils/house-call';

const categories = ['Hair stylist', 'Barber', 'Makeup artist'];

export default function ProviderHubScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { providerAccount, saveProviderAccount, setMode, toggleProviderLive } = useAccount();
  const { conversations, unreadCounts } = useMessages();
  const { bookings, updateBookingStatus } = useBookings();
  const [displayName, setDisplayName] = useState(providerAccount.displayName);
  const [category, setCategory] = useState(providerAccount.category);
  const [specialty, setSpecialty] = useState(providerAccount.specialty);
  const [location, setLocation] = useState(providerAccount.location);
  const [startingPrice, setStartingPrice] = useState(providerAccount.startingPrice);
  const [profileImageUri, setProfileImageUri] = useState(providerAccount.profileImageUri ?? '');
  const [portfolioUris, setPortfolioUris] = useState<string[]>(providerAccount.portfolioUris ?? []);

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
    await saveProviderAccount({ displayName: displayName.trim(), category, specialty: specialty.trim(), location: location.trim(), startingPrice: startingPrice.trim(), isLive: providerAccount.isLive, profileImageUri, portfolioUris });
    Alert.alert('Provider profile saved', 'Your Provider Hub profile is ready to share with Samba clients.');
  };

  const pickImage = async (onPicked: (uri: string) => void, aspect: [number, number]) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow Samba to access your photos to add an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect,
      quality: 0.82,
    });
    if (!result.canceled && result.assets[0]?.uri) onPicked(result.assets[0].uri);
  };

  const addPortfolioImage = async () => {
    if (portfolioUris.length >= 6) {
      Alert.alert('Portfolio is full', 'You can showcase up to six portfolio images.');
      return;
    }
    await pickImage((uri) => setPortfolioUris((current) => [...current, uri]), [4, 3]);
  };

  const toggleLive = async () => {
    await Haptics.selectionAsync();
    await toggleProviderLive();
  };

  const conversationProviders = providers.filter((provider) => conversations[provider.id]?.length);
  const unreadRequestCount = conversationProviders.reduce((total, provider) => total + (unreadCounts[provider.id] ?? 0), 0);
  const openRequests = () => router.push({ pathname: '/messages', params: { mode: 'provider' } });
  const houseCalls = bookings.filter((booking) => booking.mode === 'home' && booking.status === 'upcoming');
  const nextHouseCallStatus: Record<HouseCallStatus, HouseCallStatus | null> = {
    confirmed: 'driving',
    driving: 'arrived',
    arrived: 'in-progress',
    'in-progress': 'completed',
    completed: null,
  };
  const houseCallActionLabel: Record<HouseCallStatus, string> = {
    confirmed: 'Start driving',
    driving: 'Mark arrived',
    arrived: 'Start service',
    'in-progress': 'Complete visit',
    completed: 'Completed',
  };
  const advanceHouseCall = async (bookingId: string, status: HouseCallStatus) => {
    const nextStatus = nextHouseCallStatus[status];
    if (nextStatus) await updateBookingStatus(bookingId, nextStatus);
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
             <Text className="text-[12px] font-bold uppercase tracking-[1px] text-smoke">Profile picture</Text>
             <View className="mt-3 flex-row items-center">
               <Pressable onPress={() => pickImage(setProfileImageUri, [1, 1])} className="h-[76px] w-[76px] overflow-hidden rounded-full bg-cream active:opacity-75">
                 {profileImageUri ? <Image source={{ uri: profileImageUri }} style={{ width: 76, height: 76 }} resizeMode="cover" /> : <View className="flex-1 items-center justify-center"><Feather name="camera" size={22} color="#2D6CDF" /></View>}
               </Pressable>
               <View className="ml-3 flex-1"><Text className="text-[14px] font-bold text-ink">Show clients who you are</Text><Text className="mt-1 text-[12px] leading-5 text-smoke">Add a clear headshot or studio image to your public profile.</Text><Pressable onPress={() => pickImage(setProfileImageUri, [1, 1])} className="mt-2 self-start"><Text className="text-[12px] font-bold text-banner">{profileImageUri ? 'Change photo' : 'Add profile photo'}</Text></Pressable></View>
             </View>
            <Text className="text-[12px] font-bold uppercase tracking-[1px] text-smoke">Public name</Text>
            <TextInput value={displayName} onChangeText={setDisplayName} placeholder="e.g. Amara Hair Studio" placeholderTextColor="#A8B2C1" className="mt-2 rounded-[14px] bg-cream px-3.5 py-3.5 text-[14px] text-ink" />
            <Text className="mt-4 text-[12px] font-bold uppercase tracking-[1px] text-smoke">Your category</Text>
            <View className="mt-2 flex-row flex-wrap">{categories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} className={'mr-2 mb-2 rounded-full px-3.5 py-2.5 ' + (category === item ? 'bg-banner' : 'bg-cream')}><Text className={'text-[12px] font-semibold ' + (category === item ? 'text-white' : 'text-ink')}>{item}</Text></Pressable>)}</View>
            <Text className="mt-2 text-[12px] font-bold uppercase tracking-[1px] text-smoke">Specialty</Text>
            <TextInput value={specialty} onChangeText={setSpecialty} placeholder="e.g. Natural hair & protective styles" placeholderTextColor="#A8B2C1" className="mt-2 rounded-[14px] bg-cream px-3.5 py-3.5 text-[14px] text-ink" />
            <View className="mt-4 flex-row"><View className="mr-2 flex-1"><Text className="text-[12px] font-bold uppercase tracking-[1px] text-smoke">Location</Text><TextInput value={location} onChangeText={setLocation} placeholder="e.g. Lekki Phase 1" placeholderTextColor="#A8B2C1" className="mt-2 rounded-[14px] bg-cream px-3.5 py-3.5 text-[14px] text-ink" /></View><View className="w-[116px]"><Text className="text-[12px] font-bold uppercase tracking-[1px] text-smoke">From</Text><TextInput value={startingPrice} onChangeText={setStartingPrice} placeholder="₦15,000" placeholderTextColor="#A8B2C1" className="mt-2 rounded-[14px] bg-cream px-3.5 py-3.5 text-[14px] text-ink" keyboardType="number-pad" /></View></View>
            <Pressable onPress={save} className="mt-5 flex-row items-center justify-center rounded-full bg-banner py-3.5 active:opacity-80"><Text className="text-[13px] font-bold text-white">Save provider profile</Text><Feather name="check" size={16} color="#FFFFFF" style={{ marginLeft: 8 }} /></Pressable>
          </View>

           <View className="mt-5 rounded-[23px] bg-white p-4">
             <View className="flex-row items-center justify-between"><View><Text className="text-[17px] font-bold text-ink">Portfolio</Text><Text className="mt-1 text-[12px] text-smoke">Show the work you want to be booked for.</Text></View><Pressable onPress={addPortfolioImage} className="h-9 w-9 items-center justify-center rounded-full bg-cream active:opacity-70"><Feather name="plus" size={18} color="#2D6CDF" /></Pressable></View>
             {portfolioUris.length > 0 ? <View className="mt-4 flex-row flex-wrap">{portfolioUris.map((uri, index) => <View key={`${uri}-${index}`} className="mb-3 mr-3 overflow-hidden rounded-[16px]"><Image source={{ uri }} style={{ width: 98, height: 98 }} resizeMode="cover" /><Pressable onPress={() => setPortfolioUris((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-1.5 top-1.5 h-7 w-7 items-center justify-center rounded-full bg-white/90"><Feather name="x" size={14} color="#16253F" /></Pressable></View>)}</View> : <Pressable onPress={addPortfolioImage} className="mt-4 items-center rounded-[17px] border border-dashed border-line bg-cream px-4 py-5 active:opacity-75"><View className="h-9 w-9 items-center justify-center rounded-full bg-white"><Feather name="image" size={17} color="#2D6CDF" /></View><Text className="mt-2 text-[13px] font-bold text-ink">Add your first work sample</Text><Text className="mt-1 text-center text-[11px] text-smoke">You can add up to six images.</Text></Pressable>}
             {portfolioUris.length > 0 && <Pressable onPress={addPortfolioImage} className="mt-1 self-start"><Text className="text-[12px] font-bold text-banner">Add another image</Text></Pressable>}
           </View>

          <Text className="mt-8 text-[21px] font-bold text-ink">Your hub</Text>
           <View className="mt-4 flex-row"><View className="mr-2 flex-1 rounded-[20px] bg-white p-4"><Ionicons name="calendar-outline" size={18} color="#2D6CDF" /><Text className="mt-4 text-[22px] font-bold text-ink">{bookings.filter((booking) => booking.status === 'upcoming').length}</Text><Text className="mt-1 text-[12px] text-smoke">Upcoming bookings</Text></View><View className="ml-2 flex-1 rounded-[20px] bg-white p-4"><Ionicons name="wallet-outline" size={18} color="#2D6CDF" /><Text className="mt-4 text-[22px] font-bold text-ink">₦0</Text><Text className="mt-1 text-[12px] text-smoke">This month</Text></View></View>
           <View className="mt-4"><View className="flex-row items-center justify-between"><Text className="text-[16px] font-bold text-ink">House calls</Text><View className="rounded-full bg-[#EAF2FF] px-2.5 py-1"><Text className="text-[10px] font-bold uppercase tracking-[0.8px] text-banner">{houseCalls.length} active</Text></View></View>{houseCalls.length > 0 ? houseCalls.map((booking) => { const status = booking.trackingStatus ?? 'confirmed'; return <View key={booking.id} className="mt-3 rounded-[20px] bg-white p-4"><View className="flex-row items-start"><View className="h-10 w-10 items-center justify-center rounded-full bg-cream"><Feather name="home" size={17} color="#2D6CDF" /></View><View className="ml-3 flex-1"><Text className="text-[14px] font-bold text-ink">{booking.serviceName}</Text><Text className="mt-1 text-[12px] text-smoke">{booking.clientAddress}</Text><Text className="mt-1 text-[11px] text-smoke">{booking.date} · {booking.time} · {booking.distanceKm?.toFixed(1) ?? '—'} km away</Text></View></View><View className="mt-3 flex-row items-center justify-between rounded-[14px] bg-cream px-3 py-2.5"><Text className="text-[12px] font-bold text-ink">{status === 'driving' && booking.etaMinutes ? `Driving · ${booking.etaMinutes} min ETA` : status.replace('-', ' ')}</Text><Text className="text-[12px] font-bold text-terracotta">{booking.price}</Text></View>{booking.gateInstructions && <Text className="mt-3 text-[12px] leading-5 text-smoke">Gate note: {booking.gateInstructions}</Text>}<Pressable onPress={() => advanceHouseCall(booking.id, status)} className="mt-3 items-center rounded-full bg-banner py-3 active:opacity-80"><Text className="text-[12px] font-bold text-white">{houseCallActionLabel[status]}</Text></Pressable></View>; }) : <View className="mt-3 rounded-[20px] border border-line bg-white p-4"><Text className="text-[13px] font-semibold text-ink">No active house calls</Text><Text className="mt-1 text-[12px] leading-5 text-smoke">When a client books Home / office, you can update their live arrival status here.</Text></View>}</View>
           <View className="mt-3 flex-row items-center rounded-[20px] border border-line bg-white p-4"><View className={'h-10 w-10 items-center justify-center rounded-full ' + (unreadRequestCount > 0 ? 'bg-blush' : 'bg-cream')}><Ionicons name={unreadRequestCount > 0 ? 'chatbubbles-outline' : 'sparkles-outline'} size={18} color="#2D6CDF" /></View><View className="ml-3 flex-1"><Text className="text-[14px] font-bold text-ink">{unreadRequestCount > 0 ? `${unreadRequestCount} new client message${unreadRequestCount === 1 ? '' : 's'}` : conversationProviders.length > 0 ? 'Your client conversations' : 'No new client requests'}</Text><Text className="mt-1 text-[12px] leading-4 text-smoke">{unreadRequestCount > 0 ? 'Open your inbox to reply before the next booking.' : conversationProviders.length > 0 ? 'Review your conversations and keep clients moving.' : 'Go live when you are ready to start receiving bookings.'}</Text></View><Pressable onPress={openRequests} className="h-10 w-10 items-center justify-center rounded-full bg-cream active:opacity-70"><Feather name="chevron-right" size={17} color="#A8B2C1" /></Pressable></View>
           {conversationProviders.length > 0 && <View className="mt-4"><View className="flex-row items-center justify-between"><Text className="text-[16px] font-bold text-ink">Client inbox</Text><Pressable onPress={openRequests} className="active:opacity-70"><Text className="text-[12px] font-bold text-banner">View all</Text></Pressable></View>{conversationProviders.map((provider) => { const providerMessages = conversations[provider.id] ?? []; const lastMessage = providerMessages[providerMessages.length - 1]; const unreadCount = unreadCounts[provider.id] ?? 0; return <Pressable key={provider.id} onPress={() => router.push({ pathname: '/messages/[providerId]', params: { providerId: provider.id, mode: 'provider' } })} className="mt-3 flex-row items-center rounded-[20px] bg-white p-3 active:opacity-80"><Image source={provider.image} className="h-12 w-12 rounded-[15px]" resizeMode="cover" /><View className="ml-3 flex-1"><View className="flex-row items-center justify-between"><Text className="text-[14px] font-bold text-ink">Client consultation</Text>{unreadCount > 0 && <View className="min-w-[22px] items-center rounded-full bg-terracotta px-1.5 py-1"><Text className="text-[10px] font-bold text-white">{unreadCount}</Text></View>}</View><Text className="mt-1 text-[11px] text-smoke">About {provider.name}</Text><Text className="mt-1 text-[12px] text-smoke" numberOfLines={1}>{lastMessage?.text}</Text></View><Feather name="chevron-right" size={17} color="#A8B2C1" style={{ marginLeft: 8 }} /></Pressable>; })}</View>}
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}