/** @internal */
export async function collectPaginator<T>(
  generator: AsyncGenerator<T>,
): Promise<T[]> {
  const items: T[] = [];

  for await (const item of generator) {
    items.push(item);
  }

  return items;
}
