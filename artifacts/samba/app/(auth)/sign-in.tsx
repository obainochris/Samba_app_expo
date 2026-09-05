import { Feather } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Link, type Href, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useAuth, useSignIn, useSSO } from '@clerk/expo';
import { BrandMark } from '@/components/BrandMark';

WebBrowser.maybeCompleteAuthSession();

function getErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') return '';
  const candidate = error as { message?: string; errors?: Array<{ message?: string }> };
  return candidate.message || candidate.errors?.[0]?.message || 'Something went wrong. Please try again.';
}

export default function SignInScreen() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { signIn, errors, fetchStatus } = useSignIn();
  const { startSSOFlow } = useSSO();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (isSignedIn) router.replace('/');
  }, [isSignedIn, router]);

  const finishSignIn = useCallback(async () => {
    await signIn.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) return;
        const url = decorateUrl('/');
        router.replace(url as Href);
      },
    });
  }, [router, signIn]);

  const handleSubmit = async () => {
    setMessage('');
    const result = await signIn.password({ emailAddress: emailAddress.trim(), password });
    if (result.error) {
      setMessage(getErrorMessage(result.error));
      return;
    }

    if (signIn.status === 'complete') {
      await finishSignIn();
    } else if (signIn.status === 'needs_client_trust') {
      await signIn.mfa.sendEmailCode();
      setMessage('Check your email for a verification code, then continue in the verification flow.');
    } else if (signIn.status === 'needs_second_factor') {
      setMessage('This account needs a second factor that is not supported in this screen yet.');
    } else {
      setMessage('We need one more step to finish signing you in.');
    }
  };

  const handleGoogle = async () => {
    setMessage('');
    setGoogleLoading(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri({ scheme: 'samba' }),
      });
      if (createdSessionId) {
        await setActive!({
          session: createdSessionId,
          navigate: ({ session, decorateUrl }) => {
            if (session?.currentTask) return;
            router.replace(decorateUrl('/') as Href);
          },
        });
      } else {
        setMessage('Google sign-in needs one more step. Please try email sign-in instead.');
      }
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setGoogleLoading(false);
    }
  };

  const busy = fetchStatus === 'fetching' || googleLoading;
  const clerkMessage = errors?.fields?.identifier?.message || errors?.fields?.password?.message;

  return (
    <KeyboardAvoidingView className="flex-1 bg-paper" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center">
          <BrandMark />
          <Text className="mt-10 text-[30px] font-bold tracking-[-0.8px] text-ink">Welcome back</Text>
          <Text className="mt-2 text-[15px] leading-6 text-smoke">Sign in to keep your bookings, messages, and beauty journey together.</Text>

          <Pressable onPress={handleGoogle} disabled={busy} className="mt-8 flex-row items-center justify-center rounded-2xl border border-line bg-white py-4 active:opacity-75">
            {googleLoading ? <ActivityIndicator color="#2D6CDF" /> : <><Feather name="globe" size={17} color="#2D6CDF" /><Text className="ml-2 text-[14px] font-bold text-ink">Continue with Google</Text></>}
          </Pressable>
          <View className="my-6 flex-row items-center"><View className="h-px flex-1 bg-line" /><Text className="mx-3 text-[12px] font-semibold uppercase tracking-[1px] text-smoke">or email</Text><View className="h-px flex-1 bg-line" /></View>

          <Text className="mb-2 text-[12px] font-bold uppercase tracking-[1px] text-smoke">Email address</Text>
          <TextInput value={emailAddress} onChangeText={setEmailAddress} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="you@example.com" placeholderTextColor="#9AA5B5" className="rounded-2xl border border-line bg-white px-4 py-4 text-[15px] text-ink" />
          <Text className="mb-2 mt-5 text-[12px] font-bold uppercase tracking-[1px] text-smoke">Password</Text>
          <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Your password" placeholderTextColor="#9AA5B5" className="rounded-2xl border border-line bg-white px-4 py-4 text-[15px] text-ink" />

          {(message || clerkMessage) && <Text className="mt-4 rounded-xl bg-[#FFF1F0] px-3 py-3 text-[13px] leading-5 text-[#B5463E]">{message || clerkMessage}</Text>}
          <Pressable onPress={handleSubmit} disabled={!emailAddress || !password || busy} className={'mt-6 items-center rounded-full py-4 ' + (emailAddress && password && !busy ? 'bg-banner active:opacity-80' : 'bg-[#B8C7DD]')}>
            {fetchStatus === 'fetching' ? <ActivityIndicator color="#FFFFFF" /> : <Text className="text-[14px] font-bold text-white">Sign in</Text>}
          </Pressable>
        </View>
        <View className="flex-row justify-center pb-3 pt-8"><Text className="text-[13px] text-smoke">New to Samba? </Text><Link href={'/sign-up' as Href} asChild><Pressable><Text className="text-[13px] font-bold text-banner">Create an account</Text></Pressable></Link></View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}