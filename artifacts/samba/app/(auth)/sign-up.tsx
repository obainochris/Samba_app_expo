import { Feather } from '@expo/vector-icons';
import { Link, type Href, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useAuth, useSignUp } from '@clerk/expo';
import { BrandMark } from '@/components/BrandMark';

function getErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') return '';
  const candidate = error as { message?: string; errors?: Array<{ message?: string }> };
  return candidate.message || candidate.errors?.[0]?.message || 'Something went wrong. Please try again.';
}

export default function SignUpScreen() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { signUp, errors, fetchStatus } = useSignUp();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isSignedIn) router.replace('/');
  }, [isSignedIn, router]);

  const finishSignUp = async () => {
    await signUp.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) return;
        router.replace(decorateUrl('/') as Href);
      },
    });
  };

  const handleSubmit = async () => {
    setMessage('');
    const result = await signUp.password({ emailAddress: emailAddress.trim(), password });
    if (result.error) {
      setMessage(getErrorMessage(result.error));
      return;
    }
    const codeResult = await signUp.verifications.sendEmailCode();
    if (codeResult.error) {
      setMessage(getErrorMessage(codeResult.error));
      return;
    }
    setVerificationSent(true);
  };

  const handleVerify = async () => {
    setMessage('');
    const result = await signUp.verifications.verifyEmailCode({ code: code.trim() });
    if (result.error) {
      setMessage(getErrorMessage(result.error));
      return;
    }
    if (signUp.status === 'complete') {
      await finishSignUp();
    } else {
      setMessage('Your account needs one more step before it is ready.');
    }
  };

  const busy = fetchStatus === 'fetching';
  const clerkMessage = errors?.fields?.emailAddress?.message || errors?.fields?.password?.message || errors?.fields?.code?.message;

  return (
    <KeyboardAvoidingView className="flex-1 bg-paper" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center">
          <BrandMark />
          <Text className="mt-10 text-[30px] font-bold tracking-[-0.8px] text-ink">Join Samba</Text>
          <Text className="mt-2 text-[15px] leading-6 text-smoke">Create one account for appointments, provider conversations, and your saved beauty plans.</Text>

          {!verificationSent ? (
            <>
              <Text className="mb-2 mt-8 text-[12px] font-bold uppercase tracking-[1px] text-smoke">Email address</Text>
              <TextInput value={emailAddress} onChangeText={setEmailAddress} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" placeholder="you@example.com" placeholderTextColor="#9AA5B5" className="rounded-2xl border border-line bg-white px-4 py-4 text-[15px] text-ink" />
              <Text className="mb-2 mt-5 text-[12px] font-bold uppercase tracking-[1px] text-smoke">Password</Text>
              <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="At least 8 characters" placeholderTextColor="#9AA5B5" className="rounded-2xl border border-line bg-white px-4 py-4 text-[15px] text-ink" />
              <View nativeID="clerk-captcha" />
              {(message || clerkMessage) && <Text className="mt-4 rounded-xl bg-[#FFF1F0] px-3 py-3 text-[13px] leading-5 text-[#B5463E]">{message || clerkMessage}</Text>}
              <Pressable onPress={handleSubmit} disabled={!emailAddress || !password || busy} className={'mt-6 flex-row items-center justify-center rounded-full py-4 ' + (emailAddress && password && !busy ? 'bg-banner active:opacity-80' : 'bg-[#B8C7DD]')}>
                {busy ? <ActivityIndicator color="#FFFFFF" /> : <><Feather name="user-plus" size={16} color="#FFFFFF" /><Text className="ml-2 text-[14px] font-bold text-white">Create account</Text></>}
              </Pressable>
            </>
          ) : (
            <>
              <View className="mt-8 rounded-2xl bg-[#EAF2FF] p-4"><Text className="text-[14px] font-bold text-ink">Check your inbox</Text><Text className="mt-1 text-[13px] leading-5 text-smoke">We sent a verification code to {emailAddress}.</Text></View>
              <Text className="mb-2 mt-6 text-[12px] font-bold uppercase tracking-[1px] text-smoke">Verification code</Text>
              <TextInput value={code} onChangeText={setCode} keyboardType="number-pad" placeholder="Enter 6-digit code" placeholderTextColor="#9AA5B5" className="rounded-2xl border border-line bg-white px-4 py-4 text-[15px] tracking-[3px] text-ink" />
              {(message || clerkMessage) && <Text className="mt-4 rounded-xl bg-[#FFF1F0] px-3 py-3 text-[13px] leading-5 text-[#B5463E]">{message || clerkMessage}</Text>}
              <Pressable onPress={handleVerify} disabled={!code || busy} className={'mt-6 items-center rounded-full py-4 ' + (code && !busy ? 'bg-banner active:opacity-80' : 'bg-[#B8C7DD]')}>
                {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text className="text-[14px] font-bold text-white">Verify email</Text>}
              </Pressable>
              <Pressable onPress={() => signUp.verifications.sendEmailCode()} disabled={busy} className="mt-4 items-center py-3"><Text className="text-[13px] font-bold text-banner">Send a new code</Text></Pressable>
            </>
          )}
        </View>
        <View className="flex-row justify-center pb-3 pt-8"><Text className="text-[13px] text-smoke">Already have an account? </Text><Link href={'/sign-in' as Href} asChild><Pressable><Text className="text-[13px] font-bold text-banner">Sign in</Text></Pressable></Link></View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}