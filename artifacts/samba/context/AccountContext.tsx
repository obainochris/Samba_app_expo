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
  profileImageUri?: string;
  portfolioUris?: string[];
};

type AccountContextValue = {
  mode: AccountMode;
  providerAccount: ProviderAccount;
  clientProfileImageUri: string;
  setMode: (mode: AccountMode) => Promise<void>;
  saveProviderAccount: (account: ProviderAccount) => Promise<void>;
  saveClientProfileImage: (uri: string) => Promise<void>;
  toggleProviderLive: () => Promise<void>;
};

const AccountContext = createContext<AccountContextValue | null>(null);
const MODE_KEY = '@samba/account-mode';
const PROVIDER_KEY = '@samba/provider-account';
const CLIENT_PROFILE_IMAGE_KEY = '@samba/client-profile-image';

const emptyProviderAccount: ProviderAccount = {
  displayName: '',
  category: 'Hair stylist',
  specialty: '',
  location: '',
  startingPrice: '',
  isLive: false,
  profileImageUri: '',
  portfolioUris: [],
};

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AccountMode>('client');
  const [providerAccount, setProviderAccount] = useState<ProviderAccount>(emptyProviderAccount);
  const [clientProfileImageUri, setClientProfileImageUri] = useState('');

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(MODE_KEY), AsyncStorage.getItem(PROVIDER_KEY), AsyncStorage.getItem(CLIENT_PROFILE_IMAGE_KEY)]).then(([storedMode, storedProvider, storedClientImage]) => {
      if (storedMode === 'client' || storedMode === 'provider') setModeState(storedMode);
      if (storedProvider) {
        const parsed = JSON.parse(storedProvider) as Partial<ProviderAccount>;
        setProviderAccount({ ...emptyProviderAccount, ...parsed, portfolioUris: Array.isArray(parsed.portfolioUris) ? parsed.portfolioUris : [] });
      }
      if (storedClientImage) setClientProfileImageUri(storedClientImage);
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

  const saveClientProfileImage = async (uri: string) => {
    setClientProfileImageUri(uri);
    await AsyncStorage.setItem(CLIENT_PROFILE_IMAGE_KEY, uri);
  };

  const toggleProviderLive = async () => {
    await saveProviderAccount({ ...providerAccount, isLive: !providerAccount.isLive });
  };

  const value = useMemo(() => ({ mode, providerAccount, clientProfileImageUri, setMode, saveProviderAccount, saveClientProfileImage, toggleProviderLive }), [mode, providerAccount, clientProfileImageUri]);
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) throw new Error('useAccount must be used inside AccountProvider');
  return context;
}