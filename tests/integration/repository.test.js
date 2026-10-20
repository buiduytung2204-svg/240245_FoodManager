// Run the production repository against Node SQLite through the same async interface.
const {
  test
} = require('node:test');
const assert = require('node:assert/strict');
const {
  P
} = require('../../src/domain/dishes.cjs');
const {
  repository
} = require('../helpers/repository.cjs');
test('production seed is atomic and idempotent; locale persists', async () => {
  const {
    api,
    close
  } = repository();
  try {
    await api.initDatabase();
    await api.initDatabase();
    const data = await api.readData();
    assert.equal(data.categories.length, 3);
    assert.equal(data.dishes.length, 5);
    assert.equal(data.images.length, 10);
    assert.equal(data.pending, 8);
    assert.equal(await api.getLanguage(), 'en');
    await api.setLanguage('vi');
    assert.equal(await api.getLanguage(), 'vi');
  } finally {
    close();
  }
});
test('production CRUD validates, queues deletes, cascades images, and protects newer edits', async () => {
  const {
    api,
    close
  } = repository();
  try {
    await api.initDatabase();
    let job;
    while (job = await api.nextJob()) await api.acknowledge(job);
    let data = await api.readData();
    assert.ok(data.dishes.every(d => d[P + 'IsSynced'] === 1));
    const dish = data.dishes[0],
      id = dish[P + 'Id'];
    await assert.rejects(() => api.deleteCategory(dish[P + 'DishCategoryId']), {
      message: 'categoryInUse'
    });
    await assert.rejects(() => api.saveDish({
      ...dish,
      [P + 'Price']: 0
    }, [], id), {
      message: 'invalidPrice'
    });
    assert.equal((await api.readData()).pending, 0);
    const images = data.images.filter(i => i[P + 'DishId'] === id);
    await api.saveDish({
      ...dish,
      [P + 'Name']: 'Changed once'
    }, images, id);
    const older = await api.nextJob();
    await api.saveDish({
      ...dish,
      [P + 'Name']: 'Changed twice'
    }, images, id);
    await api.acknowledge(older);
    assert.equal((await api.readData()).dishes.find(d => d[P + 'Id'] === id)[P + 'IsSynced'], 0);
    await api.acknowledge(await api.nextJob());
    assert.equal((await api.readData()).dishes.find(d => d[P + 'Id'] === id)[P + 'IsSynced'], 1);
    await api.deleteDish(id);
    data = await api.readData();
    assert.equal(data.dishes.length, 4);
    assert.equal(data.images.filter(i => i[P + 'DishId'] === id).length, 0);
    assert.equal((await api.nextJob())[P + 'Operation'], 'delete');
    await assert.rejects(() => api.saveDish(dish, [], id), {
      message: 'notFound'
    });
  } finally {
    close();
  }
});
async function cleanSeed(api) {
  await api.initDatabase();
  let job;
  while (job = await api.nextJob()) await api.acknowledge(job);
  const data = await api.readData();
  return {
    categories: data.categories,
    dishes: data.dishes.map(d => ({
      ...d,
      [P + 'Images']: data.images.filter(i => i[P + 'DishId'] === d[P + 'Id'])
    }))
  };
}
test('pull applies remote creates, updates, deletes and images without echoing them to the outbox', async () => {
  const {
    api,
    close
  } = repository();
  try {
    const snapshot = await cleanSeed(api);
    const first = snapshot.dishes[0];
    first[P + 'Price'] = 88000;
    first[P + 'Images'] = [];
    snapshot.dishes.pop();
    snapshot.dishes.push({
      ...first,
      [P + 'Id']: 'remote-new',
      [P + 'Name']: 'Remote dish'
    });
    await api.applyRemoteSnapshot(snapshot.categories, snapshot.dishes);
    const data = await api.readData();
    assert.equal(data.dishes.length, 5);
    assert.equal(data.dishes.find(d => d[P + 'Id'] === first[P + 'Id'])[P + 'Price'], 88000);
    assert.equal(data.images.filter(i => i[P + 'DishId'] === first[P + 'Id']).length, 0);
    assert.ok(data.dishes.some(d => d[P + 'Id'] === 'remote-new'));
    assert.equal(data.pending, 0);
    assert.ok(data.dishes.every(d => d[P + 'IsSynced'] === 1));
  } finally {
    close();
  }
});
test('download in flight cannot overwrite a newer offline edit or resurrect a pending deletion', async () => {
  const {
    api,
    close
  } = repository();
  try {
    const snapshot = await cleanSeed(api);
    const [first, second] = snapshot.dishes;
    const {
      [P + 'Images']: images,
      ...dish
    } = first;
    await api.saveDish({
      ...dish,
      [P + 'Price']: 99000
    }, images, dish[P + 'Id']);
    await api.deleteDish(second[P + 'Id']);
    await api.applyRemoteSnapshot(snapshot.categories, snapshot.dishes);
    const data = await api.readData();
    assert.equal(data.dishes.find(d => d[P + 'Id'] === dish[P + 'Id'])[P + 'Price'], 99000);
    assert.equal(data.dishes.find(d => d[P + 'Id'] === dish[P + 'Id'])[P + 'IsSynced'], 0);
    assert.ok(!data.dishes.some(d => d[P + 'Id'] === second[P + 'Id']));
    assert.equal(data.pending, 2);
  } finally {
    close();
  }
});
test('malformed or duplicate remote data rolls back the entire download', async () => {
  const {
    api,
    close
  } = repository();
  try {
    const snapshot = await cleanSeed(api);
    const before = JSON.stringify(await api.readData());
    const invalid = [...snapshot.dishes, {
      ...snapshot.dishes[0],
      [P + 'Id']: 'other',
      [P + 'Price']: 0
    }];
    await assert.rejects(() => api.applyRemoteSnapshot(snapshot.categories, invalid), {
      message: 'invalidRemoteData'
    });
    assert.equal(JSON.stringify(await api.readData()), before);
    await assert.rejects(() => api.applyRemoteSnapshot(snapshot.categories, [...snapshot.dishes, snapshot.dishes[0]]), {
      message: 'invalidRemoteData'
    });
    assert.equal(JSON.stringify(await api.readData()), before);
  } finally {
    close();
  }
});
test('server settings persist and queue clean local records for the new endpoint', async () => {
  const {
    api,
    close
  } = repository();
  try {
    await cleanSeed(api);
    assert.equal(await api.getApiUrl(), null);
    await api.setApiUrl('https://example.mockapi.io/api/v1');
    assert.equal(await api.getApiUrl(), 'https://example.mockapi.io/api/v1');
    let data = await api.readData();
    assert.equal(data.pending, 8);
    assert.ok(data.dishes.every(d => d[P + 'IsSynced'] === 0));
    await api.setApiUrl('https://other.mockapi.io/api/v1');
    data = await api.readData();
    assert.equal(data.pending, 8);
  } finally {
    close();
  }
});
