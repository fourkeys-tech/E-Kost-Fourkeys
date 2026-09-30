'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Role } from '@/types';

interface UseRequireAuthOptions {
  allowedRoles?: Role[];
  redirectTo?: string;
}

export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { allowedRoles, redirectTo = '/login' } = options;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push(redirectTo);
      return;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, loading, allowedRoles, redirectTo, router]);

  return { user, loading };
}
