/*global describe */

require('should');

var config = require('../config.js'),
    testService = require('./testService.js'),
    testGetOsdiResource = require('./testGetOsdiResource');

var root = config.get('apiEndpoint');

function validateTag(ac, tag) {
  var selfLink = root + 'tags/' + ac.activistCodeId;
  tag.origin_system.should.equal('VAN');
  tag.identifiers[0].should.equal('VAN:' + ac.activistCodeId);
  tag.name.should.equal(ac.name);
  tag.description.should.equal(ac.description);
  tag._links.self.href.should.equal(selfLink);
}

describe('/api/v1/tags', function() {
  testGetOsdiResource('tag', testService.createActivistCodes,
    'activistCode', validateTag);
});
