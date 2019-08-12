const { APIClient } = require("../lib/knack-api-client");
const config = require("../config");
const fieldMap = require("../lib/knack-api-client/fields");
const objectMap = require("../lib/knack-api-client/objects");
const questions = require("../lib/knack-api-client/questions");
const API_KEY = config.get("knackAPIKey");

async function notesEdited(request) {
  const { memberId, surveys, identifiers } = request.body.data;
  const client = APIClient(API_KEY);
  let knackId = identifiers && identifiers.find(id => id.includes("Knack"));
  knackId = knackId && knackId.split(":")[1];
  // let person;
  if (!knackId) {
    const result = await client.findRecord(objectMap.members, {
      field: fieldMap.memberId,
      operator: "is",
      value: memberId,
    });
    if (result && result.records && result.records.length > 0) {
      knackId = result.records[0].id;
    } else {
      console.error(result);
      throw new Error("Could not find member");
    }
  }
  const modifier = (surveys || []).reduce((acc, survey) => {
    const testString = survey.question.toLowerCase();
    const found = questions.find(({ questionPartial }) => {
      return testString.includes(questionPartial);
    });
    if (found) {
      acc[found.field] = survey.answer;
    }
    return acc;
  }, {});
  modifier[fieldMap["Last Conversation Date"]] = new Date();
  return client.updateRecord(objectMap.members, knackId, modifier);
}

const handleErrors = func => (request, response) => {
  func(request, response)
    // eslint-disable-next-line promise/always-return
    .then(result => {
      response.statusCode = 200;
      response.end(JSON.stringify(result));
    })
    .catch(error => {
      console.error(error);
      response.statusCode = 500;
      response.end(JSON.stringify(error));
    });
};

module.exports = function(app) {
  app.post("/hooks/callhub/v1/cc.notes", handleErrors(notesEdited));
};
