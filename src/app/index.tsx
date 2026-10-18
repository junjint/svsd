import { Redirect } from 'expo-router';
import { useAppStore } from '@/stores/appStore';

export default function Index() {
  const user = useAppStore((s) => s.user);
  if (!user?.onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }
  return <Redirect href="/(tabs)/home" />;
}
