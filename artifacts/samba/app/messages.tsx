import { Feather, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark } from '@/components/BrandMark';
import { getProvider } from '@/context/BookingContext';
import { useMessages } from '@/context/MessageContext';
import { providers } from '@/data/providers';

const prompts = ['Are you available for a house call today?', 'What hair prep is needed?', 'How long will the appointment take?'];

function ConsultationChat({ providerId }: { providerId: string }) {
  const provider = getProvider(providerId);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getMessages, sendMessage } = useMessages();
  const messages = getMessages(providerId);
  const [draft, setDraft] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);

  if (!provider) return <View className="flex-1 items-center justify-center bg-paper"><Text className="text-ink">Provider not found</Text></View>;

  const submit = async (text = draft) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;
    setDraft('');
    setIsTyping(true);
    await sendMessage(provider.id, trimmed);
    setTimeout(() => setIsTyping(false), 1150);
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-paper" behavior="padding">
      <View className="flex-1" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center border-b border-line bg-paper px-5 pb-4 pt-2">
          <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-70"><Feather name="arrow-left" size={19} color="#16253F" /></Pressable>
          <Image source={provider.image} className="ml-3 h-11 w-11 rounded-full" resizeMode="cover" />
          <View className="ml-3 flex-1"><Text className="text-[16px] font-bold text-ink">{provider.name}</Text><View className="mt-0.5 flex-row items-center"><View className="mr-1.5 h-2 w-2 rounded-full bg-[#39A66B]" /><Text className="text-[11px] text-smoke">Usually replies quickly</Text></View></View>
          <Pressable onPress={() => router.push({ pathname: '/provider/[id]', params: { id: provider.id } })} className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-70"><Feather name="calendar" size={17} color="#2D6CDF" /></Pressable>
        </View>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 16, flexGrow: 1 }}
          ListHeaderComponent={<View className="mb-5 items-center"><View className="h-12 w-12 items-center justify-center rounded-full bg-blush"><Ionicons name="chatbubbles-outline" size={21} color="#2D6CDF" /></View><Text className="mt-3 text-[15px] font-bold text-ink">Chat with {provider.firstName}</Text><Text className="mt-1 text-center text-[12px] leading-5 text-smoke">Ask about availability, service prep, or finding the right appointment.</Text></View>}
          ListEmptyComponent={<View className="rounded-[18px] bg-white p-4"><Text className="text-[12px] font-semibold leading-5 text-smoke">Start with a consultation prompt below, or type your own question.</Text></View>}
          renderItem={({ item }) => <View className={'mb-3 max-w-[84%] rounded-[19px] px-4 py-3 ' + (item.sender === 'client' ? 'self-end rounded-br-md bg-banner' : 'self-start rounded-bl-md bg-white')}><Text className={'text-[13px] leading-5 ' + (item.sender === 'client' ? 'text-white' : 'text-ink')}>{item.text}</Text><Text className={'mt-1 text-[10px] ' + (item.sender === 'client' ? 'text-[#DCE8FF]' : 'text-smoke')}>{new Date(item.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text></View>}
        />
        {isTyping && <View className="px-5 pb-2"><Text className="text-[11px] italic text-smoke">{provider.firstName} is typing...</Text></View>}
        <View className="border-t border-line bg-paper pb-3 pt-3">
          <FlatList horizontal data={prompts} keyExtractor={(item) => item} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }} renderItem={({ item }) => <Pressable disabled={isTyping} onPress={() => submit(item)} className="mr-2 rounded-full border border-line bg-white px-3.5 py-2.5 active:opacity-70"><Text className="text-[11px] font-semibold text-ink">{item}</Text></Pressable>} />
          <View className="mt-3 flex-row items-end px-5"><TextInput value={draft} onChangeText={setDraft} placeholder="Write a message..." placeholderTextColor="#A8B2C1" multiline maxLength={500} className="max-h-[96px] flex-1 rounded-[18px] bg-white px-4 py-3 text-[13px] text-ink" /><Pressable onPress={() => submit()} disabled={!draft.trim() || isTyping} className={'ml-2 h-11 w-11 items-center justify-center rounded-full ' + (draft.trim() && !isTyping ? 'bg-banner' : 'bg-cream')}><Feather name="send" size={17} color={draft.trim() && !isTyping ? '#FFFFFF' : '#A8B2C1'} /></Pressable></View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { providerId } = useLocalSearchParams<{ providerId?: string }>();
  const { conversations } = useMessages();
  const conversationProviders = providers.filter((provider) => conversations[provider.id]?.length);

  if (providerId) return <ConsultationChat providerId={providerId} />;

  return (
    <View className="flex-1 bg-paper">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: 36 }}>
        <View className="px-5">
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white active:opacity-70">
              <Feather name="arrow-left" size={19} color="#16253F" />
            </Pressable>
            <BrandMark compact />
          </View>
          <Text className="mt-8 text-[29px] font-bold tracking-[-0.8px] text-ink">Messages</Text>
          <Text className="mt-1 text-[15px] text-smoke">Ask a pro anything before you book.</Text>

          {conversationProviders.length > 0 ? (
            <View className="mt-7">
              {conversationProviders.map((provider) => {
                const messages = conversations[provider.id] ?? [];
                const lastMessage = messages[messages.length - 1];
                return (
                  <Pressable key={provider.id} onPress={() => router.push({ pathname: '/messages/[providerId]', params: { providerId: provider.id } })} className="mb-3 flex-row items-center rounded-[22px] bg-white p-3 active:opacity-80">
                    <Image source={provider.image} className="h-14 w-14 rounded-[17px]" resizeMode="cover" />
                    <View className="ml-3 flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-[15px] font-bold text-ink">{provider.name}</Text>
                        <Text className="text-[10px] text-smoke">{lastMessage ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}</Text>
                      </View>
                      <Text className="mt-1 text-[12px] text-smoke" numberOfLines={1}>{lastMessage?.text}</Text>
                    </View>
                    <Feather name="chevron-right" size={17} color="#A8B2C1" style={{ marginLeft: 8 }} />
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View className="mt-10 items-center rounded-[24px] bg-white px-6 py-12">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-blush"><Ionicons name="chatbubbles-outline" size={25} color="#2D6CDF" /></View>
              <Text className="mt-4 text-[17px] font-bold text-ink">No conversations yet</Text>
              <Text className="mt-1 text-center text-[13px] leading-5 text-smoke">Open a provider profile to ask a question about their availability, prep, or services.</Text>
              <Pressable onPress={() => router.push('/explore')} className="mt-5 rounded-full bg-banner px-5 py-3 active:opacity-80"><Text className="text-[12px] font-bold text-white">Find a provider</Text></Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}