const { RateLimiter } = require("limiter");

const KnackClient = require("./client");
const config = require("../../config");
const errors = require("./errors");

const API_KEY = config.get("knackAPIKey");
const APP_ID = config.get("knackAppID");

const clientCache = new Map();
const limiter = new RateLimiter(10, "second");

module.exports = {
  APIClient(apiKey) {
    if (clientCache.has(apiKey)) return clientCache.get(apiKey);

    const client = new KnackClient({
      app_id: APP_ID,
      api_key: apiKey || API_KEY,
      limiter,
    });
    clientCache.set(apiKey, client);
    return client;
  },
  UserClient(username, password) {
    if (clientCache.has(username)) return clientCache.get(username);

    const client = new KnackClient({
      app_id: APP_ID,
      api_key: "knack",
      limiter,
    });
    const readyPromise = client.authenticate(username, password);
    const wrapper = {
      client,
      readyPromise,
    };
    clientCache.set(username, wrapper);
    return wrapper;
  },
};
module.exports.errors = errors;

// return {
//   people: require('./people')(client),
//   lists: require('./lists')(client),
//   tags: require('./tags')(client),
//   taggings: require('./taggings')(client),
// };
