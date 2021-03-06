const { format } = require("date-fns");

const { translateToOSDIPerson } = require("./people");
const bridge = require("../lib/bridge");
const config = require("../config");
const lists = require("../lib/knack-api-client/lists");
const osdi = require("../lib/osdi");

function translateToOSDIList(knackList) {
  const { id, name } = knackList;
  const [scene, view] = id.split("-");
  const todaysName = `${name} ${format(new Date(), "DDMMYYYY")}`;
  const answer = {
    ...osdi.response.createCommonItem(),
    identifiers: [`Knack:${id}`],
    name: todaysName,
    title: todaysName,
    administrative_url: `https://builder.knack.com/unitedvoice/second#pages/scene_${scene}/views/view_${view}`,
    // total_items, // TODO: Compute this property?
  };
  osdi.response.addSelfLink(answer, `lists/${id}`);
  osdi.response.addLink(answer, "osdi:items", `lists/${id}/items`);
  osdi.response.addCurie(answer, config.get("curieTemplate"));

  return answer;
}

function getOne(request, response) {
  const list = lists.find(({ id }) => id === request.params.id);

  bridge.sendSingleResourceResponse(
    list,
    translateToOSDIList,
    "lists",
    response
  );
}

function getMany(request, response) {
  const paginationParams = bridge.getKnackPaginationParams(request);
  const { page, rows_per_page } = paginationParams;
  const listResource = {
    total_pages: Math.ceil(lists.length / rows_per_page),
    current_page: page,
    total_records: lists.length,
    records: lists.slice(rows_per_page * (page - 1), rows_per_page * page),
  };
  bridge.sendMultiResourceResponse(
    listResource,
    paginationParams,
    translateToOSDIList,
    "lists",
    response
  );
}

function translateToOSDIItem(item) {
  const { personId, listId, embed } = item;
  const answer = {
    origin_system: "Knack",
    item_type: "osdi:person",
  };
  osdi.response.addIdentifier(answer, `Knack:${listId}-${personId}`);
  osdi.response.addSelfLink(answer, `lists/${listId}/items/${personId}`);
  osdi.response.addLink(answer, "osdi:list", `lists/${listId}`);
  osdi.response.addLink(answer, "osdi:person", `people/${personId}`);
  osdi.response.addCurie(answer, config.get("curieTemplate"));
  if (embed) {
    osdi.response.addEmbeddedItem(
      answer,
      embed,
      translateToOSDIPerson,
      "person"
    );
  }
  return answer;
}
function getItem(request, response) {
  const listId = request.params.id;
  const personId = request.params.item;

  bridge.sendSingleResourceResponse(
    { personId, listId },
    translateToOSDIItem,
    "lists",
    response
  );
}
function getItems(request, response) {
  const listId = request.params.id;
  const [scene, view] = request.params.id.split("-");
  const paginationParams = bridge.getKnackPaginationParams(request);
  const { page, rows_per_page } = paginationParams;

  const resource = bridge
    .createUserClient(request)
    .then(client => client.getView(scene, view, page, rows_per_page))
    .then(result => {
      (result.records || []).forEach(person => {
        bridge.personCache.set(person.id, person);
      });
      return {
        total_pages: result.total_pages,
        current_page: result.current_page,
        total_records: result.total_records,
        per_page: paginationParams.rows_per_page,

        records: (result.records || []).map(person => ({
          listId,
          personId: person.id,
          embed: person,
        })),
      };
    });
  return bridge.sendMultiResourceResponse(
    resource,
    paginationParams,
    translateToOSDIItem,
    "items",
    response
  );
}
// function signup(request, response) {
//   const vanClient = bridge.createClient(request);

//   let osdiPerson = {};

//   if (request && request.body && request.body.person) {
//     osdiPerson = request.body.person;
//   }
//   const activistCodeIds = translateToActivistCodes(request);
//   let originalMatchResponse = null;

//   const personPromise = vanClient.people.findOrCreate(matchCandidate).
//     then(function(matchResponse) {
//       originalMatchResponse = matchResponse;
//       const vanId = matchResponse.vanId;
//       return vanClient.people.applyActivistCodes(vanId, activistCodeIds);
//     }).
//     then(function() {
//       const expand = ['phones', 'emails', 'addresses'];
//       return vanClient.people.getOne(originalMatchResponse.vanId, expand);
//     });

//   bridge.sendSingleResourceResponse(personPromise, translateToOSDIPerson,
//     'people', response);
// }
// function canvass(request, response) {

// }

module.exports = function(app) {
  app.get("/api/v1/lists/:id/items", getItems);
  app.get("/api/v1/lists/:id/items/:item", getItem);
  app.get("/api/v1/lists/:id", getOne);
  app.get("/api/v1/lists/", getMany);

  // app.get("/api/v1/items/:id", getItem);
  // app.post('/api/v1/people/person_signup_helper', signup);
  // app.post('/api/v1/people/:id/record_canvass_helper', canvass);
};
