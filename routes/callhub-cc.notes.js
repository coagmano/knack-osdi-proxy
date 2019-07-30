const fieldMap = require("../lib/knack-api-client/fields");
const objectMap = require("../lib/knack-api-client/objects");

const client = require("../lib/bridge").createClient();

// const config = require("../config");
// const _ = require("lodash");
// const selectn = require("selectn");
// const client = require('../lib/knack-api-client');
/**
 * * {
 * *   "hook": {
 * *       "id": 885,
 * *       "event": "cc.notes",
 * *       "target": "https://d1af762f.ngrok.io"
 * *   },
 * *   "data": {
 * *       "last_name": "Test",
 * *       "campaign": "test",
 * *       "agent": {
 * *           "username": "fred@starkenterprises.com.au",
 * *           "id": 2081644762628097800,
 * *           "nationbuilder_id": null,
 * *           "email": "fred@starkenterprises.com.au"
 * *       },
 * *       "record_url": "",
 * *       "Section_Name": "",
 * *       "nationbuilder_id": null,
 * *       "city": "",
 * *       "first_name": "Fred",
 * *       "zipcode": "",
 * *       "state": "",
 * *       "company_name": "",
 * *       "email": "",
 * *       "job_title": "",
 * *       "surveys": [
 * *           {
 * *               "answer": "Yes",
 * *               "type": "MultiChoice",
 * *               "question": "Received ballot"
 * *           }
 * *       ],
 * *       "company_website": "",
 * *       "disposition": null,
 * *       "address": "",
 * *       "mobile": null,
 * *       "country": null,
 * *       "notes": "This was a test call",
 * *       "identifiers": null,
 * *       "contact": "61468828420",
 * *       "nationbuilder_tags": null
 * *   }
 * * }
 */
async function notesEdited(request, response) {
  /**
   * 1. Find matching record in Knack
   * 2. Update record
   * 3. Add conversation record
   *
   * * on Error
   * 1. Store in retry cache
   * 2. Schedule retry
   */
  const { memberId, surveys } = request.body.data;
  const { records } = await client.findRecord(objectMap.members, {
    match: "and",
    rules: [
      {
        field: fieldMap.memberId,
        operator: "is",
        value: memberId,
      },
    ],
  });
  if (!records || records.length !== 1) {
    throw new Error(`Expected 1 record, got ${records ? records.length : 0}`);
  }
  const member = records[0];

  const changedFields = surveys.reduce((acc, val) => {
    const field = fieldMap[val.question];
    if (field) acc[field] = val.answer;
    return acc;
  }, {});

  await client.updateRecord(objectMap.members, member.id, changedFields);
}

const handleErrors = func => (request, response) => {
  func(request, response)
    // eslint-disable-next-line promise/always-return
    .then(result => {
      response.writeHead(200);
      response.send(JSON.stringify(result));
      response.end();
    })
    .catch(error => {
      response.writeHead(500);
      response.send(JSON.stringify(error));
      response.end();
    });
};

module.exports = function(app) {
  app.post("/hooks/callhub/v1/cc.notes", handleErrors(notesEdited));
};
