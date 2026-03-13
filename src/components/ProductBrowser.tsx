'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type ProductListing = {
	id: string;
	price: number | null;
	productType: string | null;
};

type ProductGroup = {
	key: string;
	href: string;
	name: string;
	productType: string | null;
	imageUrl: string | null;
	series: string | null;
	releaseDate: string | null;
	listings: ProductListing[];
	lowestPrice: number | null;
};

type ProductBrowserLabels = {
	filterSeries: string;
	filterProductType: string;
	allSeries: string;
	allProductTypes: string;
	sortBy: string;
	sortName: string;
	sortReleaseNewest: string;
	sortReleaseOldest: string;
	sortLowestPrice: string;
	visibleResults: string;
	productsLabel: string;
	totalListingsLabel: string;
	priceLabel: string;
	emptyMessage: string;
	listingsLabel: string;
	listingAvailableSingular: string;
	listingAvailablePlural: string;
	priceUnavailable: string;
	sealedProductFallback: string;
	noImage: string;
	fromPrefix: string;
	viewGallery: string;
	viewList: string;
	openDetails: string;
};

type ProductBrowserProps = {
	groups: ProductGroup[];
	labels: ProductBrowserLabels;
};

type ProductSortOption = 'name' | 'release-newest' | 'release-oldest' | 'lowest-price';
type ViewMode = 'gallery' | 'list';

const compareNullableDates = (
	left: string | null,
	right: string | null,
	direction: 'asc' | 'desc'
) => {
	const leftValue = left ? new Date(left).getTime() : null;
	const rightValue = right ? new Date(right).getTime() : null;

	if (leftValue === rightValue) return 0;
	if (leftValue === null) return 1;
	if (rightValue === null) return -1;
	return direction === 'asc' ? leftValue - rightValue : rightValue - leftValue;
};

const compareNullableNumbers = (left: number | null, right: number | null) => {
	if (left === right) return 0;
	if (left === null) return 1;
	if (right === null) return -1;
	return left - right;
};

const formatPrice = (value: number) => `$${value.toFixed(2)}`;

export default function ProductBrowser({ groups, labels }: ProductBrowserProps) {
	const [seriesFilter, setSeriesFilter] = useState('all');
	const [productTypeFilter, setProductTypeFilter] = useState('all');
	const [sortBy, setSortBy] = useState<ProductSortOption>('release-newest');
	const [viewMode, setViewMode] = useState<ViewMode>('gallery');

	const seriesOptions = useMemo(
		() =>
			Array.from(
				new Set(
					groups
						.map((group) => group.series?.trim())
						.filter((series): series is string => Boolean(series))
				)
			).sort((a, b) => a.localeCompare(b)),
		[groups]
	);

	const productTypeOptions = useMemo(
		() =>
			Array.from(
				new Set(
					groups
						.map((group) => group.productType?.trim())
						.filter((productType): productType is string => Boolean(productType))
				)
			).sort((a, b) => a.localeCompare(b)),
		[groups]
	);

	const visibleGroups = useMemo(() => {
		const filtered = groups.filter((group) => {
			const matchesSeries =
				seriesFilter === 'all' || (group.series?.trim() ?? '') === seriesFilter;
			const matchesProductType =
				productTypeFilter === 'all' || (group.productType?.trim() ?? '') === productTypeFilter;

			return matchesSeries && matchesProductType;
		});

		return filtered.sort((left, right) => {
			switch (sortBy) {
				case 'release-newest':
					return (
						compareNullableDates(left.releaseDate, right.releaseDate, 'desc') ||
						left.name.localeCompare(right.name)
					);
				case 'release-oldest':
					return (
						compareNullableDates(left.releaseDate, right.releaseDate, 'asc') ||
						left.name.localeCompare(right.name)
					);
				case 'lowest-price':
					return (
						compareNullableNumbers(left.lowestPrice, right.lowestPrice) ||
						left.name.localeCompare(right.name)
					);
				case 'name':
				default:
					return left.name.localeCompare(right.name);
			}
		});
	}, [groups, productTypeFilter, seriesFilter, sortBy]);

	const totalListings = useMemo(
		() => visibleGroups.reduce((total, group) => total + group.listings.length, 0),
		[visibleGroups]
	);

	return (
		<div className="flex flex-col gap-8">
			<div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8">
				<div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
					<label className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-300 lg:col-span-1">
						<span className="font-semibold">{labels.filterSeries}</span>
						<select
							value={seriesFilter}
							onChange={(event) => setSeriesFilter(event.target.value)}
							className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
						>
							<option value="all">{labels.allSeries}</option>
							{seriesOptions.map((series) => (
								<option key={series} value={series}>
									{series}
								</option>
							))}
						</select>
					</label>

					<label className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-300 lg:col-span-1">
						<span className="font-semibold">{labels.filterProductType}</span>
						<select
							value={productTypeFilter}
							onChange={(event) => setProductTypeFilter(event.target.value)}
							className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
						>
							<option value="all">{labels.allProductTypes}</option>
							{productTypeOptions.map((productType) => (
								<option key={productType} value={productType}>
									{productType}
								</option>
							))}
						</select>
					</label>

					<label className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-300 lg:col-span-1">
						<span className="font-semibold">{labels.sortBy}</span>
						<select
							value={sortBy}
							onChange={(event) => setSortBy(event.target.value as ProductSortOption)}
							className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
						>
							<option value="name">{labels.sortName}</option>
							<option value="release-newest">{labels.sortReleaseNewest}</option>
							<option value="release-oldest">{labels.sortReleaseOldest}</option>
							<option value="lowest-price">{labels.sortLowestPrice}</option>
						</select>
					</label>

					<div className="rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-950/40 lg:col-span-1">
						<p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{labels.productsLabel}</p>
						<p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">{visibleGroups.length}</p>
					</div>

					<div className="rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-950/40 lg:col-span-1">
						<p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{labels.totalListingsLabel}</p>
						<p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">{totalListings}</p>
					</div>
				</div>

				<p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
					{labels.visibleResults}: {visibleGroups.length}
				</p>

				<div className="mt-4 inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-950/40">
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

			{visibleGroups.length === 0 ? (
				<div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-10 text-center">
					<p className="text-zinc-600 dark:text-zinc-400">{labels.emptyMessage}</p>
				</div>
			) : viewMode === 'gallery' ? (
				<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
					{visibleGroups.map((group) => {
						const primaryListing = group.listings[0];

						return (
							<Link
								key={group.key}
								href={group.href}
								className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6"
							>
								<div className="flex gap-4">
									<div className="h-20 w-20 flex-shrink-0 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center">
										{group.imageUrl ? (
											<Image
												src={group.imageUrl}
												alt={group.name}
												width={80}
												height={80}
												className="h-full w-full object-cover"
											/>
										) : (
											<span className="text-xs text-zinc-400">{labels.noImage}</span>
										)}
									</div>
									<div className="flex-1">
										<h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{group.name}</h2>
										{group.productType ? (
											<p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{group.productType}</p>
										) : null}
										{group.series ? (
											<p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{group.series}</p>
										) : null}
										<p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
											{group.listings.length} {group.listings.length === 1 ? labels.listingAvailableSingular : labels.listingAvailablePlural}
										</p>
									</div>
									{typeof primaryListing?.price === 'number' ? (
										<div className="text-right">
											<p className="text-sm text-zinc-500 dark:text-zinc-400">{labels.priceLabel}</p>
											<p className="text-lg font-semibold text-zinc-900 dark:text-white">
												{formatPrice(primaryListing.price)}
											</p>
											{group.lowestPrice !== null && group.lowestPrice !== primaryListing.price ? (
												<p className="text-xs text-zinc-500 dark:text-zinc-400">
													{labels.fromPrefix} {formatPrice(group.lowestPrice)}
												</p>
											) : null}
										</div>
									) : null}
								</div>

								<div className="mt-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 p-3">
									<p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
										{labels.listingsLabel}
									</p>
									<div className="mt-2 divide-y divide-zinc-200 dark:divide-zinc-800">
										{group.listings.map((listing) => (
											<div
												key={listing.id}
												className="flex items-center justify-between py-2 text-sm gap-4"
											>
												<div className="flex items-center gap-2">
													<span className="inline-flex items-center rounded-full border border-zinc-300 dark:border-zinc-700 px-2 py-0.5 text-xs text-zinc-600 dark:text-zinc-300">
														{listing.productType ?? labels.sealedProductFallback}
													</span>
												</div>
												<span className="font-semibold text-zinc-900 dark:text-white">
													{listing.price === null ? labels.priceUnavailable : formatPrice(listing.price)}
												</span>
											</div>
										))}
									</div>
								</div>
								<p className="mt-4 text-sm font-medium text-blue-600 dark:text-blue-400">{labels.openDetails}</p>
							</Link>
						);
					})}
				</div>
			) : (
				<div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
					<div className="divide-y divide-zinc-200 dark:divide-zinc-800">
						{visibleGroups.map((group) => (
							<Link
								key={group.key}
								href={group.href}
								className="grid grid-cols-1 gap-3 px-4 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-950/40 md:grid-cols-[minmax(0,1fr)_120px_140px] md:items-center"
							>
								<div>
									<p className="text-sm font-semibold text-zinc-900 dark:text-white">{group.name}</p>
									<p className="text-xs text-zinc-500 dark:text-zinc-400">
										{[group.productType, group.series].filter(Boolean).join(' • ') || labels.openDetails}
									</p>
								</div>
								<p className="text-sm text-zinc-600 dark:text-zinc-400 md:text-right">
									{group.listings.length} {group.listings.length === 1 ? labels.listingAvailableSingular : labels.listingAvailablePlural}
								</p>
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