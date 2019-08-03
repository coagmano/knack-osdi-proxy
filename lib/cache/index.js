const { debuglog } = require("util");

const debug = debuglog("proxy-cache");

function start(cache) {
  if (cache.interval > 0) {
    cache.timer = setTimeout(() => cache.clean(), cache.interval * 1000);
  }
}

function stop(cache) {
  if (cache.timer) {
    clearTimeout(cache.timer);
    cache.timer = false;
  }
}

module.exports = class Cache {
  constructor(options = {}) {
    this.timer = false;
    this.ttl = options.ttl || 600;
    this.interval = options.interval || 300;
    this.store = options.store || new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      keys: 0,
    };
    start(this);
    debug("cache created");
  }

  set(key, value) {
    const expiry = Date.now() + this.ttl * 1000;
    this.store.set(key, { value, expiry });
    this.stats.keys = this.store.size;
    return this;
  }

  get(key) {
    let value;
    if (this.store.has(key)) {
      this.stats.hits++;
      debug(`cache hit: ${key}`);
      value = this.store.get(key).value;
    } else {
      debug(`cache miss: ${key}`);
      this.stats.misses++;
    }
    return value;
  }

  has(key) {
    return this.store.has(key);
  }

  clean() {
    stop(this);
    const now = Date.now();
    for (const [key, { expiry }] of Object.entries(this.store)) {
      if (expiry && expiry < now) {
        this.store.delete(key);
      }
    }
    this.stats.keys = this.store.size;
    start(this);
    debug(
      `cache sweep run. Stats - hits:${this.stats.hits}, misses:${this.stats.misses}, keys: ${this.stats.keys}`
    );
  }
};
