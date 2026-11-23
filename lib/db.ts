import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

export const sql = databaseUrl ? neon(databaseUrl) : null;

export async function queryDatabase<T = Record<string, unknown>>(
  query: string,
  params: unknown[] = []
): Promise<T[]> {
  if (!sql) {
    console.warn('DATABASE_URL not configured. Operating in local memory fallback.');
    return [];
  }
  try {
    // Neon serverless tagged-template vs parameterized function:
    // sql.query(query, params) is the official function for parameterized queries ($1, $2, etc.)
    const client = sql as unknown as { query: (q: string, p?: unknown[]) => Promise<T[]> };
    const result = typeof client.query === 'function'
      ? await client.query(query, params)
      : await (sql as unknown as (q: string, p?: unknown[]) => Promise<T[]>)(query, params);
    return (result || []) as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}
