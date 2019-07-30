module.exports = function(request, response, next) {
  // Don't attempt to parse the body when the method is GET
  if (request.method != "GET") {
    try {
      const rawBody = request.body;

      if (typeof rawBody !== "object") {
        const parsedBody = JSON.parse(rawBody);
        request.body = parsedBody;
      }
    } catch (error) {
      console.trace("Exception while parsing body: ", request.body, error);
      return sendBadJSON(request, response);
    }
  }
  next();
};

function sendBadJSON(request, response) {
  const responseCode = 400;

  const error = {
    request_type: "atomic",
    response_code: responseCode,
    resource_status: [
      {
        resource: "*",
        response_code: responseCode,
        errors: [
          {
            code: "BAD_JSON",
            description: "The request body could not be parsed as valid JSON.",
          },
        ],
      },
    ],
  };

  return response
    .status(responseCode)
    .send(error)
    .end();
}
