/*global describe, it, beforeEach */

var osdi = require('../../lib/osdi').response,
    reqparser = require('../../lib/osdi').request;
var root = require('../../config').get('apiEndpoint');
var sinon = require('sinon');
require('should');

describe('osdi.response-helper', function() {
  describe('#createCommonItem', function() {
    it('creates object with required properties', function() {
      var name = 'Item';
      var desc = 'It is an item';

      var item = osdi.createCommonItem(name, desc);

      item.origin_system.should.equal('VAN');
      item.name.should.equal(name);
      item.description.should.equal(desc);
    });
  });

  describe('#createPaginatedItem', function() {
    var page, perPage = 2, pages = 4, total = 8;
    var path = 'tags';
    var createItem = function() {
      return osdi.createPaginatedItem(page, perPage, pages, total, path);
    };

    it('throws an error if page < 0', function() {
      page = -1;

      var act = function() { createItem(); };
      act.should.throwError();
    });

    it('creates object with required properties', function() {
      page = 1;

      var item = createItem();

      item.page.should.equal(page);
      item.per_page.should.equal(perPage);
      item.total_pages.should.equal(pages);
      item.total_records.should.equal(total);
    });

    it('adds a next link when there are more pages', function() {
      page = 1;

      var item = createItem();

      var expectedPath = 'tags?page=' + (page + 1) + '&per_page=' + perPage;
      item._links.next.href.should.equal(root + expectedPath);
    });

    it('adds a previous link when there are previous pages', function() {
      page = pages;

      var item = createItem();

      var expectedPath = 'tags?page=' + (page - 1) + '&per_page=' + perPage;
      item._links.previous.href.should.equal(root + expectedPath);
    });

    it('adds next and previous links when on a middle page', function() {
      page = 3;

      var item = createItem();

      var previousPath = 'tags?page=' + (page - 1) + '&per_page=' + perPage;
      var nextPath = 'tags?page=' + (page + 1) + '&per_page=' + perPage;
      item._links.previous.href.should.equal(root + previousPath);
      item._links.next.href.should.equal(root + nextPath);
    });
  });

  describe('#addEmbeddedItems', function() {
    it('adds formatted embedded items', function() {
      var item = {};
      var items = [1, 4, 9];
      var formatter = Math.sqrt;

      osdi.addEmbeddedItems(item, items, formatter);

      var expected = items.map(formatter);

      item._embedded.should.eql(expected);
    });
  });

  describe('#addLink', function() {
    it('adds a link to an item', function() {
      var item = {};
      var name = 'self', value = 'items';

      osdi.addLink(item, name, value);

      item._links[name].href.should.equal(root + value);
    });

    it('preserves existing links', function() {
      var item = {
        _links: {
          'existing': { href: 'localhost' }
        }
      };
      var name = 'self', value = 'items';

      osdi.addLink(item, name, value);

      item._links.existing.href.should.equal('localhost');
      item._links[name].href.should.equal(root + value);
    });
  });

  describe('#addSelfLink', function() {
    it('adds a self link to an item', function() {
      var item = {};
      var type = 'items';
      var id = 123;

      osdi.addSelfLink(item, type, id);

      item._links.self.href.should.equal(root + type + '/' + id);
    });

    it('preserves existing links', function() {
      var item = {
        _links: {
          'existing': { href: 'localhost' }
        }
      };
      var type = 'items';
      var id = 123;

      osdi.addSelfLink(item, type, id);

      item._links.existing.href.should.equal('localhost');
      item._links.self.href.should.equal(root + type + '/' + id);
    });
  });

  describe('#addIdentifier', function() {
    it('adds an identifier to an item', function() {
      var item = {};
      var id = 'VAN:1234';

      osdi.addIdentifier(item, id);

      item.identifiers[0].should.equal(id);
    });

    it('preserves existing identifiers', function() {
      var item = {
        identifiers: ['VAN:4321']
      };
      var id = 'VAN:1234';

      osdi.addIdentifier(item, id);

      item.identifiers[0].should.equal('VAN:4321');
      item.identifiers[1].should.equal(id);
    });
  });

  describe('#getPaginationOptions', function() {
    it('extracts page from querystring', function() {
      var request = {
        query: {
          page: '123'
        }
      };

      var pagination = reqparser.getPaginationOptions(request);

      pagination.page.should.equal(123);
    });

    it('extracts per_page from querystring', function() {
      var request = {
        query: {
          per_page: '456'
        }
      };

      var pagination = reqparser.getPaginationOptions(request);

      pagination.perPage.should.equal(456);
    });

    it('returns empty object if no pagination options sent', function() {
      var pagination = reqparser.getPaginationOptions({});

      pagination.should.eql({});
    });

    it('returns perPage 50 if page specified without perPage', function() {
      var request = {
        query: {
          page: '1'
        }
      };

      var pagination = reqparser.getPaginationOptions(request);

      pagination.perPage.should.equal(50);
    });
  });

  describe('#unauthorized', function() {
    it('returns a function that sends 401 when called', function() {
      var response = {
        status: function() { return response; },
        end: function() {}
      };

      sinon.spy(response, 'status');
      sinon.spy(response, 'end');

      osdi.unauthorized(response)();
      response.status.calledOnce.should.be.true();
      response.status.calledWith(401).should.be.true();
      response.end.calledOnce.should.be.true();
    });
  });

  describe('#badRequest', function() {
    var response;
    beforeEach(function() {
      response = {
        status: function() { return response; },
        send: function() {}
      };
      sinon.spy(response, 'status');
      sinon.spy(response, 'send');
    });
    it('returns a function that sends 400 with translated errors', function() {
      osdi.badRequest(response, 'items')();
      response.status.calledOnce.should.be.true();
      response.status.calledWith(400).should.be.true();
      response.send.calledOnce.should.be.true();
    });

    it('returns a function that sends formatted error', function() {
      var errors = [
        {
          'code': 'BAD_CALL1',
          'description': 'First bad call'
        },
        {
          'code': 'BAD_CALL2',
          'description': 'Second bad call'
        }
      ];
      var expected = {
        'request_type': 'atomic',
        'response_code': 400,
        'resource_status': [
          {
            'resource': 'osdi:items',
            'response_code': 400,
            'errors': errors
          }
        ]
      };
      osdi.badRequest(response, 'items')(errors);
      response.send.calledWith(expected).should.be.true();
      response.send.calledOnce.should.be.true();
    });

  });
});
