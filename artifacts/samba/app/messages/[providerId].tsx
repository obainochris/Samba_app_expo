import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function ConversationRoute() {
  const { providerId, mode } = useLocalSearchParams<{ providerId?: string; mode?: 'client' | 'provider' }>();
  return <Redirect href={{ pathname: '/messages', params: { providerId: providerId ?? '', mode: mode ?? 'client' } }} />;
}