// Real HTTP + production sync worker + production repository on SQLite.
// This emulates MockAPI's REST contract; it is not an external MockAPI account.
const {
  test
} = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const {
  readFileSync
} = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {
  setTimeout: delay
} = require('node:timers/promises');
const {
  repository
} = require('../helpers/repository.cjs');
const {
  P
} = require('../../src/domain/dishes.cjs');
async function setup() {
  const {
    api,
    close
  } = repository();
  await api.initDatabase();
  const records = {
    '240245_DishCategory': [],
    '240245_Dish': []
  };
  let nextId = 1,
    fail = false,
    listener,
    periodic,
    status;
  const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (fail) {
      res.writeHead(503);
      res.end(JSON.stringify({
        error: 'Unavailable'
      }));
      return;
    }
    const parts = new URL(req.url, 'http://localhost').pathname.split('/').filter(Boolean);
    const collection = records[parts[0]];
    if (!collection) {
      res.writeHead(404);
      res.end('{}');
      return;
    }
    if (req.method === 'GET') {
      res.end(JSON.stringify(collection));
      return;
    }
    let body = '';
    for await (const chunk of req) body += chunk;
    if (req.method === 'POST') {
      const row = {
        ...JSON.parse(body),
        id: String(nextId++)
      };
      collection.push(row);
      res.end(JSON.stringify(row));
      return;
    }
    const index = collection.findIndex(r => r.id === parts[1]);
    if (index < 0) {
      res.writeHead(404);
      res.end('{}');
      return;
    }
    if (req.method === 'PUT') {
      collection[index] = {
        ...JSON.parse(body),
        id: parts[1]
      };
      res.end(JSON.stringify(collection[index]));
      return;
    }
    if (req.method === 'DELETE') {
      const [row] = collection.splice(index, 1);
      res.end(JSON.stringify(row));
      return;
    }
    res.writeHead(405);
    res.end('{}');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const source = readFileSync(path.join(__dirname, '../../src/services/sync/syncService.js'), 'utf8').replace(/^import .*;$/gm, '').replace(/export /g, '');
  const context = vm.createContext({
    ...api,
    P,
    process: {
      env: {}
    },
    AbortController,
    fetch,
    setTimeout,
    clearTimeout,
    setInterval: fn => {
      periodic = fn;
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
    }
  });
  vm.runInContext(source + '\nthis.start=startSync;', context);
  const worker = context.start(value => {
    status = value;
  }, async () => {}, base);
  return {
    api,
    records,
    worker,
    network: online => listener({
      isConnected: online,
      isInternetReachable: online
    }),
    retry: () => periodic(),
    status: () => status,
    fail: value => {
      fail = value;
    },
    async dispose() {
      worker.stop();
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
      close();
    }
  };
}
async function waitFor(predicate) {
  for (let i = 0; i < 150; i++) {
    if (await predicate()) return;
    await delay(20);
  }
  throw Error('Timed out waiting for sync');
}
test('HTTP: offline changes upload automatically, remote updates and deletions download', async () => {
  const h = await setup();
  try {
    h.network(false);
    const data = await h.api.readData();
    const {
      [P + 'Id']: oldId,
      ...draft
    } = data.dishes[0];
    const id = await h.api.saveDish({
      ...draft,
      [P + 'Name']: 'Offline HTTP dish'
    }, []);
    assert.equal(h.records['240245_Dish'].length, 0);
    h.network(true);
    await waitFor(() => h.status() === 'online');
    assert.equal((await h.api.readData()).pending, 0);
    const remote = h.records['240245_Dish'].find(d => d[P + 'Id'] === id);
    assert.ok(remote);
    assert.equal(remote[P + 'IsSynced'], 1);
    assert.equal(new Set(h.records['240245_Dish'].map(d => d[P + 'Id'])).size, h.records['240245_Dish'].length);
    remote[P + 'Price'] = 123456;
    await h.retry();
    assert.equal((await h.api.readData()).dishes.find(d => d[P + 'Id'] === id)[P + 'Price'], 123456);
    h.records['240245_Dish'].splice(h.records['240245_Dish'].indexOf(remote), 1);
    await h.retry();
    assert.ok(!(await h.api.readData()).dishes.some(d => d[P + 'Id'] === id));
  } finally {
    await h.dispose();
  }
});
test('HTTP: API errors keep the outbox and automatic retry recovers without data loss', async () => {
  const h = await setup();
  try {
    h.fail(true);
    h.network(true);
    await waitFor(() => h.status() === 'syncError');
    assert.equal((await h.api.readData()).pending, 8);
    assert.ok((await h.api.readData()).dishes.every(d => d[P + 'IsSynced'] === 0));
    h.fail(false);
    await h.retry();
    assert.equal(h.status(), 'online');
    assert.equal((await h.api.readData()).pending, 0);
    assert.equal(h.records['240245_Dish'].length, 5);
  } finally {
    await h.dispose();
  }
});
