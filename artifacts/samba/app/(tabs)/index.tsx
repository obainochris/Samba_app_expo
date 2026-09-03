import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark } from '@/components/BrandMark';
import { categories, Provider, providers, ServiceMode } from '@/data/providers';

function ProviderCard({ provider, onPress }: { provider: Provider; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="mr-4 w-[230px] overflow-hidden rounded-[24px] bg-white active:opacity-85">
      <View className="h-[205px] w-full">
        <Image source={provider.image} className="h-full w-full" resizeMode="cover" />
        <View className="absolute left-3 top-3 flex-row items-center rounded-full bg-white/90 px-2.5 py-1.5">
          <Ionicons name="star" size={12} color="#BC8A4A" />
          <Text className="ml-1 text-[11px] font-bold text-ink">{provider.rating}</Text>
        </View>
        <View className="absolute right-3 top-3 h-8 w-8 items-center justify-center rounded-full bg-white/90">
          <Feather name="heart" size={15} color="#27221F" />
        </View>
      </View>
      <View className="p-4">
        <View className="flex-row items-center justify-between">
          <Text className="flex-1 text-[16px] font-bold text-ink" numberOfLines={1}>{provider.name}</Text>
          {provider.verified && <Ionicons name="checkmark-circle" size={16} color="#D86D55" />}
        </View>
        <Text className="mt-1 text-[12px] text-smoke" numberOfLines={1}>{provider.specialty}</Text>
        <View className="mt-3 flex-row items-center justify-between">
          <View className="flex-row items-center"><Feather name="map-pin" size={12} color="#8B8581" /><Text className="ml-1 text-[11px] text-smoke">{provider.distance}</Text></View>
          <Text className="text-[13px] font-bold text-terracotta">from {provider.price}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [mode, setMode] = useState<ServiceMode>('home');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const filtered = useMemo(() => providers.filter((provider) => {
    const matchesCategory = selectedCategory === 'All' || provider.category === selectedCategory;
    const query = search.toLowerCase();
    return matchesCategory && (!query || provider.name.toLowerCase().includes(query) || provider.specialty.toLowerCase().includes(query));
  }), [search, selectedCategory]);

  return (
    <View className="flex-1 bg-paper">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 116 }}>
        <View className="px-5" style={{ paddingTop: insets.top + 18 }}>
          <View className="flex-row items-center justify-between">
            <BrandMark />
            <Pressable className="h-10 w-10 items-center justify-center rounded-full border border-line bg-white active:opacity-70" onPress={() => router.push('/profile')}>
              <Feather name="bell" size={18} color="#27221F" />
              <View className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-terracotta" />
            </Pressable>
          </View>
          <View className="mt-8">
            <Text className="text-[29px] font-bold leading-9 tracking-[-0.8px] text-ink">Good morning, Tolu.</Text>
            <Text className="mt-1 text-[15px] leading-6 text-smoke">Feel good, look good, wherever you are.</Text>
          </View>
          <View className="mt-6 flex-row items-center rounded-[18px] bg-white px-4 py-3.5">
            <Feather name="search" size={19} color="#8B8581" />
            <TextInput value={search} onChangeText={setSearch} placeholder="What beauty service do you need?" placeholderTextColor="#A8A09A" className="ml-3 flex-1 text-[14px] text-ink" returnKeyType="search" />
            <Pressable className="ml-2 h-8 w-8 items-center justify-center rounded-xl bg-cream" onPress={() => setSearch('')}><Feather name="sliders" size={15} color="#D86D55" /></Pressable>
          </View>
          <View className="mt-5 flex-row rounded-[17px] bg-cream p-1">
            <Pressable onPress={() => setMode('home')} className={'flex-1 flex-row items-center justify-center rounded-[14px] py-3 ' + (mode === 'home' ? 'bg-white' : '')}><Feather name="home" size={15} color={mode === 'home' ? '#D86D55' : '#8B8581'} /><Text className={'ml-2 text-[13px] font-semibold ' + (mode === 'home' ? 'text-ink' : 'text-smoke')}>At home</Text></Pressable>
            <Pressable onPress={() => setMode('shop')} className={'flex-1 flex-row items-center justify-center rounded-[14px] py-3 ' + (mode === 'shop' ? 'bg-white' : '')}><Feather name="map-pin" size={15} color={mode === 'shop' ? '#D86D55' : '#8B8581'} /><Text className={'ml-2 text-[13px] font-semibold ' + (mode === 'shop' ? 'text-ink' : 'text-smoke')}>At their place</Text></Pressable>
          </View>
        </View>

        <View className="mt-7">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
            {categories.map((category) => {
              const active = selectedCategory === category.label;
              return <Pressable key={category.label} onPress={() => setSelectedCategory(category.label)} className={'mr-2 flex-row items-center rounded-full px-4 py-2.5 ' + (active ? 'bg-ink' : 'bg-white')}><Ionicons name={category.icon} size={15} color={active ? '#FFFFFF' : '#D86D55'} /><Text className={'ml-2 text-[12px] font-semibold ' + (active ? 'text-white' : 'text-ink')}>{category.label}</Text></Pressable>;
            })}
          </ScrollView>
        </View>

        <View className="mt-8">
          <View className="flex-row items-end justify-between px-5"><View><Text className="text-[21px] font-bold tracking-[-0.4px] text-ink">Made for you</Text><Text className="mt-1 text-[13px] text-smoke">Top-rated pros around {mode === 'home' ? 'your home' : 'your area'}</Text></View><Pressable onPress={() => router.push('/explore')}><Text className="text-[13px] font-semibold text-terracotta">See all</Text></Pressable></View>
          {filtered.length > 0 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 }}>{filtered.map((provider) => <ProviderCard key={provider.id} provider={provider} onPress={() => router.push({ pathname: '/provider/[id]', params: { id: provider.id } })} />)}</ScrollView> : <View className="mx-5 mt-4 rounded-[22px] bg-white p-5"><Text className="text-[15px] font-semibold text-ink">No providers found</Text><Text className="mt-1 text-[13px] text-smoke">Try another service or search term.</Text></View>}
        </View>

        <View className="mx-5 mt-8 overflow-hidden rounded-[25px] bg-ink p-5">
          <View className="flex-row items-start justify-between"><View className="max-w-[235px]"><Text className="text-[12px] font-semibold uppercase tracking-[1.2px] text-peach">Samba care</Text><Text className="mt-2 text-[23px] font-bold leading-7 text-white">Your next good hair day is closer than you think.</Text><Text className="mt-2 text-[13px] leading-5 text-[#D7CECA]">Book a trusted beauty pro in just a few taps.</Text></View><View className="h-14 w-14 items-center justify-center rounded-full bg-terracotta"><Ionicons name="sparkles" size={26} color="#FFFFFF" /></View></View>
          <Pressable onPress={() => router.push('/explore')} className="mt-5 self-start rounded-full bg-white px-4 py-2.5 active:opacity-80"><Text className="text-[12px] font-bold text-ink">Explore providers</Text></Pressable>
        </View>
      </ScrollView>
    </View>
  );
}