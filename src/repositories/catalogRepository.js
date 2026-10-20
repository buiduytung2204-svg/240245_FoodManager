import { write } from '../database/connection';
export async function readData() {
  // One transaction gives screens a consistent snapshot.
  return write(async tx => ({
    categories: await tx.getAllAsync('SELECT * FROM "240245_DishCategory" ORDER BY "240245_Name"'),
    dishes: await tx.getAllAsync('SELECT * FROM "240245_Dish"'),
    images: await tx.getAllAsync('SELECT * FROM "240245_DishImage"'),
    pending: (await tx.getFirstAsync('SELECT COUNT(*) AS n FROM "240245_Outbox"')).n
  }));
}
