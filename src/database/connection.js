import * as SQLite from 'expo-sqlite';
import { schema } from './schema';
import { DATABASE_NAME } from '../models/fields.cjs';
let db;
let tail = Promise.resolve();
export async function openDatabase() {
  db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync(schema);
  return db;
}

// Queue all access on the connection whose foreign_keys pragma is enabled.
// Never hold a database transaction while making HTTP requests.
export function write(action) {
  const result = tail.then(async () => {
    if (!db) throw Error('Database not initialized');
    let value;
    await db.withTransactionAsync(async () => {
      value = await action(db);
    });
    return value;
  });
  tail = result.catch(() => {});
  return result;
}
