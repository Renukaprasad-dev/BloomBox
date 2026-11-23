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
    const queryFn = sql as unknown as (q: string, p?: unknown[]) => Promise<unknown[]>;
    const result = await queryFn(query, params);
    return result as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}
