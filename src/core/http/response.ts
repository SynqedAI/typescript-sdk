/** @internal */
export async function parseResponse<T>(response: Response): Promise<T> {
  // 204 and 205 mean the request succeeded but there is no response body to parse.
  if (response.status === 204 || response.status === 205) {
    return undefined as T;
  }

  // Read the body as text first so we can detect empty responses before parsing.
  const text = await response.text();

  // Some APIs return 200 OK with an empty body. Treat that the same as no content.
  if (!text) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type');

  // JSON responses are parsed into the caller's expected type (ApiResponse, PaginatedResponse, etc.).
  if (contentType?.includes('application/json')) {
    return JSON.parse(text) as T;
  }

  // Non-JSON responses are returned as plain text.
  return text as T;
}
