import { removeUndefined } from '@/core/utils/remove-undefined';

/** @internal */
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const entries = removeUndefined(params) as Record<
    string,
    string | number | boolean
  >;

  const query = new URLSearchParams(
    Object.fromEntries(
      Object.entries(entries).map(([key, value]) => [key, String(value)]),
    ),
  ).toString();

  return query ? `?${query}` : '';
}
