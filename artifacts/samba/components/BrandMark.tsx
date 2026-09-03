import { Text, View } from 'react-native';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View className="flex-row items-center">
      <View className="mr-2 h-9 w-9 items-center justify-center rounded-full bg-banner">
        <Text className="text-lg font-bold text-white">S</Text>
      </View>
      {!compact && <Text className="text-[22px] font-bold tracking-[-0.8px] text-ink">samba</Text>}
    </View>
  );
}