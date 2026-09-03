import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function ConversationRoute() {
  const { providerId } = useLocalSearchParams<{ providerId?: string }>();
  return <Redirect href={{ pathname: '/messages', params: { providerId: providerId ?? '' } }} />;
}