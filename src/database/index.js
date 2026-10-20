import { openDatabase } from './connection';
import { seedDatabase } from './seed';
export async function initDatabase() {
  const db = await openDatabase();
  await seedDatabase();
  return db;
}
