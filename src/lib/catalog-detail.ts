export const formatPrice = (value: number) => `$${value.toFixed(2)}`;

export const formatDate = (value?: string | null) => {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const getLowestPrice = (prices: Array<number | null | undefined>) => {
  const numericPrices = prices.filter((price): price is number => typeof price === 'number');
  if (numericPrices.length === 0) return null;
  return Math.min(...numericPrices);
};

export const getHighestPrice = (prices: Array<number | null | undefined>) => {
  const numericPrices = prices.filter((price): price is number => typeof price === 'number');
  if (numericPrices.length === 0) return null;
  return Math.max(...numericPrices);
};

export const getAveragePrice = (prices: Array<number | null | undefined>) => {
  const numericPrices = prices.filter((price): price is number => typeof price === 'number');
  if (numericPrices.length === 0) return null;
  return numericPrices.reduce((sum, price) => sum + price, 0) / numericPrices.length;
};

export const buildPriceSeries = <T extends { price?: number | null; created_at?: string | null }>(
  rows: T[]
) => {
  return rows
    .filter((row): row is T & { price: number } => typeof row.price === 'number')
    .sort((left, right) => {
      const leftValue = left.created_at ? new Date(left.created_at).getTime() : 0;
      const rightValue = right.created_at ? new Date(right.created_at).getTime() : 0;
      return leftValue - rightValue;
    })
    .map((row) => row.price);
};

const toLabel = (value: string) =>
  value
    .replace(/[_.-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const flattenMetadata = (
  value: unknown,
  prefix = ''
): Array<{ label: string; value: string }> => {
  if (value === null || value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => flattenMetadata(entry, `${prefix}${prefix ? ' ' : ''}${index + 1}`));
  }

  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) => {
      const nextPrefix = prefix ? `${prefix} ${toLabel(key)}` : toLabel(key);
      return flattenMetadata(entry, nextPrefix);
    });
  }

  return [
    {
      label: prefix || 'Value',
      value: String(value),
    },
  ];
};