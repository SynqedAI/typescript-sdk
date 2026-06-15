import { removeUndefined } from '@/core/utils/remove-undefined';

/** @internal */
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const entries = removeUndefined(
    Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key, String(value)]),
    ),
  ) as Record<string, string>;

  const query = new URLSearchParams(entries).toString();
  return query ? `?${query}` : '';
}
