'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/lib/i18n-client';

export default function LocalizedDocumentMetadata() {
  const { lang, t } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = lang === 'kr' ? 'ko' : 'en';
    document.title =
      lang === 'kr'
        ? `${t.home.titleName} - 트레이딩 카드 마켓플레이스`
        : 'CardJang - Trading Card Marketplace';
  }, [lang, t.home.titleName]);

  return null;
}