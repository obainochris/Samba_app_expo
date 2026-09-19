import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lookbookFilters, lookbookLooks, LookbookLook } from '@/data/lookbook';

function LookCard({ look, liked, onToggleLike, onBook }: {
  look: LookbookLook;
  liked: boolean;
  onToggleLike: () => void;
  onBook: () => void;
}) {
  const heartScale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const toggleLike = async () => {
    heartScale.value = withSequence(withSpring(1.32, { damping: 5 }), withSpring(1));
    await Haptics.selectionAsync();
    onToggleLike();
  };

  return (
    <View className="mb-5 overflow-hidden rounded-[25px] bg-white">
      <View className="h-[286px]">
        <Image source={look.image} className="h-full w-full" resizeMode="cover" />
        <View className="absolute left-3.5 top-3.5 flex-row items-center rounded-full bg-white/90 px-3 py-1.5">
          <Ionicons name="sparkles" size={12} color="#2D6CDF" />
          <Text className="ml-1.5 text-[11px] font-bold text-ink">{look.category}</Text>
        </View>
        <Pressable
          accessibilityLabel={liked ? `Unlike ${look.artist}'s ${look.serviceName} look` : `Like ${look.artist}'s ${look.serviceName} look`}
          accessibilityRole="button"
          onPress={toggleLike}
          className="absolute right-3.5 top-3.5 h-10 w-10 items-center justify-center rounded-full bg-white/90 active:opacity-75"
        >
          <Animated.View style={heartStyle}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? '#D86D55' : '#16253F'} />
          </Animated.View>
        </Pressable>
        <View className="absolute bottom-3.5 left-3.5 flex-row items-center rounded-full bg-ink/85 px-3 py-1.5">
          <Ionicons name="heart" size={11} color="#FFFFFF" />
          <Text className="ml-1.5 text-[11px] font-semibold text-white">{look.likes + (liked ? 1 : 0)}</Text>
        </View>
      </View>
      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-[18px] font-bold text-ink">{look.serviceName}</Text>
            <Text className="mt-1 text-[12px] font-semibold text-terracotta">by {look.artist}</Text>
          </View>
          <Pressable
            accessibilityLabel={`Book ${look.serviceName} with ${look.artist}`}
            accessibilityRole="button"
            onPress={onBook}
            className="flex-row items-center rounded-full bg-banner px-3.5 py-2.5 active:opacity-80"
          >
            <Text className="text-[11px] font-bold text-white">Book this look</Text>
            <Feather name="arrow-up-right" size={13} color="#FFFFFF" style={{ marginLeft: 5 }} />
          </Pressable>
        </View>
        <Text className="mt-3 text-[13px] leading-5 text-smoke">{look.caption}</Text>
        <View className="mt-3 flex-row flex-wrap">
          {look.tags.map((tag) => (
            <View key={tag} className="mr-2 rounded-full bg-blush px-2.5 py-1.5">
              <Text className="text-[10px] font-semibold text-banner">#{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function LookbookScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<'All' | LookbookLook['category']>('All');
  const [likedLooks, setLikedLooks] = useState<Record<string, boolean>>({});

  const filteredLooks = useMemo(
    () => lookbookLooks.filter((look) => activeFilter === 'All' || look.category === activeFilter),
    [activeFilter],
  );

  const toggleLike = (lookId: string) => {
    setLikedLooks((current) => ({ ...current, [lookId]: !current[lookId] }));
  };

  return (
    <View className="flex-1 bg-paper">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 38 }}
      >
        <View className="px-5">
          <View className="flex-row items-center justify-between">
            <Pressable
              accessibilityLabel="Go back"
              accessibilityRole="button"
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-full border border-line bg-white active:opacity-75"
            >
              <Feather name="arrow-left" size={18} color="#16253F" />
            </Pressable>
            <View className="items-center">
              <Text className="text-[11px] font-bold uppercase tracking-[1.5px] text-terracotta">Samba edit</Text>
              <Text className="mt-1 text-[17px] font-bold text-ink">Style lookbook</Text>
            </View>
            <View className="h-10 w-10" />
          </View>
          <View className="mt-8">
            <Text className="text-[30px] font-bold leading-9 tracking-[-0.9px] text-ink">Save the look.</Text>
            <Text className="mt-1.5 max-w-[320px] text-[15px] leading-6 text-smoke">
              Real transformations from trusted Samba artists. Find your next appointment, then make it yours.
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 20, paddingRight: 20 }}
          >
            {lookbookFilters.map((filter) => {
              const active = activeFilter === filter.value;
              return (
                <Pressable
                  key={filter.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setActiveFilter(filter.value)}
                  className={'mr-2 rounded-full px-4 py-2.5 ' + (active ? 'bg-banner' : 'bg-white')}
                >
                  <Text className={'text-[12px] font-semibold ' + (active ? 'text-white' : 'text-ink')}>
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        <View className="mt-7 px-5">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-[18px] font-bold text-ink">{filteredLooks.length} looks to love</Text>
            <View className="flex-row items-center">
              <Ionicons name="heart-outline" size={14} color="#68758A" />
              <Text className="ml-1 text-[11px] font-semibold text-smoke">Tap to save</Text>
            </View>
          </View>
          {filteredLooks.map((look) => (
            <LookCard
              key={look.id}
              look={look}
              liked={Boolean(likedLooks[look.id])}
              onToggleLike={() => toggleLike(look.id)}
              onBook={() => router.push({
                pathname: '/provider/[id]',
                params: { id: look.providerId, serviceName: look.serviceName },
              })}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}