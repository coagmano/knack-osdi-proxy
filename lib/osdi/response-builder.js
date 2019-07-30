const config = require("../../config");
const root = config.get("apiEndpoint");

function createCommonItem() {
  const embedded = {
    origin_system: "Knack",
  };
  return embedded;
}

function createPaginatedItem(page, perPage, totalPages, totalRecords, path) {
  const paginated = {
    total_pages: totalPages,
    per_page: perPage || 100,
    page: page,
    total_records: totalRecords,
  };

  if (typeof page !== "undefined" && page < 0) {
    throw new Error("page must be a non-negative integer");
  }

  if (page < totalPages) {
    const nextPath = new URL(root + path);
    nextPath.searchParams.set("page", page + 1);
    nextPath.searchParams.set("per_page", perPage);
    addRawLink(paginated, "next", nextPath);
  }
  if (page > 1) {
    const previousPath = new URL(root + path);
    previousPath.searchParams.set("page", page - 1);
    previousPath.searchParams.set("per_page", perPage);
    addRawLink(paginated, "previous", previousPath);
  }

  return paginated;
}

function addEmbeddedItems(paginated, items, formatter, resourceType) {
  if (resourceType) {
    paginated._embedded = {
      [`osdi:${resourceType}`]: items.map(formatter),
    };
  } else {
    paginated._embedded = items.map(formatter);
  }
}

function addEmbeddedItem(paginated, item, formatter, resourceType) {
  if (resourceType) {
    paginated._embedded = {
      [`osdi:${resourceType}`]: formatter(item),
    };
  } else {
    paginated._embedded = formatter(item);
  }
}

function addItemLinks(paginated, items, formatter, resourceType) {
  paginated._links = paginated._links || {};
  const key = `osdi:${resourceType}`;
  paginated._links[key] = items.map(formatter).map(item => item._links.self);
}

function addLink(item, name, path) {
  item._links = item._links || {};
  item._links[name] = {
    href: root + path,
  };
}

function addRawLink(item, name, path) {
  item._links = item._links || {};
  item._links[name] = {
    href: path,
  };
}

function addSelfLink(item, path) {
  addLink(item, "self", path);
}

function addIdentifier(item, identifier) {
  item.identifiers = item.identifiers || [];
  item.identifiers.push(identifier);
}

function addCurie(item, template) {
  item._links = item._links || {};
  item._links.curies = [
    {
      name: "osdi",
      href: template,
      templated: true,
    },
  ];
}

function unauthorized(response) {
  return function() {
    return response.status(401).end();
  };
}

function badRequest(response, type) {
  return function(errors) {
    const response_code = 400;

    const answer = {
      request_type: "atomic",
      response_code: response_code,
      resource_status: [
        {
          resource: "osdi:" + type,
          response_code: response_code,
          errors: errors,
        },
      ],
    };

    return response.status(response_code).send(answer);
  };
}

function notFound(response) {
  return function() {
    return response.status(404).end();
  };
}

function unexpected(response, type) {
  return function(referenceCode) {
    const response_code = 500;

    const answer = {
      request_type: "atomic",
      response_code: response_code,
      resource_status: [
        {
          resource: "osdi:" + type,
          response_code: response_code,
          error_descriptions: [
            {
              error_code: "UNEXPECTED_ERROR",
              description: "An unexpected error has occurred",
              properties: [],
              reference_code: referenceCode,
            },
          ],
        },
      ],
    };

    return response.status(response_code).send(answer);
  };
}

module.exports = {
  createCommonItem,
  createPaginatedItem,
  addEmbeddedItems,
  addEmbeddedItem,
  addItemLinks,
  addLink,
  addSelfLink,
  addIdentifier,
  addCurie,
  unauthorized,
  badRequest,
  notFound,
  unexpected,
};
