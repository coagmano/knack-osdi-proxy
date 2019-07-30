/*global describe, it */
/*exported should */
/*jshint -W030 */

const should = require('should'),
    supertest = require('supertest'),
    app = require('../app');

describe('AEP', function() {

  it('should return basic details about service', function(done) {
    supertest(app).
      get('/api/v1/').
      set('Accept', 'application/json').
      expect(200, function(error, response) {
        const body =  JSON.parse(response.text);
        should.equal(response.headers['content-type'],
          'application/json; charset=utf-8');
        should.equal(body.motd, 'Welcome to the NGP VAN OSDI Service!');
        should.equal(body.max_pagesize, 200);
        should.equal(body.vendor_name, 'NGP VAN, Inc.');
        should.equal(body.product_name, 'VAN');
        should.equal(body.osdi_version, '1.0.3');
        should.equal(body._links.self.href,
          'https://osdi.ngpvan.com/api/v1/');
        should.equal(body._links.self.title,
          'NGP VAN OSDI Service Entry Point');

        const tags = body._links['osdi:tags'];
        should.equal(tags.href,
          'https://osdi.ngpvan.com/api/v1/tags');
        should.equal(tags.title, 'The collection of tags in the system');

        const questions = body._links['osdi:questions'];
        should.equal(questions.href,
          'https://osdi.ngpvan.com/api/v1/questions');
        should.equal(questions.title,
          'The collection of questions in the system');

        const people = body._links['osdi:people'];
        should.equal(people.href,
          'https://osdi.ngpvan.com/api/v1/people');
        should.equal(people.title,
          'The collection of people in the system');

        const signup = body._links['osdi:person_signup_helper'];
        should.equal(signup.href,
          'https://osdi.ngpvan.com/api/v1/people/person_signup');
        should.equal(signup.title,
          'The person signup helper for the system');

        done();
      });
  });

});
