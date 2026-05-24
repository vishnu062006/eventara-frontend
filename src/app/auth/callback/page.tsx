'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const id = searchParams.get('id');
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const role = searchParams.get('role');
    const picture = searchParams.get('picture');

    if (token && id && name && email && role) {
      login({
        id: parseInt(id),
        name: decodeURIComponent(name),
        email,
        role,
        token,
        picture: decodeURIComponent(picture || ''),
      });
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#060910] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#58a6ff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#8b949e] text-sm">Signing you in...</p>
      </div>
    </div>
  );
}