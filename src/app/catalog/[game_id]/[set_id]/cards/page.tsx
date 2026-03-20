import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Card } from '@/lib/supabase';
import { normalizeLanguage, translations } from '@/lib/i18n';
import {
  fetchGameId,
  fetchSet,
  fetchSetLocalizationDetails,
} from '../set-data';
import CardBrowser from '@/components/CardBrowser';
import { getLowestPrice } from '@/lib/catalog-detail';

export const revalidate = 60;

interface SetCardsPageProps {
  params:
    | { game_id: string; set_id: string }
    | Promise<{ game_id: string; set_id: string }>;
}

interface CardListingGroup {
  key: string;
  slug: string;
  number: string | null;
  name: string;
  rarity: string | null;
  imageUrl: string | null;
  releaseDate: string | null;
  listings: Card[];
}

const fetchCards = async (setId: string): Promise<Card[]> => {
  const { data, error } = await supabase
    .from('cards')
    .select('card_id, set_id, card_name, number, set_code, rarity_name, variant_name, card_slug, release_date, image_url, metadata, language, created_at')
    .eq('set_id', setId)
    .order('number')
    .order('card_name');

  if (error || !data) {
    return [];
  }

  return data as Card[];
};

const getCardName = (card: Card) => card.card_name?.trim() ?? card.name?.trim() ?? 'Card';

const getCardNumber = (card: Card) => {
  const value = card.number?.trim();
  return value && value.length > 0 ? value : null;
};

const getCardRarity = (card: Card) => {
  const value = card.rarity_name?.trim() ?? card.rarity?.trim();
  return value && value.length > 0 ? value : null;
};

const getCardSlug = (card: Card, index: number) => {
  const explicitSlug = card.card_slug?.trim();
  if (explicitSlug) {
    return explicitSlug;
  }

  return String(card.card_id ?? card.id ?? index);
};

const groupCardListings = (cards: Card[]): CardListingGroup[] => {
  const groups = new Map<string, CardListingGroup>();

  for (const card of cards) {
    const number = getCardNumber(card);
    const name = getCardName(card);
    const rarity = getCardRarity(card);
    const key = `${number}::${name}`.toLowerCase();
    const existing = groups.get(key);

    if (existing) {
      existing.listings.push(card);
      continue;
    }

    groups.set(key, {
      key,
      slug: getCardSlug(card, groups.size),
      number,
      name,
      rarity,
      imageUrl: typeof card.image_url === 'string' ? card.image_url : null,
      releaseDate: typeof card.release_date === 'string' ? card.release_date : null,
      listings: [card],
    });
  }

  return Array.from(groups.values());
};

export default async function SetCardsPage({
  params,
  searchParams,
}: SetCardsPageProps & {
  searchParams?:
    | { lang?: string | string[] }
    | Promise<{ lang?: string | string[] }>;
}) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const setSlug = resolvedParams.set_id;
  const gameSlug = resolvedParams.game_id;
  const rawLang = Array.isArray(resolvedSearchParams?.lang)
    ? resolvedSearchParams?.lang[0]
    : resolvedSearchParams?.lang;
  const language = normalizeLanguage(rawLang);
  const t = translations[language];
  const gameResult = await fetchGameId(gameSlug);
  const setResult = await fetchSet(gameResult.gameId, setSlug, language);
  const cards = setResult.set
    ? await fetchCards(setResult.set.set_id)
    : [];
  const cardListingGroups = groupCardListings(cards);
  const localizationDetails = setResult.set
    ? await fetchSetLocalizationDetails(setResult.set.set_id, language)
    : { name: null, localSetSlug: null };
  const localizedSetName = setResult.localizedName ?? localizationDetails.name;
  const errorMessage = gameResult.errorMessage ?? setResult.errorMessage;
  const set = setResult.set;
  const displayName = localizedSetName ?? set?.name;
  const langParam = language === 'en' ? '' : `?lang=${language}`;
  const totalListings = cardListingGroups.reduce(
    (total, group) => total + group.listings.length,
    0
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col gap-8">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8">
            <Link
              href={`/catalog/${gameSlug}/${setSlug}${langParam}`}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400"
            >
              {t.catalog.backToSet}
            </Link>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
              {displayName ?? 'Set'} Cards
            </h1>
            <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
              {t.catalog.cardsSubtitle}
            </p>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Cards</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">
                  {cardListingGroups.length}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Total Listings</p>
                <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">
                  {totalListings}
                </p>
              </div>
            </div>
          </div>

          {errorMessage ? (
            <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6 text-center">
              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                {t.catalog.setErrorTitle}
              </p>
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errorMessage}
              </p>
            </div>
          ) : cardListingGroups.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-10 text-center">
              <p className="text-zinc-600 dark:text-zinc-400">
                {t.catalog.cardsEmpty}
              </p>
            </div>
          ) : (
            <CardBrowser
              groups={cardListingGroups.map((group) => ({
                key: group.key,
                slug: group.slug,
                href: `/catalog/${gameSlug}/${setSlug}/${encodeURIComponent(group.slug)}${langParam}`,
                name: group.name,
                number: group.number,
                rarity: group.rarity,
                imageUrl: group.imageUrl,
                releaseDate: group.releaseDate,
                listingsCount: group.listings.length,
                lowestPrice: getLowestPrice(group.listings.map((listing) => listing.price)),
              }))}
              labels={{
                searchLabel: t.catalog.searchLabel,
                searchPlaceholder: t.catalog.searchCardsPlaceholder,
                filterRarity: t.catalog.filterRarity,
                allRarities: t.catalog.allRarities,
                viewGallery: t.catalog.viewGallery,
                viewList: t.catalog.viewList,
                visibleResults: t.catalog.visibleResults,
                listingCount: t.catalog.listingCount,
                lowestPrice: t.catalog.lowestPrice,
                noImage: t.catalog.noImage,
                openDetails: t.catalog.openDetails,
                priceUnavailable: t.catalog.noListingPrices,
                emptyMessage: t.catalog.cardsEmptyFiltered,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
