'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type CardGroup = {
  key: string;
  slug: string;
  href: string;
  name: string;
  number: string | null;
  rarity: string | null;
  imageUrl: string | null;
  releaseDate: string | null;
  listingsCount: number;
  lowestPrice: number | null;
};

type CardBrowserLabels = {
  viewGallery: string;
  viewList: string;
  visibleResults: string;
  listingCount: string;
  lowestPrice: string;
  noImage: string;
  openDetails: string;
  priceUnavailable: string;
  emptyMessage: string;
};

type CardBrowserProps = {
  groups: CardGroup[];
  labels: CardBrowserLabels;
};

type ViewMode = 'gallery' | 'list';

const formatPrice = (value: number) => `$${value.toFixed(2)}`;

export default function CardBrowser({ groups, labels }: CardBrowserProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');

  const sortedGroups = useMemo(
    () =>
      [...groups].sort((left, right) => {
        const leftNumber = left.number ?? '';
        const rightNumber = right.number ?? '';
        return leftNumber.localeCompare(rightNumber) || left.name.localeCompare(right.name);
      }),
    [groups]
  );

  if (sortedGroups.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-10 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">{labels.emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {labels.visibleResults}: {sortedGroups.length}
        </p>
        <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-950/40">
          <button
            type="button"
            onClick={() => setViewMode('gallery')}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              viewMode === 'gallery'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white'
                : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            {labels.viewGallery}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              viewMode === 'list'
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-900 dark:text-white'
                : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            {labels.viewList}
          </button>
        </div>
      </div>

      {viewMode === 'gallery' ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sortedGroups.map((group) => (
            <Link
              key={group.key}
              href={group.href}
              className="rounded-xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex gap-4">
                <div className="flex h-32 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/40">
                  {group.imageUrl ? (
                    <Image src={group.imageUrl} alt={group.name} width={96} height={128} className="h-full w-full object-cover" />
                  ) : (
                    <span className="px-2 text-center text-xs text-zinc-500 dark:text-zinc-400">{labels.noImage}</span>
                  )}
                </div>
                <div className="flex-1">
                  {group.number ? (
                    <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{group.number}</p>
                  ) : null}
                  <h2 className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">{group.name}</h2>
                  {group.rarity ? (
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{group.rarity}</p>
                  ) : null}
                  <div className="mt-4 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                    <p>{labels.listingCount}: {group.listingsCount}</p>
                    <p>
                      {labels.lowestPrice}: {group.lowestPrice === null ? labels.priceUnavailable : formatPrice(group.lowestPrice)}
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm font-medium text-blue-600 dark:text-blue-400">{labels.openDetails}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {sortedGroups.map((group) => (
              <Link
                key={group.key}
                href={group.href}
                className="grid grid-cols-1 gap-3 px-4 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-950/40 md:grid-cols-[minmax(0,1fr)_120px_120px] md:items-center"
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-white">{group.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {[group.number, group.rarity].filter(Boolean).join(' • ') || labels.openDetails}
                  </p>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 md:text-right">{labels.listingCount}: {group.listingsCount}</p>
                <p className="text-sm font-medium text-zinc-900 dark:text-white md:text-right">
                  {group.lowestPrice === null ? labels.priceUnavailable : formatPrice(group.lowestPrice)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}