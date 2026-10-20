const {
  test
} = require('node:test');
const assert = require('node:assert/strict');
const {
  DatabaseSync
} = require('node:sqlite');
const {
  readFileSync
} = require('node:fs');
const schema = readFileSync(require('node:path').join(__dirname, '../../src/database/schema.js'), 'utf8').split('`')[1];
function setup() {
  const db = new DatabaseSync(':memory:');
  db.exec(schema);
  db.exec(`INSERT INTO "240245_DishCategory" VALUES ('c','Main',''); INSERT INTO "240245_Dish" VALUES ('d','Pho',50,15,1,'','c',0);`);
  return db;
}
test('all persisted tables and columns have required prefix', () => {
  const db = setup();
  for (const {
    name
  } of db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()) {
    assert.ok(name.startsWith('240245_'));
    for (const row of db.prepare(`PRAGMA table_info("${name}")`).all()) assert.ok(row.name.startsWith('240245_'));
  }
  db.close();
});
test('DB prevents invalid foreign keys, duplicate names, prices and multiple thumbnails', () => {
  const db = setup();
  for (const sql of [`DELETE FROM "240245_DishCategory" WHERE "240245_Id"='c'`, `INSERT INTO "240245_Dish" VALUES ('d2','PHO',50,15,1,'','c',0)`, `UPDATE "240245_Dish" SET "240245_Price"=0`, `UPDATE "240245_Dish" SET "240245_DishCategoryId"='missing'`]) assert.throws(() => db.exec(sql));
  db.exec(`INSERT INTO "240245_DishImage" VALUES ('i','d','https://example.com/a',1)`);
  assert.throws(() => db.exec(`INSERT INTO "240245_DishImage" VALUES ('j','d','https://example.com/b',1)`));
  db.exec(`DELETE FROM "240245_Dish" WHERE "240245_Id"='d'`);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM "240245_DishImage"').get().n, 0);
  db.close();
});
test('delete tombstone survives dish deletion; older acknowledgement cannot mark newer edits synced', () => {
  const db = setup();
  const add = db.prepare('INSERT INTO "240245_Outbox" ("240245_Entity","240245_EntityId","240245_Operation","240245_Payload") VALUES (?,?,?,?)');
  add.run('dishes', 'd', 'upsert', '{}');
  add.run('dishes', 'd', 'upsert', '{}');
  db.exec(`DELETE FROM "240245_Outbox" WHERE "240245_Sequence"=1; UPDATE "240245_Dish" SET "240245_IsSynced"=1 WHERE "240245_Id"='d' AND NOT EXISTS (SELECT 1 FROM "240245_Outbox" WHERE "240245_Entity"='dishes' AND "240245_EntityId"='d');`);
  assert.equal(db.prepare('SELECT "240245_IsSynced" AS synced FROM "240245_Dish"').get().synced, 0);
  add.run('dishes', 'd', 'delete', '{}');
  db.exec(`DELETE FROM "240245_Dish" WHERE "240245_Id"='d'`);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM "240245_Outbox" WHERE "240245_Operation"=\'delete\'').get().n, 1);
  db.close();
});
