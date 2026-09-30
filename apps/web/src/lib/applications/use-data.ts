'use client';
import { useEffect, useState } from 'react';
import { z } from 'zod';

const errorSchema = z.object({ error: z.object({ message: z.string() }) });
export function useApplicationData<T>(path: string, schema: z.ZodType<T>) {
  const [revision, setRevision] = useState(0);
  const key = `${path}:${revision}`;
  const [result, setResult] = useState<{ key: string; data: T | null; error: string | null } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(path, { cache: 'no-store', credentials: 'same-origin', signal: controller.signal });
        const body: unknown = await response.json();
        if (!response.ok) {
          const failure = errorSchema.safeParse(body);
          throw new Error(failure.success ? failure.data.error.message : 'Could not load application records.');
        }
        const data = schema.parse(body);
        if (!controller.signal.aborted) setResult({ key, data, error: null });
      } catch (error) {
        if (!controller.signal.aborted) setResult({ key, data: null,
          error: error instanceof Error ? error.message : 'Could not load application records.' });
      }
    }
    void load();
    return () => controller.abort();
  }, [key, path, schema]);
  return { data: result?.key === key ? result.data : null,
    error: result?.key === key ? result.error : null, loading: result?.key !== key,
    retry: () => setRevision(value => value + 1) };
}
