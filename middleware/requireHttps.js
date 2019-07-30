const config = require("../config");

module.exports = function(request, response, next) {
  if (config.get("requireHttps")) {
    if (!isSecureRequest(request)) {
      return sendHTTPSRequired(request, response);
    }
  }

  next();
};

function isSecureRequest(request) {
  const headers = request.headers || {};
  const forwarded = headers["x-forwarded-proto"];

  if (typeof forwarded === "string" && forwarded.includes("https")) {
    return true;
  }

  return false;
}

function sendHTTPSRequired(request, response) {
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
            code: "HTTPS_REQUIRED",
            description: "The system does not accept non-https calls.",
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
