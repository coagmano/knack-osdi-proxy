
var createError = require('createerror');

var Forbidden = createError({
  name: 'Forbidden'
});

var BadRequest = createError({
  name: 'BadRequest',
  errors: []
});

var NotFound = createError({
  name: 'NotFound'
});

var Unexpected = createError({
  name: 'Unexpected',
  referenceCode: ''
});

module.exports = {
  Forbidden: Forbidden,
  BadRequest: BadRequest,
  NotFound: NotFound,
  Unexpected: Unexpected
};
