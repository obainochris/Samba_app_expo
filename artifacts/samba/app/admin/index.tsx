import { Feather, Ionicons } from '@expo/vector-icons';
import {
  getGetAdminOverviewQueryKey,
  getGetAdminAccessQueryKey,
  getListAdminBookingsQueryKey,
  getListAdminClientsQueryKey,
  getListAdminIssuesQueryKey,
  getListAdminProvidersQueryKey,
  getListMyBookingsQueryKey,
  getListMarketplaceProvidersQueryKey,
  useGetAdminAccess,
  useGetAdminOverview,
  useListAdminBookings,
  useListAdminClients,
  useListAdminIssues,
  useListAdminProviders,
  useUpdateAdminBooking,
  useUpdateAdminClient,
  useUpdateAdminIssue,
  useUpdateAdminProvider,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const sections = [
  { id: 'overview', label: 'Overview', icon: 'bar-chart-2' as const },
  { id: 'providers', label: 'Providers', icon: 'scissors' as const },
  { id: 'clients', label: 'Clients', icon: 'users' as const },
  { id: 'bookings', label: 'Bookings', icon: 'calendar' as const },
  { id: 'issues', label: 'Issues', icon: 'flag' as const },
] as const;

type AdminSection = typeof sections[number]['id'];
type ProviderProfileDraft = Partial<{
  name: string;
  specialty: string;
  location: string;
  price: string;
  bio: string;
}>;

function metricLabel(value: number | undefined) {
  return (value ?? 0).toLocaleString('en-NG');
}

export default function AdminPanelScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isSignedIn } = useAuth();
  const [section, setSection] = useState<AdminSection>('overview');
  const [ownerDrafts, setOwnerDrafts] = useState<Record<string, string>>({});
  const [providerDrafts, setProviderDrafts] = useState<Record<string, ProviderProfileDraft>>({});
  const access = useGetAdminAccess({ query: { queryKey: getGetAdminAccessQueryKey(), enabled: Boolean(isSignedIn), retry: false } });
  const isAdmin = access.data?.isAdmin === true;
  const overview = useGetAdminOverview({ query: { queryKey: getGetAdminOverviewQueryKey(), enabled: isAdmin && section === 'overview' } });
  const providerQuery = useListAdminProviders({ query: { queryKey: getListAdminProvidersQueryKey(), enabled: isAdmin && section === 'providers' } });
  const clientQuery = useListAdminClients({ query: { queryKey: getListAdminClientsQueryKey(), enabled: isAdmin && (section === 'clients' || section === 'providers') } });
  const bookingQuery = useListAdminBookings({ query: { queryKey: getListAdminBookingsQueryKey(), enabled: isAdmin && section === 'bookings' } });
  const issueQuery = useListAdminIssues({ query: { queryKey: getListAdminIssuesQueryKey(), enabled: isAdmin && section === 'issues' } });
  const updateProvider = useUpdateAdminProvider();
  const updateClient = useUpdateAdminClient();
  const updateBooking = useUpdateAdminBooking();
  const updateIssue = useUpdateAdminIssue();

  const refresh = async (...keys: (readonly unknown[])[]) => {
    await Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
  };
  const runAdminAction = (action: () => Promise<void>) => {
    void action().catch(() => Alert.alert('Could not save changes', 'Check your connection and try again.'));
  };

  const changeProviderApproval = async (providerId: string, approvalStatus: 'approved' | 'rejected') => {
    await updateProvider.mutateAsync({ providerId, data: { approvalStatus } });
    await refresh(getListAdminProvidersQueryKey(), getListMarketplaceProvidersQueryKey(), getGetAdminOverviewQueryKey());
  };

  const changeProviderLive = async (providerId: string, isLive: boolean) => {
    await updateProvider.mutateAsync({ providerId, data: { isLive } });
    await refresh(getListAdminProvidersQueryKey(), getListMarketplaceProvidersQueryKey(), getGetAdminOverviewQueryKey());
  };

  const saveProviderProfile = async (providerId: string) => {
    const provider = providerQuery.data?.find((item) => item.id === providerId);
    if (!provider) return;
    const draft = providerDrafts[providerId] ?? {};
    await updateProvider.mutateAsync({
      providerId,
      data: {
        name: (draft.name ?? provider.name).trim(),
        firstName: (draft.name ?? provider.name).trim().split(/\s+/)[0] ?? provider.firstName,
        specialty: (draft.specialty ?? provider.specialty).trim(),
        location: (draft.location ?? provider.location).trim(),
        price: (draft.price ?? provider.price).trim(),
        bio: (draft.bio ?? provider.bio).trim(),
      },
    });
    await refresh(getListAdminProvidersQueryKey(), getListMarketplaceProvidersQueryKey());
  };

  const toggleProviderAvailability = async (providerId: string, availableToday: boolean) => {
    await updateProvider.mutateAsync({ providerId, data: { availableToday } });
    await refresh(getListAdminProvidersQueryKey(), getListMarketplaceProvidersQueryKey());
  };

  const saveOwner = async (providerId: string) => {
    const ownerUserId = ownerDrafts[providerId]?.trim() || null;
    await updateProvider.mutateAsync({ providerId, data: { ownerUserId } });
    await refresh(getListAdminProvidersQueryKey());
    Alert.alert('Provider owner updated', ownerUserId ? 'The assigned account can manage this provider’s house calls.' : 'The provider is now unassigned.');
  };

  const setClientBanned = (userId: string, email: string, banned: boolean) => {
    Alert.alert(
      banned ? 'Suspend this account?' : 'Restore this account?',
      banned ? `${email || 'This account'} will be blocked from signing in to Samba.` : `${email || 'This account'} will be allowed to sign in again.`,
      [
        { text: 'Keep account', style: 'cancel' },
        {
          text: banned ? 'Suspend account' : 'Restore account',
          style: banned ? 'destructive' : 'default',
          onPress: () => runAdminAction(async () => {
            await updateClient.mutateAsync({ userId, data: { banned } });
            await refresh(getListAdminClientsQueryKey(), getGetAdminOverviewQueryKey());
          }),
        },
      ],
    );
  };

  const setBookingStatus = (bookingId: string, status: 'completed' | 'cancelled') => {
    const update = async () => {
      await updateBooking.mutateAsync({ bookingId, data: { status, ...(status === 'completed' ? { trackingStatus: 'completed' } : {}) } });
      await refresh(getListAdminBookingsQueryKey(), getGetAdminOverviewQueryKey(), getListMyBookingsQueryKey());
    };
    if (status === 'cancelled') {
      Alert.alert('Cancel this booking?', 'The client’s shared booking record will be marked cancelled.', [
        { text: 'Keep booking', style: 'cancel' },
        { text: 'Cancel booking', style: 'destructive', onPress: update },
      ]);
    } else {
      runAdminAction(update);
    }
  };

  const setIssueStatus = async (issueId: string, status: 'reviewing' | 'resolved') => {
    await updateIssue.mutateAsync({ issueId, data: { status } });
    await refresh(getListAdminIssuesQueryKey(), getGetAdminOverviewQueryKey());
  };

  if (!isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center bg-paper px-7">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-[#EAF2FF]"><Feather name="shield" size={23} color="#2D6CDF" /></View>
        <Text className="mt-4 text-[19px] font-bold text-ink">Admin sign-in required</Text>
        <Text className="mt-2 text-center text-[13px] leading-5 text-smoke">Sign in with the authorized Samba administrator account to continue.</Text>
        <Pressable onPress={() => router.push('/sign-in')} className="mt-5 rounded-full bg-banner px-5 py-3"><Text className="text-[13px] font-bold text-white">Sign in</Text></Pressable>
      </View>
    );
  }

  if (access.isLoading) {
    return <View className="flex-1 items-center justify-center bg-paper"><ActivityIndicator color="#2D6CDF" /><Text className="mt-3 text-[13px] text-smoke">Checking admin access…</Text></View>;
  }

  if (!isAdmin) {
    return (
      <View className="flex-1 items-center justify-center bg-paper px-7">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-cream"><Feather name="lock" size={22} color="#68758A" /></View>
        <Text className="mt-4 text-[19px] font-bold text-ink">Admin access restricted</Text>
        <Text className="mt-2 text-center text-[13px] leading-5 text-smoke">This account does not have Samba administrator access.</Text>
        <Pressable onPress={() => router.replace('/profile')} className="mt-5 rounded-full bg-banner px-5 py-3"><Text className="text-[13px] font-bold text-white">Back to profile</Text></Pressable>
      </View>
    );
  }

  const loading = section === 'overview' ? overview.isLoading
    : section === 'providers' ? providerQuery.isLoading
    : section === 'clients' ? clientQuery.isLoading
    : section === 'bookings' ? bookingQuery.isLoading
    : issueQuery.isLoading;

  return (
    <View className="flex-1 bg-paper">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 36 }}>
        <View className="px-5">
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => router.replace('/profile')} className="h-10 w-10 items-center justify-center rounded-full bg-white"><Feather name="arrow-left" size={18} color="#16253F" /></Pressable>
            <View className="items-center"><Text className="text-[11px] font-bold uppercase tracking-[1px] text-banner">Samba</Text><Text className="mt-0.5 text-[17px] font-bold text-ink">Admin panel</Text></View>
            <View className="h-10 w-10 items-center justify-center rounded-full bg-[#EAF2FF]"><Feather name="shield" size={17} color="#2D6CDF" /></View>
          </View>

          <View className="mt-5 flex-row rounded-[18px] bg-white p-1">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {sections.map((item) => {
                const active = section === item.id;
                return <Pressable key={item.id} testID={`admin-tab-${item.id}`} onPress={() => setSection(item.id)} className={'mr-1 flex-row items-center rounded-[14px] px-3.5 py-3 ' + (active ? 'bg-banner' : '')}><Feather name={item.icon} size={14} color={active ? '#FFFFFF' : colors.mutedForeground} /><Text className={'ml-1.5 text-[12px] font-bold ' + (active ? 'text-white' : 'text-smoke')}>{item.label}</Text></Pressable>;
              })}
            </ScrollView>
          </View>

          {loading ? <View className="items-center py-12"><ActivityIndicator color="#2D6CDF" /><Text className="mt-3 text-[13px] text-smoke">Loading shared data…</Text></View> : null}

          {section === 'overview' && !loading && overview.data && (
            <>
              <Text className="mt-6 text-[22px] font-bold text-ink">Marketplace overview</Text>
              <Text className="mt-1 text-[13px] text-smoke">Live account, provider, booking, and issue totals.</Text>
              <View className="mt-4 flex-row flex-wrap justify-between">
                {[
                  { label: 'Client accounts', value: metricLabel(overview.data.clientCount), icon: 'users' as const },
                  { label: 'Provider profiles', value: metricLabel(overview.data.providerCount), icon: 'scissors' as const },
                  { label: 'Awaiting approval', value: metricLabel(overview.data.pendingProviderCount), icon: 'clock' as const },
                  { label: 'Upcoming bookings', value: metricLabel(overview.data.upcomingBookingCount), icon: 'calendar' as const },
                  { label: 'Completed bookings', value: metricLabel(overview.data.completedBookingCount), icon: 'check-circle' as const },
                  { label: 'Open issues', value: metricLabel(overview.data.openIssueCount), icon: 'flag' as const },
                ].map((item) => <View key={item.label} className="mb-3 w-[48%] rounded-[19px] bg-white p-4"><Feather name={item.icon} size={17} color="#2D6CDF" /><Text className="mt-3 text-[22px] font-bold text-ink">{item.value}</Text><Text className="mt-1 text-[11px] text-smoke">{item.label}</Text></View>)}
              </View>
              <View className="mt-1 rounded-[20px] bg-banner p-5"><Text className="text-[11px] font-bold uppercase tracking-[1px] text-[#D7E5FF]">Completed booking value</Text><Text className="mt-2 text-[25px] font-bold text-white">₦{metricLabel(overview.data.grossRevenueNaira)}</Text><Text className="mt-1 text-[12px] text-[#E3EDFF]">Based on completed bookings recorded in Samba.</Text></View>
            </>
          )}

          {section === 'providers' && !loading && (
            <>
              <Text className="mt-6 text-[22px] font-bold text-ink">Provider profiles</Text>
              <Text className="mt-1 text-[13px] text-smoke">Review listings, visibility, and provider account ownership.</Text>
              {(providerQuery.data ?? []).map((provider) => <View key={provider.id} className="mt-3 rounded-[20px] bg-white p-4">
                <View className="flex-row items-start justify-between"><View className="flex-1"><Text className="text-[15px] font-bold text-ink">{provider.name}</Text><Text className="mt-1 text-[12px] text-smoke">{provider.category} · {provider.specialty}</Text><Text className="mt-1 text-[11px] text-smoke">{provider.location} · from {provider.price}</Text></View><View className={'rounded-full px-2.5 py-1 ' + (provider.approvalStatus === 'approved' ? 'bg-[#E6F0EA]' : provider.approvalStatus === 'pending' ? 'bg-[#FFF4DE]' : 'bg-[#FFF1F0]')}><Text className="text-[10px] font-bold uppercase text-ink">{provider.approvalStatus}</Text></View></View>
                <View className="mt-3 flex-row">
                  <Pressable testID={`provider-approval-${provider.id}`} onPress={() => runAdminAction(() => changeProviderApproval(provider.id, provider.approvalStatus === 'approved' ? 'rejected' : 'approved'))} className="mr-2 flex-1 items-center rounded-full bg-banner py-2.5"><Text className="text-[11px] font-bold text-white">{provider.approvalStatus === 'approved' ? 'Reject profile' : 'Approve profile'}</Text></Pressable>
                  <Pressable onPress={() => runAdminAction(() => changeProviderLive(provider.id, !provider.isLive))} className="flex-1 items-center rounded-full bg-cream py-2.5"><Text className="text-[11px] font-bold text-ink">{provider.isLive ? 'Take offline' : 'Put online'}</Text></Pressable>
                </View>
                <Pressable onPress={() => runAdminAction(() => toggleProviderAvailability(provider.id, !provider.availableToday))} className="mt-3 self-start"><Text className="text-[11px] font-bold text-banner">{provider.availableToday ? 'Mark unavailable today' : 'Mark available today'}</Text></Pressable>
                <Text className="mb-1 mt-4 text-[10px] font-bold uppercase tracking-[0.7px] text-smoke">Public listing details</Text>
                <TextInput value={providerDrafts[provider.id]?.name ?? provider.name} onChangeText={(value) => setProviderDrafts((current) => ({ ...current, [provider.id]: { ...current[provider.id], name: value } }))} placeholder="Provider name" placeholderTextColor="#A8B2C1" className="mb-2 rounded-[12px] bg-cream px-3 py-2.5 text-[12px] text-ink" />
                <TextInput value={providerDrafts[provider.id]?.specialty ?? provider.specialty} onChangeText={(value) => setProviderDrafts((current) => ({ ...current, [provider.id]: { ...current[provider.id], specialty: value } }))} placeholder="Specialty" placeholderTextColor="#A8B2C1" className="mb-2 rounded-[12px] bg-cream px-3 py-2.5 text-[12px] text-ink" />
                <View className="flex-row">
                  <TextInput value={providerDrafts[provider.id]?.location ?? provider.location} onChangeText={(value) => setProviderDrafts((current) => ({ ...current, [provider.id]: { ...current[provider.id], location: value } }))} placeholder="Location" placeholderTextColor="#A8B2C1" className="mr-2 flex-1 rounded-[12px] bg-cream px-3 py-2.5 text-[12px] text-ink" />
                  <TextInput value={providerDrafts[provider.id]?.price ?? provider.price} onChangeText={(value) => setProviderDrafts((current) => ({ ...current, [provider.id]: { ...current[provider.id], price: value } }))} placeholder="Starting price" placeholderTextColor="#A8B2C1" className="w-[120px] rounded-[12px] bg-cream px-3 py-2.5 text-[12px] text-ink" />
                </View>
                <TextInput value={providerDrafts[provider.id]?.bio ?? provider.bio} onChangeText={(value) => setProviderDrafts((current) => ({ ...current, [provider.id]: { ...current[provider.id], bio: value } }))} placeholder="Provider bio" placeholderTextColor="#A8B2C1" multiline maxLength={2000} textAlignVertical="top" className="mt-2 min-h-[82px] rounded-[12px] bg-cream px-3 py-2.5 text-[12px] text-ink" />
                <Pressable testID={`provider-save-profile-${provider.id}`} onPress={() => runAdminAction(() => saveProviderProfile(provider.id))} className="mt-2 self-start"><Text className="text-[11px] font-bold text-banner">Save listing details</Text></Pressable>
                <Text className="mb-1 mt-4 text-[10px] font-bold uppercase tracking-[0.7px] text-smoke">Linked provider account ID</Text>
                <TextInput value={ownerDrafts[provider.id] ?? provider.ownerUserId ?? ''} onChangeText={(value) => setOwnerDrafts((current) => ({ ...current, [provider.id]: value }))} placeholder="Paste a client account ID from the Clients tab" placeholderTextColor="#A8B2C1" autoCapitalize="none" className="rounded-[12px] bg-cream px-3 py-2.5 text-[11px] text-ink" />
                <Pressable testID={`provider-save-owner-${provider.id}`} onPress={() => runAdminAction(() => saveOwner(provider.id))} className="mt-2 self-start"><Text className="text-[11px] font-bold text-banner">Save provider assignment</Text></Pressable>
              </View>)}
              {providerQuery.isError && <Text className="mt-4 text-[13px] text-terracotta">Could not load provider profiles. Refresh and try again.</Text>}
            </>
          )}

          {section === 'clients' && !loading && (
            <>
              <Text className="mt-6 text-[22px] font-bold text-ink">Client accounts</Text>
              <Text className="mt-1 text-[13px] text-smoke">Account actions are applied through Clerk.</Text>
              {(clientQuery.data ?? []).map((client) => <View key={client.id} className="mt-3 flex-row items-center rounded-[19px] bg-white p-3">
                {client.imageUrl ? <Image source={{ uri: client.imageUrl }} style={{ width: 42, height: 42, borderRadius: 21 }} /> : <View className="h-[42px] w-[42px] items-center justify-center rounded-full bg-cream"><Ionicons name="person" size={17} color="#2D6CDF" /></View>}
                <View className="ml-3 flex-1"><Text className="text-[13px] font-bold text-ink">{[client.firstName, client.lastName].filter(Boolean).join(' ') || 'Samba client'}</Text><Text className="mt-0.5 text-[11px] text-smoke">{client.email || 'No email address'}</Text><Text selectable className="mt-1 text-[9px] text-smoke">Account ID: {client.id}</Text></View>
                <Pressable testID={`client-access-${client.id}`} onPress={() => setClientBanned(client.id, client.email, !client.banned)} className={'rounded-full px-3 py-2 ' + (client.banned ? 'bg-[#E6F0EA]' : 'bg-[#FFF1F0]')}><Text className={'text-[10px] font-bold ' + (client.banned ? 'text-[#567A63]' : 'text-terracotta')}>{client.banned ? 'Restore' : 'Suspend'}</Text></Pressable>
              </View>)}
              {clientQuery.isError && <Text className="mt-4 text-[13px] text-terracotta">Could not load client accounts. Refresh and try again.</Text>}
            </>
          )}

          {section === 'bookings' && !loading && (
            <>
              <Text className="mt-6 text-[22px] font-bold text-ink">Bookings</Text>
              <Text className="mt-1 text-[13px] text-smoke">Recent shared appointments across clients.</Text>
              {(bookingQuery.data ?? []).map((booking) => <View key={booking.id} className="mt-3 rounded-[19px] bg-white p-4">
                <View className="flex-row items-start justify-between"><View className="flex-1"><Text className="text-[14px] font-bold text-ink">{booking.serviceName}</Text><Text className="mt-1 text-[12px] text-smoke">{booking.clientName} · {booking.clientEmail}</Text><Text className="mt-1 text-[11px] text-smoke">with {booking.providerName} · {booking.date} · {booking.time}</Text>{booking.mode === 'home' && <Text className="mt-1 text-[11px] text-smoke">House call · {booking.clientAddress}</Text>}</View><Text className="ml-2 text-[12px] font-bold text-terracotta">{booking.price}</Text></View>
                <View className="mt-3 flex-row items-center justify-between"><View className="rounded-full bg-cream px-2.5 py-1.5"><Text className="text-[10px] font-bold uppercase text-ink">{booking.status}</Text></View>{booking.status === 'upcoming' && <View className="flex-row"><Pressable testID={`booking-complete-${booking.id}`} onPress={() => setBookingStatus(booking.id, 'completed')} className="mr-2 rounded-full bg-banner px-3 py-2"><Text className="text-[10px] font-bold text-white">Complete</Text></Pressable><Pressable testID={`booking-cancel-${booking.id}`} onPress={() => setBookingStatus(booking.id, 'cancelled')} className="rounded-full bg-[#FFF1F0] px-3 py-2"><Text className="text-[10px] font-bold text-terracotta">Cancel</Text></Pressable></View>}</View>
              </View>)}
              {bookingQuery.isError && <Text className="mt-4 text-[13px] text-terracotta">Could not load bookings. Refresh and try again.</Text>}
              {(bookingQuery.data?.length ?? 0) === 0 && !bookingQuery.isError && <Text className="mt-5 rounded-[18px] bg-white p-5 text-[13px] text-smoke">No shared bookings yet. Signed-in clients’ new bookings will appear here.</Text>}
            </>
          )}

          {section === 'issues' && !loading && (
            <>
              <Text className="mt-6 text-[22px] font-bold text-ink">Service issues</Text>
              <Text className="mt-1 text-[13px] text-smoke">Triage and resolve issues submitted by signed-in clients.</Text>
              {(issueQuery.data ?? []).map((issue) => <View key={issue.id} className="mt-3 rounded-[19px] bg-white p-4">
                <View className="flex-row items-center justify-between"><Text className="text-[12px] font-bold uppercase tracking-[0.7px] text-banner">{issue.category}</Text><View className="rounded-full bg-cream px-2.5 py-1"><Text className="text-[10px] font-bold uppercase text-ink">{issue.status}</Text></View></View>
                <Text className="mt-3 text-[13px] leading-5 text-ink">{issue.description}</Text>
                <Text className="mt-2 text-[11px] text-smoke">{issue.clientEmail}{issue.bookingId ? ` · Booking ${issue.bookingId.slice(0, 8)}` : ''}</Text>
                {issue.status !== 'resolved' && <View className="mt-3 flex-row"><Pressable testID={`issue-review-${issue.id}`} onPress={() => runAdminAction(() => setIssueStatus(issue.id, 'reviewing'))} className="mr-2 rounded-full bg-cream px-3 py-2"><Text className="text-[10px] font-bold text-ink">Mark reviewing</Text></Pressable><Pressable testID={`issue-resolve-${issue.id}`} onPress={() => runAdminAction(() => setIssueStatus(issue.id, 'resolved'))} className="rounded-full bg-banner px-3 py-2"><Text className="text-[10px] font-bold text-white">Resolve issue</Text></Pressable></View>}
              </View>)}
              {issueQuery.isError && <Text className="mt-4 text-[13px] text-terracotta">Could not load service issues. Refresh and try again.</Text>}
              {(issueQuery.data?.length ?? 0) === 0 && !issueQuery.isError && <Text className="mt-5 rounded-[18px] bg-white p-5 text-[13px] text-smoke">No service issues have been reported.</Text>}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
