import { write } from './connection';
import { insert } from './helpers';
import { enqueue } from '../repositories/syncRepository';
import { P } from '../models/fields.cjs';
export async function seedDatabase() {
  await write(async tx => {
    if (await tx.getFirstAsync('SELECT 1 FROM "240245_Settings" WHERE "240245_Key" = ?', 'seeded')) return;
    const names = ['Main courses', 'Desserts', 'Drinks'];
    for (let i = 0; i < names.length; i++) {
      const c = {
        [P + 'Id']: `category-${i + 1}`,
        [P + 'Name']: names[i],
        [P + 'Description']: ''
      };
      await insert(tx, P + 'DishCategory', c);
      await enqueue(tx, 'categories', c[P + 'Id'], 'upsert', c);
    }
    const seed = [['Beef Pho', 65000, 20, 1, 1], ['Chicken rice', 55000, 15, 1, 1], ['Spring rolls', 45000, 12, 0, 1], ['Mango pudding', 30000, 10, 1, 2], ['Iced coffee', 25000, 5, 1, 3]];
    for (let i = 0; i < seed.length; i++) {
      const [name, price, time, available, category] = seed[i];
      const d = {
        [P + 'Id']: `dish-${i + 1}`,
        [P + 'Name']: name,
        [P + 'Price']: price,
        [P + 'PreparationTime']: time,
        [P + 'IsAvailable']: available,
        [P + 'Description']: '',
        [P + 'DishCategoryId']: `category-${category}`,
        [P + 'IsSynced']: 0
      };
      const images = [0, 1].map(n => ({
        [P + 'Id']: `image-${i}-${n}`,
        [P + 'DishId']: d[P + 'Id'],
        [P + 'ImageUrl']: `https://picsum.photos/seed/food${i}${n}/800/500`,
        [P + 'IsThumbnail']: n === 0 ? 1 : 0
      }));
      await insert(tx, P + 'Dish', d);
      for (const image of images) await insert(tx, P + 'DishImage', image);
      await enqueue(tx, 'dishes', d[P + 'Id'], 'upsert', {
        ...d,
        [P + 'Images']: images
      });
    }
    await tx.runAsync('INSERT INTO "240245_Settings" VALUES (?,?)', 'seeded', '1');
  });
}
