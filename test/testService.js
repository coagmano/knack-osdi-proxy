var _ = require('lodash');

function VanResponseHandlerMock() {}

VanResponseHandlerMock.prototype.handle =
  function(vanEndpoint, apiKey, dbMode, id,
      unauthorized, badRequest, success) {

    if (this.forceSuccess) {
      return success(this.successData);
    }
    if (this.forceUnauthorized) {
      return unauthorized({});
    }
    if (this.forceNotFound) {
      return success({});
    }

    badRequest({});
  };

function createActivistCodes(count) {
  var acs = [];
  for (var i = 0; i < count; i++) {
    var ac = {
      activistCodeId: i,
      name: 'AC ' + i,
      description: 'Activist Code ' + i
    };
    acs.push(ac);
  }
  return acs;
}

function createSurveyQuestions(count) {
  var sqs = [];
  for (var i = 0; i < count; i++) {
    var sq = {
      surveyQuestionId: i,
      name: 'SQ ' + i,
      description: 'Survey Question ' + i,
      mediumName: 'SurveyQ',
      scriptQuestion: 'Survey Question?',
      responses: []
    };
    var responseCount = _.random(10);
    for (var j = 0; j < responseCount; j++) {
      sq.responses.push({
        surveyResponseId: _.random(0, 10000),
        mediumName: 'SR ' + j,
        name: 'Survey Response ' + j
      });
    }
    sqs.push(sq);
  }
  return sqs;
}

module.exports = {
  VanResponseHandlerMock: VanResponseHandlerMock,
  createActivistCodes: createActivistCodes,
  createSurveyQuestions: createSurveyQuestions
};
