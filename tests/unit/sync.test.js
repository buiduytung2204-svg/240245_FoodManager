const {
  test
} = require('node:test');
const assert = require('node:assert/strict');
const {
  readFileSync
} = require('node:fs');
const vm = require('node:vm');
const {
  P
} = require('../../src/domain/dishes.cjs');
const source = readFileSync(require('node:path').join(__dirname, '../../src/services/sync/syncService.js'), 'utf8').replace(/^import .*;$/gm, '').replace(/export /g, '');
function harness() {
  let listener,
    interval,
    failAfterPost = false,
    pausePost = false,
    releasePost;
  const records = [],
    statuses = [],
    queue = [],
    downloads = [];
  const context = vm.createContext({
    P,
    process: {
      env: {
        EXPO_PUBLIC_MOCKAPI_URL: 'https://test.invalid/api/v1'
      }
    },
    AbortController,
    setTimeout,
    clearTimeout,
    setInterval: fn => {
      interval = fn;
      return 1;
    },
    clearInterval: () => {},
    NetInfo: {
      addEventListener: fn => {
        listener = fn;
        return () => {};
      }
    },
    AppState: {
      addEventListener: () => ({
        remove() {}
      })
    },
    nextJob: async () => queue[0],
    acknowledge: async () => queue.shift(),
    applyRemoteSnapshot: async (categories, dishes) => downloads.push({
      categories,
      dishes
    }),
    fetch: async (url, options) => {
      const method = options.method || 'GET';
      if (method === 'GET') return {
        ok: true,
        status: 200,
        json: async () => url.endsWith('/240245_DishCategory') ? [] : structuredClone(records)
      };
      if (method === 'POST') {
        records.push({
          ...JSON.parse(options.body),
          id: 'server-42'
        });
        if (failAfterPost) {
          failAfterPost = false;
          throw Error('lost response');
        }
        if (pausePost) await new Promise(resolve => {
          releasePost = resolve;
        });
      }
      if (method === 'PUT') {
        assert.ok(url.endsWith('/server-42'));
        Object.assign(records[0], JSON.parse(options.body));
      }
      if (method === 'DELETE') {
        assert.ok(url.endsWith('/server-42'));
        records.length = 0;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({})
      };
    }
  });
  vm.runInContext(source + '\nthis.api={startSync,send};', context);
  const job = (operation = 'upsert') => ({
    [P + 'Sequence']: queue.length + 1,
    [P + 'Entity']: 'dishes',
    [P + 'EntityId']: 'local-uuid',
    [P + 'Operation']: operation,
    [P + 'Payload']: JSON.stringify({
      [P + 'Id']: 'local-uuid',
      [P + 'Name']: 'Pho',
      [P + 'IsSynced']: 0,
      [P + 'Images']: []
    })
  });
  return {
    api: context.api,
    queue,
    records,
    statuses,
    downloads,
    job,
    network: v => listener({
      isConnected: v,
      isInternetReachable: v
    }),
    retry: () => interval(),
    failPost: () => {
      failAfterPost = true;
    },
    holdPost: () => {
      pausePost = true;
    },
    releasePost: () => releasePost()
  };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
test('automatic reconnect drains offline jobs without manual sync; uses provider ID on delete', async () => {
  const h = harness();
  h.queue.push(h.job());
  const worker = h.api.startSync(s => h.statuses.push(s), async () => {});
  h.network(false);
  await settle();
  assert.equal(h.records.length, 0);
  assert.equal(h.queue.length, 1);
  h.network(true);
  await settle();
  assert.equal(h.records.length, 1);
  assert.equal(h.queue.length, 0);
  assert.equal(h.records[0][P + 'IsSynced'], 1);
  assert.equal(h.downloads.length, 1);
  assert.equal(h.downloads[0].dishes.length, 1);
  h.queue.push(h.job('delete'));
  await h.retry();
  assert.equal(h.records.length, 0);
  assert.equal(h.queue.length, 0);
  worker.stop();
});
test('lost POST response retains job, retry updates existing record without duplicate', async () => {
  const h = harness();
  h.queue.push(h.job());
  h.failPost();
  const worker = h.api.startSync(s => h.statuses.push(s), async () => {});
  h.network(true);
  await settle();
  assert.equal(h.queue.length, 1);
  assert.equal(h.records.length, 1);
  assert.ok(h.statuses.includes('syncError'));
  await h.retry();
  assert.equal(h.queue.length, 0);
  assert.equal(h.records.length, 1);
  worker.stop();
});
test('stopping the worker during a request cannot acknowledge a job or apply an old server snapshot', async () => {
  const h = harness();
  h.queue.push(h.job());
  h.holdPost();
  const worker = h.api.startSync(s => h.statuses.push(s), async () => {});
  h.network(true);
  await settle();
  assert.equal(h.records.length, 1);
  worker.stop();
  h.releasePost();
  await settle();
  assert.equal(h.queue.length, 1);
  assert.equal(h.downloads.length, 0);
});
