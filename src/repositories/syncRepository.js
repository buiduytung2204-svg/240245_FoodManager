import { write } from '../database/connection';
import { insert } from '../database/helpers';
import { P, validateDish } from '../domain/dishes.cjs';
export async function enqueue(tx, entity, id, operation, payload) {
  await tx.runAsync('INSERT INTO "240245_Outbox" ("240245_Entity","240245_EntityId","240245_Operation","240245_Payload") VALUES (?,?,?,?)', entity, id, operation, JSON.stringify(payload));
}
export async function nextJob() {
  return write(tx => tx.getFirstAsync('SELECT * FROM "240245_Outbox" ORDER BY "240245_Sequence" LIMIT 1'));
}
export async function acknowledge(job) {
  await write(async tx => {
    await tx.runAsync('DELETE FROM "240245_Outbox" WHERE "240245_Sequence"=?', job[P + 'Sequence']);
    if (job[P + 'Entity'] === 'dishes' && job[P + 'Operation'] === 'upsert') await tx.runAsync('UPDATE "240245_Dish" SET "240245_IsSynced"=1 WHERE "240245_Id"=? AND NOT EXISTS (SELECT 1 FROM "240245_Outbox" WHERE "240245_Entity"=\'dishes\' AND "240245_EntityId"=?)', job[P + 'EntityId'], job[P + 'EntityId']);
  });
}
export async function applyRemoteSnapshot(remoteCategories, remoteDishes) {
  if (!Array.isArray(remoteCategories) || !Array.isArray(remoteDishes)) throw Error('invalidRemoteData');
  await write(async tx => {
    const jobs = await tx.getAllAsync('SELECT * FROM "240245_Outbox"');
    const protectedCategories = new Set(jobs.filter(j => j[P + 'Entity'] === 'categories').map(j => j[P + 'EntityId']));
    const protectedDishes = new Set(jobs.filter(j => j[P + 'Entity'] === 'dishes').map(j => j[P + 'EntityId']));
    const localDishes = await tx.getAllAsync('SELECT * FROM "240245_Dish"');
    for (const d of localDishes) if (!d[P + 'IsSynced']) protectedDishes.add(d[P + 'Id']);
    const categoryIds = new Set(),
      dishIds = new Set(),
      imageIds = new Set();
    const requireText = value => {
      if (typeof value !== 'string' || !value.trim()) throw Error('invalidRemoteData');
      return value.trim();
    };
    const categories = remoteCategories.map(c => {
      const id = requireText(c[P + 'Id']);
      if (categoryIds.has(id)) throw Error('invalidRemoteData');
      categoryIds.add(id);
      return {
        [P + 'Id']: id,
        [P + 'Name']: requireText(c[P + 'Name']),
        [P + 'Description']: String(c[P + 'Description'] ?? '')
      };
    });
    const dishes = remoteDishes.map(d => {
      const id = requireText(d[P + 'Id']);
      if (dishIds.has(id)) throw Error('invalidRemoteData');
      dishIds.add(id);
      const categoryId = requireText(d[P + 'DishCategoryId']);
      if (!categoryIds.has(categoryId) || ![0, 1].includes(d[P + 'IsAvailable'])) throw Error('invalidRemoteData');
      const row = {
        [P + 'Id']: id,
        [P + 'Name']: requireText(d[P + 'Name']),
        [P + 'Price']: Number(d[P + 'Price']),
        [P + 'PreparationTime']: Number(d[P + 'PreparationTime']),
        [P + 'IsAvailable']: d[P + 'IsAvailable'],
        [P + 'Description']: String(d[P + 'Description'] ?? ''),
        [P + 'DishCategoryId']: categoryId,
        [P + 'IsSynced']: 1
      };
      const incomingImages = d[P + 'Images'] ?? [];
      if (!Array.isArray(incomingImages) || incomingImages.filter(i => i[P + 'IsThumbnail'] === 1).length > 1) throw Error('invalidRemoteData');
      const images = incomingImages.map(i => {
        const imageId = requireText(i[P + 'Id']),
          url = requireText(i[P + 'ImageUrl']);
        if (imageIds.has(imageId) || !/^https?:\/\/[^\s]+$/i.test(url) || ![0, 1].includes(i[P + 'IsThumbnail'])) throw Error('invalidRemoteData');
        imageIds.add(imageId);
        return {
          [P + 'Id']: imageId,
          [P + 'DishId']: id,
          [P + 'ImageUrl']: url,
          [P + 'IsThumbnail']: i[P + 'IsThumbnail']
        };
      });
      return {
        row,
        images
      };
    });
    for (const c of categories) if (!protectedCategories.has(c[P + 'Id'])) {
      await tx.runAsync('INSERT INTO "240245_DishCategory" VALUES (?,?,?) ON CONFLICT("240245_Id") DO UPDATE SET "240245_Name"=excluded."240245_Name", "240245_Description"=excluded."240245_Description"', c[P + 'Id'], c[P + 'Name'], c[P + 'Description']);
    }
    // Replacing clean dishes also handles remote deletions and name exchanges.
    for (const d of localDishes) if (!protectedDishes.has(d[P + 'Id'])) await tx.runAsync('DELETE FROM "240245_Dish" WHERE "240245_Id"=?', d[P + 'Id']);
    const availableCategories = await tx.getAllAsync('SELECT * FROM "240245_DishCategory"');
    const mergedDishes = localDishes.filter(d => protectedDishes.has(d[P + 'Id']));
    for (const {
      row,
      images
    } of dishes) {
      if (protectedDishes.has(row[P + 'Id']) || !availableCategories.some(c => c[P + 'Id'] === row[P + 'DishCategoryId'])) continue;
      try {
        validateDish(row, availableCategories, mergedDishes, row[P + 'Id']);
      } catch {
        throw Error('invalidRemoteData');
      }
      await insert(tx, P + 'Dish', row);
      for (const image of images) await insert(tx, P + 'DishImage', image);
      mergedDishes.push(row);
    }
    const localCategories = await tx.getAllAsync('SELECT * FROM "240245_DishCategory"');
    for (const c of localCategories) if (!categoryIds.has(c[P + 'Id']) && !protectedCategories.has(c[P + 'Id'])) {
      const inUse = await tx.getFirstAsync('SELECT 1 FROM "240245_Dish" WHERE "240245_DishCategoryId"=?', c[P + 'Id']);
      if (!inUse) await tx.runAsync('DELETE FROM "240245_DishCategory" WHERE "240245_Id"=?', c[P + 'Id']);
    }
  });
}
