/**
 * Creates a bridge between OSDI and Knack
 * modules.
 */

const _ = require("lodash");

const { APIClient, UserClient, errors } = require("./knack-api-client");
const Cache = require('./cache');
const config = require("../config");
const osdi = require("../lib/osdi");

const root = config.get("apiEndpoint");

const { pathname: rootPath } = new URL(root);
const personCache = new Cache();

/**
 * Take an OSDI request and create a VAN client.
 */
function createClient(request) {
  const apiToken = osdi.request.getAPIToken(request);
  const credentials = getCredentials(apiToken);
  return APIClient(credentials.apiKey, credentials.dbMode);
}

async function createUserClient() {
  const username = config.get("knackUsername");
  const password = config.get("knackPassword");
  const { client, readyPromise } = UserClient(username, password);
  await readyPromise;
  return client;
}

function getCredentials(apiToken) {
  if (typeof apiToken !== "string") {
    return {};
  }
  const parts = apiToken.split("|");
  return { apiKey: parts[0], dbMode: parts[1] };
}

function getKnackPaginationParams(request) {
  const pagination = osdi.request.getPaginationOptions(request);

  return {
    rows_per_page: pagination.perPage || config.get("defaultKnackPageSize"),
    page: pagination.page || 1,
    url: request.url.replace(rootPath, ""),
  };
}

/**
 * Send an OSDI "single-resource" response, given a resource promise
 * and a translator function.
 */
function sendSingleResourceResponse(
  resource,
  translator,
  resourceType,
  response
) {
  Promise.resolve(resource)
    .then(function(resource) {
      if (!resource) return osdi.response.notFound(response)();

      const osdiResource = translator(resource);
      return response.status(200).send(osdiResource);
    })
    .catch(error => {
      if (error instanceof errors.Forbidden) {
        return osdi.response.unauthorized(response);
      }
      if (error instanceof errors.BadRequest) {
        const errors = translateKnackErrors(error);
        return osdi.response.badRequest(response, resourceType)(errors);
      }
      if (error instanceof errors.NotFound) {
        return osdi.response.notFound(response, resourceType)(error);
      }
      if (error instanceof errors.Unexpected) {
        const referenceCode = error.referenceCode;
        return osdi.response.unexpected(response, resourceType)(referenceCode);
      }
      throw error;
    })
    .catch(error => {
      console.trace("Uncaught exception while returning resource", error);
      return osdi.response.unexpected(response, resourceType)(error);
    });
}

function translateKnackErrors(badRequestEx) {
  const errors = badRequestEx.errors;

  const answer = [];

  _.forEach(errors, function(error) {
    answer.push({
      error_code: error.code,
      description: error.text,
      properties: error.properties,
      hint: error.hint,
    });
  });

  return answer;
}

/**
 * Send an OSDI "single-resource" response, given a resource promise and
 * OSDI pagination parameters, and a function for translating single resources
 */
function sendMultiResourceResponse(
  resource,
  paginationParams,
  translator,
  resourceType,
  response
) {
  Promise.resolve(resource)
    .then(function(knackResources) {
      const {
        total_pages,
        current_page,
        total_records,
        records,
      } = knackResources;

      const answer = osdi.response.createPaginatedItem(
        current_page,
        paginationParams.rows_per_page,
        total_pages,
        total_records,
        paginationParams.url
      );
      osdi.response.addSelfLink(answer, paginationParams.url);
      osdi.response.addCurie(answer, config.get("curieTemplate"));
      osdi.response.addItemLinks(answer, records, translator, resourceType);
      osdi.response.addEmbeddedItems(answer, records, translator, resourceType);

      return response.status(200).send(answer);
    })
    .catch(error => {
      if (error instanceof errors.Forbidden) {
        return osdi.response.unauthorized(response)();
      }
      if (error instanceof errors.BadRequest) {
        return osdi.response.badRequest(response, resourceType)(error);
      }
      if (error instanceof errors.NotFound) {
        return osdi.response.notFound(response, resourceType)(error);
      }
      if (error instanceof errors.Unexpected) {
        const referenceCode = error.referenceCode;
        return osdi.response.unexpected(response, resourceType)(referenceCode);
      }
      throw error;
    })
    .catch(error => {
      console.trace("Uncaught exception while returning resource", error);
      return osdi.response.unexpected(response, resourceType)();
    });
}

module.exports = {
  createClient,
  createUserClient,
  getKnackPaginationParams,
  sendSingleResourceResponse,
  sendMultiResourceResponse,
  personCache,
};
