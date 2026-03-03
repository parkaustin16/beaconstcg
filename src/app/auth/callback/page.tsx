'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n-client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { withLang } = useLanguage();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const completeAuth = async () => {
      const code = searchParams?.get('code');
      if (!code) {
        router.replace(withLang('/auth/login'));
        return;
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        setError(exchangeError.message);
        return;
      }

      router.replace(withLang('/catalog'));
    };

    completeAuth();
  }, [router, searchParams, withLang]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-800 rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white text-center">Signing you in...</h1>
        {error ? (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
        ) : (
          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400 text-center">
            Completing secure authentication.
          </p>
        )}
      </div>
    </div>
  );
}
