import { Redirect } from 'expo-router';
import { Platform } from 'react-native';
import { useSidequestStore } from '@/stores/sidequestStore';

export default function Index() {
  const onboarded = useSidequestStore((s) => s.prefs.onboarded);
  return <Redirect href={Platform.OS === 'web' || onboarded ? '/draw' : '/onboarding'} />;
}
