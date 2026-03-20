'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

type SetItem = {
	setId: string;
	code: string;
	name: string;
	series: string | null;
	releaseDate: string | null;
	href: string;
};

type SetBrowserLabels = {
	searchLabel: string;
	searchPlaceholder: string;
	filterSeries: string;
	allSeries: string;
	sortBy: string;
	sortCode: string;
	sortName: string;
	sortReleaseNewest: string;
	sortReleaseOldest: string;
	visibleResults: string;
	emptyMessage: string;
};

type SetBrowserProps = {
	sets: SetItem[];
	labels: SetBrowserLabels;
};

type SetSortOption = 'code' | 'name' | 'release-newest' | 'release-oldest';

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

export default function SetBrowser({ sets, labels }: SetBrowserProps) {
	const [searchQuery, setSearchQuery] = useState('');
	const [seriesFilter, setSeriesFilter] = useState('all');
	const [sortBy, setSortBy] = useState<SetSortOption>('release-newest');

	const seriesOptions = useMemo(
		() =>
			Array.from(
				new Set(
					sets
						.map((set) => set.series?.trim())
						.filter((series): series is string => Boolean(series))
				)
			).sort((a, b) => a.localeCompare(b)),
		[sets]
	);

	const visibleSets = useMemo(() => {
		const normalizedQuery = searchQuery.trim().toLowerCase();
		const filtered = sets.filter((set) => {
			const matchesSearch =
				normalizedQuery.length === 0 ||
				[set.name, set.code, set.series ?? '']
					.some((value) => value.toLowerCase().includes(normalizedQuery));

			if (seriesFilter === 'all') {
				return matchesSearch;
			}

			return matchesSearch && (set.series?.trim() ?? '') === seriesFilter;
		});

		return filtered.sort((left, right) => {
			switch (sortBy) {
				case 'name':
					return left.name.localeCompare(right.name) || left.code.localeCompare(right.code);
				case 'release-newest':
					return (
						compareNullableDates(left.releaseDate, right.releaseDate, 'desc') ||
						left.code.localeCompare(right.code)
					);
				case 'release-oldest':
					return (
						compareNullableDates(left.releaseDate, right.releaseDate, 'asc') ||
						left.code.localeCompare(right.code)
					);
				case 'code':
				default:
					return left.code.localeCompare(right.code) || left.name.localeCompare(right.name);
			}
		});
	}, [searchQuery, seriesFilter, sets, sortBy]);

	return (
		<div className="flex flex-col gap-6">
			<div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-5">
				<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
					<label className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-300">
						<span className="font-semibold">{labels.searchLabel}</span>
						<input
							type="search"
							value={searchQuery}
							onChange={(event) => setSearchQuery(event.target.value)}
							placeholder={labels.searchPlaceholder}
							className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
						/>
					</label>

					<label className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-300">
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

					<label className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-300">
						<span className="font-semibold">{labels.sortBy}</span>
						<select
							value={sortBy}
							onChange={(event) => setSortBy(event.target.value as SetSortOption)}
							className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
						>
							<option value="code">{labels.sortCode}</option>
							<option value="name">{labels.sortName}</option>
							<option value="release-newest">{labels.sortReleaseNewest}</option>
							<option value="release-oldest">{labels.sortReleaseOldest}</option>
						</select>
					</label>

					<div className="flex flex-col justify-end rounded-lg bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-950/50">
						<span className="font-semibold text-zinc-700 dark:text-zinc-300">
							{labels.visibleResults}
						</span>
						<span className="mt-1 text-lg font-semibold text-zinc-900 dark:text-white">
							{visibleSets.length}
						</span>
					</div>
				</div>
			</div>

			{visibleSets.length === 0 ? (
				<div className="rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-10 text-center">
					<p className="text-zinc-600 dark:text-zinc-400">{labels.emptyMessage}</p>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
					{visibleSets.map((set) => (
						<Link
							key={set.setId}
							href={set.href}
							className="group rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm hover:shadow-md transition-shadow"
						>
							<p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
								{set.code}
							</p>
							<h2 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
								{set.name}
							</h2>
							{set.series ? (
								<p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{set.series}</p>
							) : null}
						</Link>
					))}
				</div>
			)}
		</div>
	);
}