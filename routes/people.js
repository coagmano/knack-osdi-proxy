const { translateToOSDITagging } = require("./people");
const bridge = require("../lib/bridge");
const config = require("../config");
const fields = require("../lib/knack-api-client/fields");
const objectMap = require("../lib/knack-api-client/objects");
const osdi = require("../lib/osdi");
const taglist = require("../lib/knack-api-client/tags");

const valueOrBlank = value => value || "";
const phoneRawOrBlank = phone => (phone && phone.number) || "";
const emailRawOrBlank = raw => (raw && raw.email) || "";

function splitMemberName(name) {
  const [first, ...rest] = name.split(" ");
  const last = rest.pop();
  return { first, additional: rest.join(" "), last };
}

function translateToOSDIPerson(person) {
  const { first, additional, last } = splitMemberName(
    person[fields["Member Name"]]
  );
  const answer = {
    ...osdi.response.createCommonItem(),
    given_name: valueOrBlank(first),
    family_name: valueOrBlank(last),
    additional_name: valueOrBlank(additional),
  };
  osdi.response.addIdentifier(answer, `Knack:${person.id}`);
  osdi.response.addIdentifier(answer, `UnitedVoice:${person[fields.memberId]}`);
  // "osdi:record_canvass_helper": {
  //   href:
  //     config.get("apiEndpoint") +
  //     "people/" +
  //     knackPerson.vanId +
  //     "/record_canvass_helper",
  // },

  const address = person[fields.Address_raw];
  answer.postal_addresses = [];
  if (address) {
    answer.postal_addresses.push({
      primary: true,
      address_lines: [address.street, address.street2],
      locality: valueOrBlank(address.city),
      region: valueOrBlank(address.state),
      postal_code: valueOrBlank(address.zip),
      country: "AU",
      address_type: "Mailing",
    });
  }

  answer.email_addresses = [];
  if (person[fields["Home Email_raw"]]) {
    answer.email_addresses.push({
      address_type: "personal",
      address: emailRawOrBlank(person[fields["Home Email_raw"]]),
    });
  }
  if (person[fields["Work Email_raw"]]) {
    answer.email_addresses.push({
      address_type: "work",
      address: emailRawOrBlank(person[fields["Work Email_raw"]]),
    });
  }
  // Set primary email to home if exists, else work
  if (answer.email_addresses[0] && answer.email_addresses[0].address.length > 0) {
    answer.email_addresses[0].primary = true;
  }

  const mobile = phoneRawOrBlank(person[fields.Mobile_raw]);
  const homePhone = phoneRawOrBlank(person[fields["Home Phone_raw"]]);
  answer.phone_numbers = [];
  if (mobile) {
    answer.phone_numbers.push({
      number: mobile,
      number_type: "Mobile",
      sms_capable: true,
      do_not_call: person[fields["Do not contact"]],
    });
  }
  if (homePhone) {
    answer.phone_numbers.push({
      number: homePhone,
      number_type: "Home",
      sms_capable: false,
      do_not_call: person[fields["Do not contact"]],
    });
  }
  osdi.response.addSelfLink(answer, "people/" + person.id);
  osdi.response.addLink(
    answer,
    "osdi:taggings",
    `people/${person.id}/taggings`
  );
  osdi.response.addCurie(answer, config.get("curieTemplate"));

  return answer;
}

function getOne(request, response) {
  const personId = request.params.id;
  const client = bridge.createClient(request);
  bridge.sendSingleResourceResponse(
    client.getRecord(objectMap.members, personId),
    translateToOSDIPerson,
    "person",
    response
  );
}

function getMany(request, response) {
  const client = bridge.createClient(request);

  let filter;
  const paginationParams = bridge.getKnackPaginationParams(request);
  const { page, rows_per_page } = paginationParams;
  bridge.sendMultiResourceResponse(
    client.findRecord(objectMap.members, filter, page, rows_per_page),
    paginationParams,
    translateToOSDIPerson,
    "people",
    response
  );
}
// function signup(request, response) {

// }
// function canvass(request, response) {

// }

function getTaggings(request, response) {
  const personId = request.params.id;
  const client = bridge.createClient(request);
  const paginationParams = bridge.getKnackPaginationParams(request);
  const resource = client
    .getRecord(objectMap.members, personId)
    .then(result => {
      const person = result;
      const tags = taglist.filter(tag => {
        return person[tag.field] === tag.value;
      });
      return { records: tags.map(tag => ({ tag, person })) };
    });
  bridge.sendMultiResourceResponse(
    resource,
    paginationParams,
    translateToOSDITagging,
    "tagging",
    response
  );
}

module.exports = function(app) {
  app.get("/api/v1/people/", getMany);

  app.get("/api/v1/people/:id", getOne);
  app.get("/api/v1/people/:id/taggings", getTaggings);

  // app.post('/api/v1/people/person_signup_helper', signup);
  // app.post('/api/v1/people/:id/record_canvass_helper', canvass);
};
module.exports.getOne = getOne;
module.exports.getMany = getMany;
module.exports.translateToOSDIPerson = translateToOSDIPerson;
