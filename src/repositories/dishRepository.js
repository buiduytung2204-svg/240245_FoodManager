import { write } from '../database/connection';
import { insert, uid } from '../database/helpers';
import { P, validateDish } from '../domain/dishes.cjs';
import { enqueue } from './syncRepository';
export async function saveDish(input, images, id) {
  return write(async tx => {
    const categories = await tx.getAllAsync('SELECT * FROM "240245_DishCategory"');
    const dishes = await tx.getAllAsync('SELECT * FROM "240245_Dish"');
    if (id && !dishes.some(d => d[P + 'Id'] === id)) throw Error('notFound');
    validateDish(input, categories, dishes, id);
    if (images.filter(i => i[P + 'IsThumbnail'] === 1).length > 1) throw Error('thumbnailError');
    if (images.some(i => !/^https?:\/\/[^\s]+$/i.test(i[P + 'ImageUrl']))) throw Error('invalidUrl');
    const dishId = id || uid();
    const row = {
      ...input,
      [P + 'Id']: dishId,
      [P + 'Name']: input[P + 'Name'].normalize('NFKC').trim(),
      [P + 'Price']: Number(input[P + 'Price']),
      [P + 'PreparationTime']: Number(input[P + 'PreparationTime']),
      [P + 'IsSynced']: 0
    };
    if (id) {
      await tx.runAsync('DELETE FROM "240245_DishImage" WHERE "240245_DishId"=?', id);
      await tx.runAsync('UPDATE "240245_Dish" SET "240245_Name"=?,"240245_Price"=?,"240245_PreparationTime"=?,"240245_IsAvailable"=?,"240245_Description"=?,"240245_DishCategoryId"=?,"240245_IsSynced"=0 WHERE "240245_Id"=?', row[P + 'Name'], row[P + 'Price'], row[P + 'PreparationTime'], row[P + 'IsAvailable'], row[P + 'Description'], row[P + 'DishCategoryId'], id);
    } else await insert(tx, P + 'Dish', row);
    const savedImages = images.map(i => ({
      [P + 'Id']: i[P + 'Id'] || uid(),
      [P + 'DishId']: dishId,
      [P + 'ImageUrl']: i[P + 'ImageUrl'].trim(),
      [P + 'IsThumbnail']: i[P + 'IsThumbnail'] ? 1 : 0
    }));
    for (const image of savedImages) await insert(tx, P + 'DishImage', image);
    await enqueue(tx, 'dishes', dishId, 'upsert', {
      ...row,
      [P + 'Images']: savedImages
    });
    return dishId;
  });
}
export async function deleteDish(id) {
  await write(async tx => {
    const result = await tx.runAsync('DELETE FROM "240245_Dish" WHERE "240245_Id"=?', id);
    if (!result.changes) throw Error('notFound');
    // Durable tombstone survives physical deletion and app restart.
    await enqueue(tx, 'dishes', id, 'delete', {});
  });
}
