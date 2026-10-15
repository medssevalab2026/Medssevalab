import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function ActionDummyScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/search');
  }, []);

  return null;
}