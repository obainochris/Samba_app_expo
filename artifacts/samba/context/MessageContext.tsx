import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type ChatMessage = {
  id: string;
  providerId: string;
  sender: 'client' | 'provider';
  text: string;
  createdAt: number;
};

type MessageContextValue = {
  conversations: Record<string, ChatMessage[]>;
  sendMessage: (providerId: string, text: string) => Promise<void>;
  sendProviderMessage: (providerId: string, text: string) => Promise<void>;
  markConversationRead: (providerId: string) => Promise<void>;
  unreadCounts: Record<string, number>;
  getMessages: (providerId: string) => ChatMessage[];
};

const MessageContext = createContext<MessageContextValue | null>(null);
const STORAGE_KEY = '@samba/conversations';
const UNREAD_STORAGE_KEY = '@samba/conversation-unread-counts';

function simulatedReply(text: string) {
  const normalized = text.toLowerCase();
  if (normalized.includes('house call') || normalized.includes('available')) {
    return 'Yes, I have a house-call slot today. What time works best for you, and which area will I be travelling to?';
  }
  if (normalized.includes('prep') || normalized.includes('prepare')) {
    return 'Please arrive with clean, detangled hair if possible. I can handle the final wash and treatment during your appointment.';
  }
  if (normalized.includes('price') || normalized.includes('cost')) {
    return 'I can confirm the final price once I know the exact style and length. My listed starting prices include the consultation.';
  }
  if (normalized.includes('how long') || normalized.includes('duration')) {
    return 'Most appointments take between 1 and 3 hours depending on the style. I will give you a more exact estimate before we confirm.';
  }
  return 'Thanks for reaching out. I have received your message and will get back to you shortly with the details.';
}

export function MessageProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const conversationsRef = useRef<Record<string, ChatMessage[]>>({});
  const unreadCountsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(UNREAD_STORAGE_KEY)]).then(([value, unreadValue]) => {
      const storedConversations = value ? JSON.parse(value) as Record<string, ChatMessage[]> : {};
      const storedUnreadCounts = unreadValue
        ? JSON.parse(unreadValue) as Record<string, number>
        : Object.fromEntries(
            Object.entries(storedConversations).map(([providerId, messages]) => [
              providerId,
              messages.filter((message) => message.sender === 'client').length,
            ]),
          );

      conversationsRef.current = storedConversations;
      unreadCountsRef.current = storedUnreadCounts;
      setConversations(storedConversations);
      setUnreadCounts(storedUnreadCounts);
    });
  }, []);

  const persistConversations = (next: Record<string, ChatMessage[]>) => {
    conversationsRef.current = next;
    setConversations(next);
    return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const persistUnreadCounts = (next: Record<string, number>) => {
    unreadCountsRef.current = next;
    setUnreadCounts(next);
    return AsyncStorage.setItem(UNREAD_STORAGE_KEY, JSON.stringify(next));
  };

  const appendMessage = async (message: ChatMessage, unreadCount?: number) => {
    const nextConversations = {
      ...conversationsRef.current,
      [message.providerId]: [...(conversationsRef.current[message.providerId] ?? []), message],
    };
    const writes = [persistConversations(nextConversations)];

    if (unreadCount !== undefined) {
      const nextUnreadCounts = { ...unreadCountsRef.current, [message.providerId]: unreadCount };
      writes.push(persistUnreadCounts(nextUnreadCounts));
    }

    await Promise.all(writes);
  };

  const sendMessage = useCallback(async (providerId: string, text: string) => {
    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}-client`,
      providerId,
      sender: 'client',
      text,
      createdAt: Date.now(),
    };
    const nextUnreadCount = (unreadCountsRef.current[providerId] ?? 0) + 1;
    await appendMessage(message, nextUnreadCount);

    setTimeout(() => {
      const reply: ChatMessage = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}-provider`,
        providerId,
        sender: 'provider',
        text: simulatedReply(text),
        createdAt: Date.now(),
      };
      void appendMessage(reply);
    }, 900);
  }, []);

  const sendProviderMessage = useCallback(async (providerId: string, text: string) => {
    await appendMessage({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}-provider`,
      providerId,
      sender: 'provider',
      text,
      createdAt: Date.now(),
    }, 0);
  }, []);

  const markConversationRead = useCallback(async (providerId: string) => {
    if (!unreadCountsRef.current[providerId]) return;
    await persistUnreadCounts({ ...unreadCountsRef.current, [providerId]: 0 });
  }, []);

  const getMessages = useCallback((providerId: string) => conversations[providerId] ?? [], [conversations]);
  const value = useMemo(
    () => ({ conversations, sendMessage, sendProviderMessage, markConversationRead, unreadCounts, getMessages }),
    [conversations, sendMessage, sendProviderMessage, markConversationRead, unreadCounts, getMessages],
  );

  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
}

export function useMessages() {
  const context = useContext(MessageContext);
  if (!context) throw new Error('useMessages must be used inside MessageProvider');
  return context;
}