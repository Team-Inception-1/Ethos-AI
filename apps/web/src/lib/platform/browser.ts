export function errorMessage(value: unknown, fallback = 'The request could not be completed.'): string {
  if (value instanceof Error) return value.message;
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'message' in value && typeof value.message === 'string') return value.message;
  return fallback;
}
export async function browserApi<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...init });
  const body = await response.json();
  if (!response.ok) throw new Error(errorMessage(body.error, `Request failed (${response.status}).`));
  return body;
}
