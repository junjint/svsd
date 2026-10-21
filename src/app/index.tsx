import { Redirect } from 'expo-router';
import { useSidequestStore } from '@/stores/sidequestStore';

export default function Index() {
  const onboarded = useSidequestStore((s) => s.prefs.onboarded);
  return <Redirect href={onboarded ? '/draw' : '/onboarding'} />;
}
