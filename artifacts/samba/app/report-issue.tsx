import { Feather } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { useCreateIssue } from '@workspace/api-client-react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';

const categories = [
  { value: 'provider', label: 'Provider' },
  { value: 'booking', label: 'Booking' },
  { value: 'payment', label: 'Payment' },
  { value: 'safety', label: 'Safety' },
  { value: 'other', label: 'Other' },
] as const;

export default function ReportIssueScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const { isSignedIn } = useAuth();
  const createIssue = useCreateIssue();
  const [category, setCategory] = useState<(typeof categories)[number]['value']>('booking');
  const [description, setDescription] = useState('');
  const submit = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    if (description.trim().length < 10) {
      Alert.alert('Add more detail', 'Please describe the issue in at least 10 characters.');
      return;
    }
    try {
      await createIssue.mutateAsync({ data: { bookingId: params.bookingId ?? null, category, description: description.trim() } });
      Alert.alert('Report submitted', 'The Samba team can now review your service issue.', [{ text: 'Done', onPress: () => router.replace('/bookings') }]);
    } catch {
      Alert.alert('Could not submit report', 'Check your connection and try again.');
    }
  };

  return (
    <View className="flex-1 bg-paper">
      <KeyboardAwareScrollViewCompat keyboardShouldPersistTaps="handled" bottomOffset={30} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 36 }}>
        <View className="px-5">
          <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white"><Feather name="arrow-left" size={18} color="#16253F" /></Pressable>
          <View className="mt-7 h-12 w-12 items-center justify-center rounded-full bg-blush"><Feather name="flag" size={19} color="#D86D55" /></View>
          <Text className="mt-4 text-[27px] font-bold tracking-[-0.7px] text-ink">Report a service issue</Text>
          <Text className="mt-2 text-[14px] leading-6 text-smoke">Tell us what happened. Your report will be shared securely with the Samba support team.</Text>

          {!isSignedIn && <View className="mt-5 rounded-[18px] bg-[#FFF4DE] p-4"><Text className="text-[13px] font-bold text-ink">Sign in to submit a report</Text><Text className="mt-1 text-[12px] leading-5 text-smoke">Your account helps us connect the report to the right booking.</Text></View>}

          <Text className="mt-7 text-[12px] font-bold uppercase tracking-[1px] text-smoke">What is this about?</Text>
          <View className="mt-3 flex-row flex-wrap">
            {categories.map((item) => <Pressable key={item.value} onPress={() => setCategory(item.value)} className={'mb-2 mr-2 rounded-full px-4 py-2.5 ' + (category === item.value ? 'bg-banner' : 'bg-white')}><Text className={'text-[12px] font-semibold ' + (category === item.value ? 'text-white' : 'text-ink')}>{item.label}</Text></Pressable>)}
          </View>

          <Text className="mt-4 text-[12px] font-bold uppercase tracking-[1px] text-smoke">Describe what happened</Text>
          <TextInput testID="issue-description" value={description} onChangeText={setDescription} multiline maxLength={2000} textAlignVertical="top" placeholder="Share the details that will help us review this..." placeholderTextColor={colors.mutedForeground} className="mt-3 min-h-[150px] rounded-[18px] bg-white px-4 py-4 text-[14px] leading-5 text-ink" />
          <Text className="mt-2 text-right text-[11px] text-smoke">{description.length}/2000</Text>

          <Pressable testID="issue-submit" disabled={createIssue.isPending} onPress={submit} className="mt-5 flex-row items-center justify-center rounded-full bg-banner py-4 disabled:opacity-60">
            {createIssue.isPending ? <ActivityIndicator color="#FFFFFF" /> : <><Text className="text-[13px] font-bold text-white">Submit report</Text><Feather name="arrow-right" size={15} color="#FFFFFF" style={{ marginLeft: 8 }} /></>}
          </Pressable>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}
