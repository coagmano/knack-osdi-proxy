/*global describe */

require('should');
var _ = require('lodash');

var config = require('../config.js'),
    testService = require('./testService.js'),
    testGetOsdiResource = require('./testGetOsdiResource');

var root = config.get('apiEndpoint');

function validateQuestion(sq, question) {
  var selfLink = root + 'questions/' + sq.surveyQuestionId;
  question.origin_system.should.equal('VAN');
  question.identifiers[0].should.equal('VAN:' + sq.surveyQuestionId);
  question.name.should.equal(sq.mediumName);
  question.description.should.equal(sq.scriptQuestion);
  question.title.should.equal(sq.name);
  question.summary.should.equal(sq.scriptQuestion);
  question.question_type.should.equal('SingleChoice');
  question._links.self.href.should.equal(selfLink);

  var responsesSurveyResponses = _.zip(sq.responses, question.responses);
  _.each(responsesSurveyResponses, _.spread(validateResponse));
}

function validateResponse(surveyResponse, response) {
  response.key.should.equal(surveyResponse.surveyResponseId);
  response.name.should.equal(surveyResponse.mediumName);
  response.title.should.equal(surveyResponse.name);
}

describe('/api/v1/questions', function() {
  testGetOsdiResource('question', testService.createSurveyQuestions,
    'surveyQuestion', validateQuestion);
});
