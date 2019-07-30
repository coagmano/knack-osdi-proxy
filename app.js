/*jslint nodejs: true*/
require('dotenv').config();

const express = require('express'),
    bodyParser = require('body-parser'),
    cors = require('cors'),
    routes = require('./routes'),
    config = require('./config'),
    notSupported = require('./middleware/notSupported'),
    contentType = require('./middleware/contentType'),
    halParser = require('./middleware/halParser'),
    requireHttps = require('./middleware/requireHttps'),
    app = module.exports = express();

app.use(bodyParser.text({ 'type': 'application/hal+json', 'limit' : '50mb' }));
app.use(bodyParser.text({ 'type': 'application/json', 'limit' : '50mb' }));
app.use(halParser);
app.use(requireHttps);
app.use(cors());
app.use('/browser', express.static('browser'));
app.use(contentType);

for (const route of Object.values(routes)) {
  route(app);
}

if (config.get('prettyJSON')) {
  app.set('json spaces', 2);
}

app.all('/api/v1/*', function (request, response) {
  return notSupported.send(request, response);
});

app.get('/', function(request,response) {
  response.redirect('/browser/browser.html#/api/v1');
});

app.all('/*', function (request, response) {
  response.sendStatus(404);
});

if (!module.parent) {
  const port = config.get('port');

  app.listen(port, function() {
    console.log('Listening on %d.', port);
  });
}
