import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Provider, providers, ServiceMode } from '@/data/providers';

export type Booking = {
  id: string;
  providerId: string;
  providerName: string;
  serviceName: string;
  date: string;
  time: string;
  mode: ServiceMode;
  price: string;
  location: string;
  status: 'upcoming' | 'completed';
};

type BookingContextValue = {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id' | 'status'>) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
};

const BookingContext = createContext<BookingContextValue | null>(null);
const STORAGE_KEY = '@samba/bookings';

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (value) setBookings(JSON.parse(value) as Booking[]);
    });
  }, []);

  const persist = async (next: Booking[]) => {
    setBookings(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addBooking = async (booking: Omit<Booking, 'id' | 'status'>) => {
    const next = [{ ...booking, id: Date.now().toString(), status: 'upcoming' as const }, ...bookings];
    await persist(next);
  };

  const cancelBooking = async (id: string) => {
    await persist(bookings.filter((booking) => booking.id !== id));
  };

  const value = useMemo(() => ({ bookings, addBooking, cancelBooking }), [bookings]);
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