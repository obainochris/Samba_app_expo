import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/expo';
import { useQueryClient } from '@tanstack/react-query';
import {
  getListMyBookingsQueryKey,
  getListProviderBookingsQueryKey,
  useCancelBooking as useCancelSharedBooking,
  useCreateBooking,
  useListMyBookings,
  useUpdateProviderBookingTracking,
} from '@workspace/api-client-react';
import { Provider, providers, ServiceMode } from '@/data/providers';
import { HouseCallStatus } from '@/utils/house-call';

export type Booking = {
  id: string;
  providerId: string;
  providerName: string;
  serviceName: string;
  date: string;
  time: string;
  mode: ServiceMode;
  price: string;
  servicePrice?: string | null;
  location: string;
  clientAddress?: string | null;
  gateInstructions?: string | null;
  distanceKm?: number | null;
  travelFee?: number | null;
  etaMinutes?: number | null;
  trackingStatus?: HouseCallStatus | null;
  status: 'upcoming' | 'completed' | 'cancelled';
};

type BookingContextValue = {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id' | 'status'>) => Promise<string>;
  cancelBooking: (id: string) => Promise<void>;
  updateBookingStatus: (id: string, trackingStatus: HouseCallStatus, etaMinutes?: number) => Promise<void>;
};

const BookingContext = createContext<BookingContextValue | null>(null);
const STORAGE_KEY = '@samba/bookings';

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [localBookings, setLocalBookings] = useState<Booking[]>([]);
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const sharedBookingsQuery = useListMyBookings({
    query: { queryKey: getListMyBookingsQueryKey(), enabled: Boolean(isSignedIn), refetchInterval: 15_000 },
  });
  const createSharedBooking = useCreateBooking();
  const cancelSharedBooking = useCancelSharedBooking();
  const updateProviderTracking = useUpdateProviderBookingTracking();

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value) {
        const stored = JSON.parse(value) as Booking[];
        setLocalBookings(stored.map((booking) => ({
          ...booking,
          trackingStatus: booking.mode === 'home' ? booking.trackingStatus ?? (booking.status === 'completed' ? 'completed' : 'confirmed') : booking.trackingStatus,
        })));
      }
    });
  }, []);

  const persist = async (next: Booking[]) => {
    setLocalBookings(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addBooking = async (booking: Omit<Booking, 'id' | 'status'>) => {
    if (isSignedIn) {
      const created = await createSharedBooking.mutateAsync({
        data: {
          providerId: booking.providerId,
          providerName: booking.providerName,
          serviceName: booking.serviceName,
          date: booking.date,
          time: booking.time,
          mode: booking.mode,
          price: booking.price,
          servicePrice: booking.servicePrice ?? null,
          location: booking.location,
          clientAddress: booking.clientAddress ?? null,
          gateInstructions: booking.gateInstructions ?? null,
          distanceKm: booking.distanceKm ?? null,
          travelFee: booking.travelFee ?? null,
          etaMinutes: booking.etaMinutes ?? null,
          trackingStatus: booking.trackingStatus ?? null,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListMyBookingsQueryKey() });
      return created.id;
    }
    const id = Date.now().toString();
    const next = [{ ...booking, id, status: 'upcoming' as const }, ...localBookings];
    await persist(next);
    return id;
  };

  const cancelBooking = async (id: string) => {
    if (localBookings.some((booking) => booking.id === id)) {
      await persist(localBookings.filter((booking) => booking.id !== id));
      return;
    }
    if (isSignedIn) {
      await cancelSharedBooking.mutateAsync({ bookingId: id });
      await queryClient.invalidateQueries({ queryKey: getListMyBookingsQueryKey() });
    }
  };

  const updateBookingStatus = async (id: string, trackingStatus: HouseCallStatus, etaMinutes?: number) => {
    const localBooking = localBookings.find((booking) => booking.id === id);
    if (localBooking) {
      const next = localBookings.map((booking) => booking.id === id
      ? { ...booking, trackingStatus, etaMinutes: etaMinutes ?? booking.etaMinutes, status: trackingStatus === 'completed' ? 'completed' as const : 'upcoming' as const }
      : booking);
      await persist(next);
      return;
    }
    if (!isSignedIn) return;
    await updateProviderTracking.mutateAsync({ bookingId: id, data: { trackingStatus } });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getListMyBookingsQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getListProviderBookingsQueryKey() }),
    ]);
  };

  const remoteBookings = sharedBookingsQuery.data ?? [];
  const bookings = [
    ...remoteBookings,
    ...localBookings.filter((booking) => !remoteBookings.some((remote) => remote.id === booking.id)),
  ] as Booking[];

  const value = useMemo(() => ({ bookings, addBooking, cancelBooking, updateBookingStatus }), [bookings]);
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBookings() {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBookings must be used inside BookingProvider');
  return context;
}

export function getProvider(providerId: string): Provider | undefined {
  return providers.find((provider) => provider.id === providerId);
}