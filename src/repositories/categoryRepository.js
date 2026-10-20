import { write } from '../database/connection';
import { insert, uid } from '../database/helpers';
import { P } from '../models/fields.cjs';
import { enqueue } from './syncRepository';
export async function saveCategory(name, description) {
  if (!name.trim()) throw Error('nameRequired');
  await write(async tx => {
    const c = {
      [P + 'Id']: uid(),
      [P + 'Name']: name.trim(),
      [P + 'Description']: description.trim()
    };
    await insert(tx, P + 'DishCategory', c);
    await enqueue(tx, 'categories', c[P + 'Id'], 'upsert', c);
  });
}
export async function deleteCategory(id) {
  await write(async tx => {
    if (await tx.getFirstAsync('SELECT 1 FROM "240245_Dish" WHERE "240245_DishCategoryId"=?', id)) throw Error('categoryInUse');
    const r = await tx.runAsync('DELETE FROM "240245_DishCategory" WHERE "240245_Id"=?', id);
    if (!r.changes) throw Error('notFound');
    await enqueue(tx, 'categories', id, 'delete', {});
  });
}
