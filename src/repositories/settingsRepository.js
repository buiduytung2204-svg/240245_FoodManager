import { write } from '../database/connection';
import { P } from '../models/fields.cjs';
import { enqueue } from './syncRepository';
export async function getLanguage() {
  return write(async tx => (await tx.getFirstAsync('SELECT "240245_Value" AS value FROM "240245_Settings" WHERE "240245_Key"=?', 'language'))?.value || 'en');
}
export async function setLanguage(language) {
  await write(tx => tx.runAsync('INSERT OR REPLACE INTO "240245_Settings" VALUES (?,?)', 'language', language));
}
export async function getApiUrl() {
  return write(async tx => (await tx.getFirstAsync('SELECT "240245_Value" AS value FROM "240245_Settings" WHERE "240245_Key"=?', 'apiUrl'))?.value ?? null);
}
export async function setApiUrl(url) {
  await write(async tx => {
    await tx.runAsync('INSERT OR REPLACE INTO "240245_Settings" VALUES (?,?)', 'apiUrl', url);
    // A new endpoint needs records already acknowledged by the old one too.
    const jobs = await tx.getAllAsync('SELECT * FROM "240245_Outbox"');
    const pending = new Set(jobs.map(j => `${j[P + 'Entity']}:${j[P + 'EntityId']}`));
    const categories = await tx.getAllAsync('SELECT * FROM "240245_DishCategory"');
    const dishes = await tx.getAllAsync('SELECT * FROM "240245_Dish"');
    for (const c of categories) if (!pending.has(`categories:${c[P + 'Id']}`)) await enqueue(tx, 'categories', c[P + 'Id'], 'upsert', c);
    for (const d of dishes) if (!pending.has(`dishes:${d[P + 'Id']}`)) {
      const images = await tx.getAllAsync('SELECT * FROM "240245_DishImage" WHERE "240245_DishId"=?', d[P + 'Id']);
      await enqueue(tx, 'dishes', d[P + 'Id'], 'upsert', {
        ...d,
        [P + 'IsSynced']: 0,
        [P + 'Images']: images
      });
    }
    await tx.runAsync('UPDATE "240245_Dish" SET "240245_IsSynced"=0');
  });
}
