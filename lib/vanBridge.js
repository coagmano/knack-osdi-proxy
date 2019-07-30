
/**
 * Creates a bridge between OSDI and VAN using the osdi and ngpvan-api-client
 * modules.
 */

const knackAPIClient = require('./knack-api-client');
const osdi = require('../lib/osdi');
const config = require('../config');
const _ = require('lodash');

/**
 * Take an OSDI request and create a VAN client.
 */
function createClient(req) {

  var apiToken = osdi.request.getAPIToken(req);
  var credentials = getCredentials(apiToken);

  return knackAPIClient(endpoint, credentials.apiKey, credentials.dbMode);
}

function getCredentials(apiToken) {
  if (typeof apiToken !== 'string') {
    return {};
  }

  var parts = apiToken.split('|');
  return { apiKey: parts[0], dbMode: parts[1] };
}

function getKnackPaginationParams(req) {
  var pagination = osdi.request.getPaginationOptions(req);

  var perPage = config.get('defaultKnackPageSize');

  if (pagination.page && pagination.perPage) {
    perPage = pagination.perPage;
  }
  if (pagination.perPage) {
    perPage = pagination.perPage;
  }

  return { 'rows_per_page': perPage, 'page': pagination.page, 'url': req.url };
}

/**
 * Send an OSDI "single-resource" response, given the VAN resource promise
 * and a translator function.
 */
function sendSingleResourceResponse(resourcePromise, translator,
  resourceType, res) {

  resourcePromise.
    then(function(vanResource) {
  	  var osdiResource = translator(vanResource);
      return res.status(200).send(osdiResource);
    }).
    catch(knackAPIClient.errors.Forbidden,
      function() { return osdi.response.unauthorized(res); }).
    catch(knackAPIClient.errors.BadRequest, function(ex) {
      var errors = translateVANErrors(ex);
      return osdi.response.badRequest(res, resourceType)(errors);
    }).
    catch(knackAPIClient.errors.NotFound, function(ex) {
      return osdi.response.notFound(res, resourceType)(ex);
    }).
    catch(knackAPIClient.errors.Unexpected, function (ex) {
      var referenceCode = ex.referenceCode;
      return osdi.response.unexpected(res, resourceType)(referenceCode);
    }).
    catch(function(ex) {
      console.trace('Uncaught exception while returning resource', ex);
      return osdi.response.unexpected(res, resourceType)();
    });
}

function translateVANErrors(badRequestEx) {
  var errors = badRequestEx.errors;

  var answer = [];

  _.forEach(errors, function(error) {
    answer.push({
      error_code: error.code,
      description: error.text,
      properties: error.properties,
      hint: error.hint
    });
  });

  return answer;
}

/**
 * Send an OSDI "single-resource" response, given the VAN resource promise and
 * OSDI pagination parameters, and a function for translating a single
 * VAN resource into a single OSDI resource.
 */
function sendMultiResourceResponse(resourcePromise, vanPaginationParams,
  translator, resourceType, res) {

  resourcePromise.
    then(function(vanResources) {
      var totalRecords = vanResources.count;

      var totalPages = Math.ceil(totalRecords / vanPaginationParams.top);
      var page = Math.floor(vanPaginationParams.skip / vanPaginationParams.top)
        + 1;

      var answer = osdi.response.createPaginatedItem(page,
        vanPaginationParams.top, totalPages, totalRecords, resourceType);

      osdi.response.addLink(answer,'self',vanPaginationParams.url);
      var items = vanResources.items;
      osdi.response.addEmbeddedItems(answer, items, translator, resourceType);
      osdi.response.addCurie(answer, config.get('curieTemplate'));

      return res.status(200).send(answer);
    }).
    catch(knackAPIClient.errors.Forbidden,
      function() { return osdi.response.unauthorized(res)(); }).
    catch(knackAPIClient.errors.BadRequest, function(ex) {
      var errors = translateVANErrors(ex);
      return osdi.response.badRequest(res, resourceType)(errors);
    }).
    catch(knackAPIClient.errors.NotFound, function(ex) {
      return osdi.response.notFound(res, resourceType)(ex);
    }).
    catch(knackAPIClient.errors.Unexpected, function (ex) {
      var referenceCode = ex.referenceCode;
      return osdi.response.unexpected(res, resourceType)(referenceCode);
    }).
    catch(function(ex) {
      console.trace('Uncaught exception while returning resource', ex);
      return osdi.response.unexpected(res, resourceType)();
    });
}

module.exports = {
  createClient: createClient,
  getKnackPaginationParams: getKnackPaginationParams,
  sendSingleResourceResponse: sendSingleResourceResponse,
  sendMultiResourceResponse: sendMultiResourceResponse
};
