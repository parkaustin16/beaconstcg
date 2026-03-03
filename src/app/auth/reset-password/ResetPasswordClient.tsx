'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n-client';

export default function ResetPasswordClient() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  const { withLang, t } = useLanguage();
  const missingRecoveryCode = t.auth.missingRecoveryCode;

  useEffect(() => {
    const initializeRecoverySession = async () => {
      const hash = window.location.hash.replace(/^#/, '');
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');

      if (accessToken && refreshToken && type === 'recovery') {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          setError(sessionError.message);
        }
      } else if (type === 'recovery') {
        setError(missingRecoveryCode);
      }

      setReady(true);
    };

    initializeRecoverySession();
  }, [missingRecoveryCode]);

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters.');
      }

      if (password !== confirmPassword) {
        throw new Error(t.auth.passwordsDoNotMatch);
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      setSuccess(t.auth.passwordUpdated);
      setTimeout(() => router.push(withLang('/auth/login')), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.signInFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-800 rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white text-center">{t.auth.resetPasswordTitle}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 text-center">
          Choose a strong password to secure your account.
        </p>

        {error ? (
          <div className="mt-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm">
            {success}
          </div>
        ) : null}

        {!ready ? (
          <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">Preparing secure session...</p>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleReset}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                {t.auth.newPassword}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
              >
                {t.auth.confirmPassword}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? t.auth.updatingPassword : t.auth.updatePassword}
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-zinc-600 dark:text-zinc-400">
          <Link href={withLang('/auth/login')} className="text-blue-600 dark:text-blue-400 font-semibold">
            {t.auth.backToLogin}
          </Link>
        </p>
      </div>
    </div>
  );
}
