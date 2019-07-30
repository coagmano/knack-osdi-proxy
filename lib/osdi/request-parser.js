const config = require("../../config");
const _ = require("lodash");

function getAPIToken(request) {
  if (!request || !request.headers || !request.headers || !request.headers["osdi-api-token"]) {
    return "";
  }
  return request.headers["osdi-api-token"];
}

function getExpands(request, defaults) {
  let expands = defaults;
  const query = request.query;

  if (query.expand) {
    expands = defaults.concat(query.expand.split(","));
  }

  expands = _.uniq(expands);
  return expands;
}

function getFilter(request) {
  const query = request.query;
  const filter = {};
  if (query.starting_before) {
    filter.startingBefore = query.starting_before;
  }
  if (query.starting_after) {
    filter.startingAfter = query.starting_after;
  }
  if (query.code_ids) {
    filter.codeIds = query.code_ids;
  }

  return filter;
}

function getPaginationOptions(request) {
  const options = {};
  if (!request || !request.query) {
    return options;
  }

  const query = request.query;
  if (query.per_page) {
    options.perPage = parseInt(query.per_page, 10);
  } else {
    options.perPage = config.get("defaultKnackPageSize");
  }

  if (query.page) {
    options.page = parseInt(query.page, 10);
  }

  return options;
}

module.exports = {
  getExpands: getExpands,
  getFilter: getFilter,
  getAPIToken: getAPIToken,
  getPaginationOptions: getPaginationOptions,
};

