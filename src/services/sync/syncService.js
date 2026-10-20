import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import { nextJob, acknowledge, applyRemoteSnapshot } from '../../repositories';
import { P } from '../../models/fields.cjs';
const resources = {
  categories: '240245_DishCategory',
  dishes: '240245_Dish'
};
async function request(base, path, options = {}, lifetime) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (lifetime?.aborted) throw Error('Cancelled');
  lifetime?.addEventListener('abort', abort, {
    once: true
  });
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${base}/${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) throw Error(`HTTP ${response.status}`);
    if (response.status === 204) return null;
    return await response.json();
  } finally {
    clearTimeout(timer);
    lifetime?.removeEventListener('abort', abort);
  }
}
async function send(base, job, signal) {
  const entity = job[P + 'Entity'],
    localId = job[P + 'EntityId'],
    resource = resources[entity];
  if (!resource) throw Error('Invalid queued entity');
  // MockAPI owns its numeric `id`; never use a local UUID as its REST path.
  // Read then match exactly, including after a previous POST timed out.
  const records = await request(base, resource, {}, signal);
  if (!Array.isArray(records)) throw Error('Invalid API response');
  const matches = records.filter(r => r[P + 'Id'] === localId);
  const remotePath = r => {
    if (r.id === undefined || r.id === null) throw Error('invalidRemoteData');
    return `${resource}/${encodeURIComponent(r.id)}`;
  };
  if (job[P + 'Operation'] === 'delete') {
    for (const r of matches) await request(base, remotePath(r), {
      method: 'DELETE'
    }, signal);
    return;
  }
  const payload = JSON.parse(job[P + 'Payload']);
  if (entity === 'dishes') payload[P + 'IsSynced'] = 1;
  const body = JSON.stringify(payload);
  if (matches.length) {
    await request(base, remotePath(matches[0]), {
      method: 'PUT',
      body
    }, signal);
    for (const extra of matches.slice(1)) await request(base, remotePath(extra), {
      method: 'DELETE'
    }, signal);
  } else await request(base, resource, {
    method: 'POST',
    body
  }, signal);
}
export function startSync(onStatus, onChanged, apiUrl = process.env.EXPO_PUBLIC_MOCKAPI_URL || '') {
  const base = apiUrl.replace(/\/+$/, '');
  const lifetime = new AbortController();
  let stopped = false,
    running = false,
    online = false;
  async function kick() {
    if (stopped || running || !online) return;
    if (!base || base.includes('YOUR_PROJECT')) {
      onStatus('unconfigured');
      return;
    }
    running = true;
    try {
      onStatus('syncing');
      do {
        let job;
        while (!stopped && online && (job = await nextJob())) {
          await send(base, job, lifetime.signal);
          if (stopped) return;
          await acknowledge(job);
          await onChanged();
        }
        if (stopped || !online) break;
        const categories = await request(base, resources.categories, {}, lifetime.signal);
        const dishes = await request(base, resources.dishes, {}, lifetime.signal);
        if (stopped) return;
        await applyRemoteSnapshot(categories, dishes);
        await onChanged();
        // Upload edits made while the GET requests were in flight as well.
      } while (!stopped && online && (await nextJob()));
      if (!stopped) onStatus(online ? 'online' : 'offline');
    } catch (error) {
      if (!stopped) onStatus(online ? 'syncError' : 'offline');
    } finally {
      running = false;
    }
  }
  const unsubscribe = NetInfo.addEventListener(s => {
    online = s.isConnected === true && s.isInternetReachable !== false;
    if (!stopped) onStatus(online ? 'online' : 'offline');
    if (online) void kick();
  });
  const subscription = AppState.addEventListener('change', s => {
    if (s === 'active') void kick();
  });
  const timer = setInterval(kick, 15000);
  return {
    kick,
    stop() {
      stopped = true;
      lifetime.abort();
      unsubscribe();
      subscription.remove();
      clearInterval(timer);
    }
  };
}
