import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AccountMode = 'client' | 'provider';

export type ProviderAccount = {
  displayName: string;
  category: string;
  specialty: string;
  location: string;
  startingPrice: string;
  isLive: boolean;
};

type AccountContextValue = {
  mode: AccountMode;
  providerAccount: ProviderAccount;
  setMode: (mode: AccountMode) => Promise<void>;
  saveProviderAccount: (account: ProviderAccount) => Promise<void>;
  toggleProviderLive: () => Promise<void>;
};

const AccountContext = createContext<AccountContextValue | null>(null);
const MODE_KEY = '@samba/account-mode';
const PROVIDER_KEY = '@samba/provider-account';

const emptyProviderAccount: ProviderAccount = {
  displayName: '',
  category: 'Hair stylist',
  specialty: '',
  location: '',
  startingPrice: '',
  isLive: false,
};

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AccountMode>('client');
  const [providerAccount, setProviderAccount] = useState<ProviderAccount>(emptyProviderAccount);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(MODE_KEY), AsyncStorage.getItem(PROVIDER_KEY)]).then(([storedMode, storedProvider]) => {
      if (storedMode === 'client' || storedMode === 'provider') setModeState(storedMode);
      if (storedProvider) setProviderAccount(JSON.parse(storedProvider) as ProviderAccount);
    });
  }, []);

  const setMode = async (nextMode: AccountMode) => {
    setModeState(nextMode);
    await AsyncStorage.setItem(MODE_KEY, nextMode);
  };

  const saveProviderAccount = async (account: ProviderAccount) => {
    setProviderAccount(account);
    await AsyncStorage.setItem(PROVIDER_KEY, JSON.stringify(account));
  };

  const toggleProviderLive = async () => {
    await saveProviderAccount({ ...providerAccount, isLive: !providerAccount.isLive });
  };

  const value = useMemo(() => ({ mode, providerAccount, setMode, saveProviderAccount, toggleProviderLive }), [mode, providerAccount]);
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) throw new Error('useAccount must be used inside AccountProvider');
  return context;
}