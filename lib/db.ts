import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sql: any = databaseUrl ? neon(databaseUrl) : null;

export async function queryDatabase<T = Record<string, unknown>>(
  query: string,
  params: unknown[] = []
): Promise<T[]> {
  if (!sql) {
    console.warn('DATABASE_URL not configured. Operating in local memory fallback.');
    return [];
  }
  try {
    const result = await sql(query, params);
    return result as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}
