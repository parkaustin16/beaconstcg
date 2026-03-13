type MarketMovementChartProps = {
  values: number[];
  emptyLabel: string;
};

export default function MarketMovementChart({
  values,
  emptyLabel,
}: MarketMovementChartProps) {
  if (values.length < 2) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-400">
        {emptyLabel}
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = 100;
  const height = 36;
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950/40">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full overflow-visible" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points={points}
          className="text-blue-600 dark:text-blue-400"
        />
      </svg>
      <div className="mt-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>{values.length} pts</span>
        <span>${min.toFixed(2)} - ${max.toFixed(2)}</span>
      </div>
    </div>
  );
}