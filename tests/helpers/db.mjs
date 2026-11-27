import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';

export async function migratedDb() {
  const db = new PGlite();
  await db.exec('create role anon; create role authenticated; create role service_role;');
  for (const file of (await readdir('supabase/migrations')).sort())
    await db.exec(await readFile('supabase/migrations/' + file, 'utf8'));
  return db;
}
