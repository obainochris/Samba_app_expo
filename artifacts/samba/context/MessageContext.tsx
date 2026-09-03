import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

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
  getMessages: (providerId: string) => ChatMessage[];
};

const MessageContext = createContext<MessageContextValue | null>(null);
const STORAGE_KEY = '@samba/conversations';

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

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value) setConversations(JSON.parse(value) as Record<string, ChatMessage[]>);
    });
  }, []);

  const persist = (next: Record<string, ChatMessage[]>) => {
    setConversations(next);
    return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const sendMessage = async (providerId: string, text: string) => {
    const message: ChatMessage = {
      id: `${Date.now()}-client`,
      providerId,
      sender: 'client',
      text,
      createdAt: Date.now(),
    };
    const next = { ...conversations, [providerId]: [...(conversations[providerId] ?? []), message] };
    await persist(next);

    setTimeout(() => {
      const reply: ChatMessage = {
        id: `${Date.now()}-provider`,
        providerId,
        sender: 'provider',
        text: simulatedReply(text),
        createdAt: Date.now(),
      };
      setConversations((current) => {
        const updated = { ...current, [providerId]: [...(current[providerId] ?? []), reply] };
        void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }, 900);
  };

  const getMessages = (providerId: string) => conversations[providerId] ?? [];
  const value = useMemo(() => ({ conversations, sendMessage, getMessages }), [conversations]);

  return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
}

export function useMessages() {
  const context = useContext(MessageContext);
  if (!context) throw new Error('useMessages must be used inside MessageProvider');
  return context;
}