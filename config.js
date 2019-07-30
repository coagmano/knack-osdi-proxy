/* eslint-disable eqeqeq, unicorn/prevent-abbreviations */

// Try to default from process.env:
// http://nodejs.org/api/process.html#process_process_env
const cfg = {
  port: process.env.PORT || 8000,
  apiEndpoint: process.env.API_ENDPOINT,
  defaultVanPageSize: 250,
  defaultKnackPageSize: 250,
  requireHttps: process.env.REQUIRE_HTTPS || false,
  curieTemplate:
    process.env.CURIE_TEMPLATE || "http://opensupporter.github.io/osdi-docs/{rel}",
  node_env: process.env.NODE_ENV || "development",
  prettyJSON: process.env.PRETTY_JSON == "true" || false,
  knackAppID: process.env.KNACK_APP_ID,
  knackAPIKey: process.env.KNACK_API_KEY,
  knackUsername: process.env.KNACK_USERNAME,
  knackPassword: process.env.KNACK_PASSWORD,
};

module.exports = {
  get(varName) {
    if (Object.prototype.hasOwnProperty.call(cfg, varName)) {
      return cfg[varName];
    }
    throw new Error("Config value not found: " + varName);
  },
};
