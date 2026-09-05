import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
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
  servicePrice?: string;
  location: string;
  clientAddress?: string;
  gateInstructions?: string;
  distanceKm?: number;
  travelFee?: number;
  etaMinutes?: number;
  trackingStatus?: HouseCallStatus;
  status: 'upcoming' | 'completed';
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
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value) {
        const stored = JSON.parse(value) as Booking[];
        setBookings(stored.map((booking) => ({
          ...booking,
          trackingStatus: booking.mode === 'home' ? booking.trackingStatus ?? (booking.status === 'completed' ? 'completed' : 'confirmed') : booking.trackingStatus,
        })));
      }
    });
  }, []);

  const persist = async (next: Booking[]) => {
    setBookings(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addBooking = async (booking: Omit<Booking, 'id' | 'status'>) => {
    const id = Date.now().toString();
    const next = [{ ...booking, id, status: 'upcoming' as const }, ...bookings];
    await persist(next);
    return id;
  };

  const cancelBooking = async (id: string) => {
    await persist(bookings.filter((booking) => booking.id !== id));
  };

  const updateBookingStatus = async (id: string, trackingStatus: HouseCallStatus, etaMinutes?: number) => {
    const next = bookings.map((booking) => booking.id === id
      ? { ...booking, trackingStatus, etaMinutes: etaMinutes ?? booking.etaMinutes, status: trackingStatus === 'completed' ? 'completed' as const : 'upcoming' as const }
      : booking);
    await persist(next);
  };

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