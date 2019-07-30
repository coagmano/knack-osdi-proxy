module.exports = function(request, response, next) {
  response.setHeader("Content-Type", "application/json");
  return next();
};
