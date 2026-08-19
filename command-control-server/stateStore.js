// command-control-server/stateStore.js
const Redis = require('ioredis');

let mode = 'memory';
let redisPub = null;
let redisSub = null;
let redisSnapshot = null; // shared Redis client for snapshot hashes
const memoryChannels = new Map(); // channel -> Set(handler)
const memorySnapshot = new Map(); // id -> data

function init({ redisUrl } = {}) {
  if (!redisUrl) {
    mode = 'memory';
    return;
  }

  try {
    mode = 'redis';
    redisPub = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      lazyConnect: false,
      enableOfflineQueue: false
    });
    redisSub = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      lazyConnect: false,
      enableOfflineQueue: false
    });
    redisSnapshot = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      lazyConnect: false,
      enableOfflineQueue: false
    });

    redisSub.on('message', (channel, message) => {
      const handlers = memoryChannels.get(channel);
      if (!handlers || handlers.size === 0) return;

      let payload;
      try {
        payload = JSON.parse(message);
      } catch (err) {
        console.error(`[stateStore] failed to parse Redis message on ${channel}`, err);
        return;
      }

      for (const handler of handlers) {
        try {
          handler(payload);
        } catch (hErr) {
          console.error(`[stateStore] handler error on ${channel}:`, hErr);
        }
      }
    });

    redisPub.on('error', (err) => {
      console.error('[stateStore] redis publish client error', err.message);
    });
    redisSub.on('error', (err) => {
      console.error('[stateStore] redis subscriber client error', err.message);
    });
    redisSnapshot.on('error', (err) => {
      console.error('[stateStore] redis snapshot client error', err.message);
    });
  } catch (err) {
    console.error('[stateStore] Failed to initialize Redis, falling back to memory:', err.message);
    mode = 'memory';
  }
}

async function publish(channel, payload) {
  if (mode === 'memory') {
    const handlers = memoryChannels.get(channel);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(payload);
        } catch (hErr) {
          console.error(`[stateStore] memory handler error on ${channel}:`, hErr);
        }
      }
    }
    return;
  }

  try {
    await redisPub.publish(channel, JSON.stringify(payload));
  } catch (err) {
    console.error(`[stateStore] publish error on ${channel}:`, err.message);
  }
}

function subscribe(channel, handler) {
  const handlers = memoryChannels.get(channel) || new Set();
  handlers.add(handler);
  memoryChannels.set(channel, handlers);

  if (mode === 'redis') {
    redisSub.subscribe(channel).catch((err) => {
      console.error(`[stateStore] failed to subscribe to ${channel}`, err.message);
    });
  }

  return () => {
    handlers.delete(handler);
    if (handlers.size === 0) {
      memoryChannels.delete(channel);
      if (mode === 'redis') {
        redisSub.unsubscribe(channel).catch(() => {});
      }
    }
  };
}

async function updateSnapshot(id, data) {
  if (mode === 'memory') {
    memorySnapshot.set(id, data);
    return;
  }

  try {
    await redisSnapshot.hset('telemetry:snapshot', id, JSON.stringify(data));
  } catch (err) {
    console.error(`[stateStore] updateSnapshot error for ${id}:`, err.message);
    memorySnapshot.set(id, data); // local fallback
  }
}

async function getSnapshot() {
  if (mode === 'memory') {
    return Object.fromEntries(memorySnapshot);
  }

  try {
    const raw = await redisSnapshot.hgetall('telemetry:snapshot');
    const snapshot = {};
    for (const [id, json] of Object.entries(raw)) {
      try {
        snapshot[id] = JSON.parse(json);
      } catch (err) {
        console.error(`[stateStore] failed to parse snapshot for ${id}`, err.message);
      }
    }
    return snapshot;
  } catch (err) {
    console.error('[stateStore] getSnapshot error:', err.message);
    return Object.fromEntries(memorySnapshot);
  }
}

async function removeSnapshot(id) {
  if (mode === 'memory') {
    memorySnapshot.delete(id);
    return;
  }

  try {
    await redisSnapshot.hdel('telemetry:snapshot', id);
  } catch (err) {
    console.error(`[stateStore] removeSnapshot error for ${id}:`, err.message);
    memorySnapshot.delete(id);
  }
}

async function close() {
  if (mode === 'redis') {
    try { if (redisPub) await redisPub.quit(); } catch (e) {}
    try { if (redisSub) await redisSub.quit(); } catch (e) {}
    try { if (redisSnapshot) await redisSnapshot.quit(); } catch (e) {}
  }
  memoryChannels.clear();
  memorySnapshot.clear();
  mode = 'memory';
}

function getMode() {
  return mode;
}

module.exports = {
  init,
  publish,
  subscribe,
  updateSnapshot,
  getSnapshot,
  removeSnapshot,
  close,
  getMode
};
