/** @internal */
export async function parseResponse<T>(response: Response): Promise<T> {

  const contentType = response.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return response.text() as Promise<T>;
}
