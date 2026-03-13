	import Link from 'next/link';
	import Image from 'next/image';
	import { supabase } from '@/lib/supabase';
	import type { Card } from '@/lib/supabase';
	import { normalizeLanguage, translations } from '@/lib/i18n';
	import { fetchGameId, fetchSet, fetchSetLocalizationDetails } from '../set-data';
	import {
		buildPriceSeries,
		flattenMetadata,
		formatDate,
		formatPrice,
		getAveragePrice,
		getHighestPrice,
		getLowestPrice,
	} from '@/lib/catalog-detail';
	import MarketMovementChart from '@/components/MarketMovementChart';

	export const revalidate = 60;

	interface CardDetailPageProps {
		params:
			| { game_id: string; set_id: string; card_id: string }
			| Promise<{ game_id: string; set_id: string; card_id: string }>;
	}

	const fetchCardListings = async (setId: string, cardSlug: string): Promise<Card[]> => {
		const normalizedSlug = decodeURIComponent(cardSlug).trim();

		const { data: slugMatches } = await supabase
			.from('cards')
			.select('card_id, set_id, card_name, number, set_code, rarity_name, variant_name, card_slug, release_date, image_url, metadata, language, created_at')
			.eq('set_id', setId)
			.ilike('card_slug', normalizedSlug)
			.order('created_at');

		if (slugMatches && slugMatches.length > 0) {
			return slugMatches as Card[];
		}

		if (/^\d+$/.test(normalizedSlug)) {
			const { data: idMatches } = await supabase
				.from('cards')
				.select('card_id, set_id, card_name, number, set_code, rarity_name, variant_name, card_slug, release_date, image_url, metadata, language, created_at')
				.eq('set_id', setId)
				.eq('card_id', Number(normalizedSlug))
				.order('created_at');

			return (idMatches ?? []) as Card[];
		}

		return [];
	};

	export default async function CardDetailPage({
		params,
		searchParams,
	}: CardDetailPageProps & {
		searchParams?:
			| { lang?: string | string[] }
			| Promise<{ lang?: string | string[] }>;
	}) {
		const resolvedParams = await Promise.resolve(params);
		const resolvedSearchParams = await Promise.resolve(searchParams);
		const setSlug = resolvedParams.set_id;
		const gameSlug = resolvedParams.game_id;
		const cardSlug = resolvedParams.card_id;
		const rawLang = Array.isArray(resolvedSearchParams?.lang)
			? resolvedSearchParams?.lang[0]
			: resolvedSearchParams?.lang;
		const language = normalizeLanguage(rawLang);
		const t = translations[language];
		const gameResult = await fetchGameId(gameSlug);
		const setResult = await fetchSet(gameResult.gameId, setSlug, language);
		const localizationDetails = setResult.set
			? await fetchSetLocalizationDetails(setResult.set.set_id, language)
			: { name: null, localSetSlug: null };
		const listings = setResult.set ? await fetchCardListings(setResult.set.set_id, cardSlug) : [];
		const primary = listings[0] ?? null;
		const langParam = language === 'en' ? '' : `?lang=${language}`;
		const prices = listings.map((listing) => listing.price);
		const metadataEntries = flattenMetadata(primary?.metadata);
		const detailRows = [
			{ label: t.catalog.cardNumberLabel, value: primary?.number ?? null },
			{ label: t.catalog.rarityLabel, value: primary?.rarity_name ?? null },
			{ label: t.catalog.variantLabel, value: primary?.variant_name ?? null },
			{ label: t.catalog.setCodeLabel, value: primary?.set_code ?? null },
			{ label: t.catalog.releaseDateLabel, value: formatDate(primary?.release_date) },
			{ label: t.catalog.languageLabel, value: primary?.language ?? null },
		].filter((row) => row.value);
		const title = primary?.card_name ?? 'Card';
		const errorMessage = gameResult.errorMessage ?? setResult.errorMessage;

		return (
			<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
				<div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 lg:px-8">
					<div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
						<Link href={`/catalog/${gameSlug}/${setSlug}/cards${langParam}`} className="text-sm font-semibold text-blue-600 dark:text-blue-400">
							{t.catalog.viewCards}
						</Link>
						<h1 className="mt-3 text-3xl font-bold text-zinc-900 dark:text-white sm:text-4xl">{title}</h1>
						<p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
							{localizationDetails.name ?? setResult.set?.name ?? 'Set'}
						</p>
					</div>

					{errorMessage ? (
						<div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
							<p className="text-sm font-semibold text-red-700 dark:text-red-300">{t.catalog.setErrorTitle}</p>
							<p className="mt-2 text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
						</div>
					) : !primary ? (
						<div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
							<p className="text-zinc-600 dark:text-zinc-400">{t.catalog.metadataEmpty}</p>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
							<div className="space-y-6">
								<div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
									<div className="flex min-h-96 items-center justify-center bg-zinc-100 dark:bg-zinc-950/40">
										{primary.image_url ? (
											<Image src={primary.image_url} alt={title} width={320} height={448} className="h-full w-full object-contain" />
										) : (
											<span className="text-sm text-zinc-500 dark:text-zinc-400">{t.catalog.noImage}</span>
										)}
									</div>
								</div>
								<div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
									<h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t.catalog.marketOverview}</h2>
									<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
										<div className="rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-950/40"><p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t.catalog.lowestPrice}</p><p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">{getLowestPrice(prices) === null ? t.catalog.noListingPrices : formatPrice(getLowestPrice(prices) as number)}</p></div>
										<div className="rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-950/40"><p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t.catalog.averagePrice}</p><p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">{getAveragePrice(prices) === null ? t.catalog.noListingPrices : formatPrice(getAveragePrice(prices) as number)}</p></div>
										<div className="rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-950/40"><p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t.catalog.highestPrice}</p><p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">{getHighestPrice(prices) === null ? t.catalog.noListingPrices : formatPrice(getHighestPrice(prices) as number)}</p></div>
										<div className="rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-950/40"><p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{t.catalog.listingCount}</p><p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">{listings.length}</p></div>
									</div>
								</div>
							</div>

							<div className="space-y-6">
								<div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
									<h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t.catalog.marketMovement}</h2>
									<div className="mt-4">
										<MarketMovementChart values={buildPriceSeries(listings)} emptyLabel={t.catalog.noChartData} />
									</div>
								</div>
								<div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
									<h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{t.catalog.metadataTitle}</h2>
									<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
										{detailRows.map((row) => (
											<div key={row.label} className="rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-950/40"><p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{row.label}</p><p className="mt-1 text-sm font-medium text-zinc-900 dark:text-white">{row.value}</p></div>
										))}
									</div>
									{metadataEntries.length > 0 ? (
										<div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
											{metadataEntries.map((entry) => (
												<div key={`${entry.label}-${entry.value}`} className="rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"><p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{entry.label}</p><p className="mt-1 text-sm text-zinc-900 dark:text-white">{entry.value}</p></div>
											))}
										</div>
									) : (
										<p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{t.catalog.metadataEmpty}</p>
									)}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		);
	}
    