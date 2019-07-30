/*global describe, it */
/*exported should */
/*jshint -W030 */

var should = require('should'),
    supertest = require('supertest'),
    app = require('../app');

describe('notSupported', function() {

  it('should not support any resources', function(done) {
    supertest(app).
      get('/api/v1/items').
      expect(500, function(err, response) {
        var responseBody = JSON.parse(response.text);
        should.equal(responseBody.request_type, 'atomic');
        should.equal(responseBody.response_code, 500);
        responseBody.resource_status.should.be.length(1);
        should.equal(responseBody.resource_status[0].resource, '*');
        should.equal(responseBody.resource_status[0].response_code, '500');
        responseBody.resource_status[0].errors.should.be.length(1);
        should.equal(
          responseBody.resource_status[0].errors[0].code,
          'NOT_SUPPORTED');
        done();
      });
  });

  it('should 404 non-api requests', function(done) {
    supertest(app).
      get('/allTheThings').
      expect(404, done);
  });

});
