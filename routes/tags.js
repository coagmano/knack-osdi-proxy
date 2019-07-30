const bridge = require("../lib/bridge");
const config = require("../config");
const objects = require("../lib/knack-api-client/objects");
const osdi = require("../lib/osdi");
const taglist = require("../lib/knack-api-client/tags");

function translateToOSDITag(tag) {
  const { name } = tag;
  const answer = {
    ...osdi.response.createCommonItem(),
    origin_system: "Knack-UnitedVoice",
    name,
    description: name,
  };
  osdi.response.addIdentifier(answer, "Knack:" + name);
  osdi.response.addSelfLink(answer, `tags/${name}`);
  osdi.response.addLink(answer, "taggings", `tags/${name}/taggings`);
  osdi.response.addCurie(answer, config.get("curieTemplate"));
  return answer;
}
function translateToOSDITagging(tagging) {
  const { personId, tagName } = tagging;
  const answer = {
    origin_system: "Knack",
    item_type: "osdi:person",
  };
  osdi.response.addIdentifier(answer, `Knack:${personId}-${tagName}`);
  osdi.response.addSelfLink(answer, `tagging/${personId}-${tagName}`);
  osdi.response.addLink(answer, "osdi:tag", `tags/${tagName}`);
  osdi.response.addLink(answer, "osdi:person", `people/${personId}`);
  osdi.response.addCurie(answer, config.get("curieTemplate"));

  return answer;
}

function getAll(request, response) {
  const paginationParams = bridge.getKnackPaginationParams(request);
  const { page, rows_per_page } = paginationParams;
  const listResource = {
    total_pages: Math.ceil(taglist.length / rows_per_page),
    current_page: page,
    total_records: taglist.length,
    records: taglist.slice(rows_per_page * (page - 1), rows_per_page * page),
  };
  bridge.sendMultiResourceResponse(
    listResource,
    paginationParams,
    translateToOSDITag,
    "tags",
    response
  );
}

function getOne(request, response) {
  const tag = taglist.find(({ name }) => name === request.params.id);

  bridge.sendSingleResourceResponse(tag, translateToOSDITag, "tag", response);
}

function getTagging(request, response) {
  const [personId, ...rest] = request.params.id.split("-");
  const tagName = rest.join("-");
  bridge.sendSingleResourceResponse(
    { personId, tagName },
    translateToOSDITagging,
    "tag",
    response
  );
}

function getTaggings(request, response) {
  const client = bridge.createClient(request);
  const paginationParams = bridge.getKnackPaginationParams(request);
  const { page, rows_per_page } = paginationParams;
  const tagName = request.params.id;
  const tag = taglist.find(({ name }) => name === tagName);

  const filter = [{ field: tag.field, operator: "is", value: tag.value }];
  const resource = client
    .findRecord(objects.members, filter, page, rows_per_page)
    .then(result => {
      return {
        total_pages: result.total_pages,
        current_page: result.current_page,
        total_records: result.total_records,
        per_page: paginationParams.rows_per_page,

        records: result.records.map(person => ({
          tagName,
          personId: person.id,
        })),
      };
    });
  bridge.sendMultiResourceResponse(
    resource,
    paginationParams,
    translateToOSDITagging,
    "tagging",
    response
  );
}

function createTagging(request, response) {
  const tagName = request.params.id;
  const tag = taglist.find(({ name }) => name === tagName);
  if (!tag) return osdi.response.notFound(response)();

  const targetLink = request.body._links["osdi:person"].href;
  const personId = /people\/(\w+)\/?/.exec(targetLink)[1];

  const client = bridge.createClient(request);

  const modifier = { [tag.field]: tag.value };
  const resource = client
    .updateRecord(objects.members, personId, modifier)
    .then(person => {
      return { tagName, personId: person.id };
    });

  bridge.sendSingleResourceResponse(
    resource,
    translateToOSDITagging,
    "tagging",
    response
  );
  // update person's fields
}

module.exports = function(app) {
  app.get("/api/v1/tags", getAll);
  app.get("/api/v1/tags/:id", getOne);
  app.get("/api/v1/tags/:id/taggings", getTaggings);
  app.post("/api/v1/tags/:id/taggings", createTagging);

  app.get("/api/v1/tagging/:id", getTagging);
};
module.exports.translateToOSDITagging = translateToOSDITagging;
