const config = require("../config");

function apiRoot(request, response) {
  const root = config.get("apiEndpoint");
  const answer = {
    motd: "Welcome to the United Voice OSDI Service!",
    max_pagesize: 200,
    vendor_name: "United Voice",
    product_name: "UVSync",
    osdi_version: "1.2.0",
    _links: {
      curies: [
        {
          name: "osdi",
          href: config.get('curieTemplate'),
          templated: true,
        },
      ],
      self: {
        href: root,
        title: "United Voice OSDI Service Entry Point",
      },
      "osdi:tags": {
        href: root + "tags",
        title: "The collection of tags in the system",
      },
      
      // 'osdi:questions': {
      //   'href': root + 'questions',
      //   'title': 'The collection of questions in the system'
      // },
      "osdi:people": {
        href: root + "people",
        title: "The collection of people in the system",
      },
      "osdi:lists": {
        href: root + "lists",
        title: "The collection of lists in the system",
      },
      // 'osdi:person_signup_helper': {
      //     'href': root + 'people/person_signup_helper',
      //     'title': 'The person signup helper for the system'
      // },
      // 'osdi:scripts' : {
      //     'href': root + 'scripts',
      //     'title': 'The collection of scripts in the system'
      // },
      // 'osdi:events' : {
      //   'href': root + 'events',
      //   'title': 'The collection of events in the system'
      // }
    },
  };

  return response.status(200).send(answer);
}

module.exports = function(app) {
  app.get("/api/v1/", apiRoot);
};
