"use strict";

const _ = require("lodash");
const redirects = require("follow-redirects");
const development = false;
const http_client = development ? redirects.http : redirects.https;
const { RateLimiter } = require("limiter");
const limiter = new RateLimiter(10, "second");

http_client.maxBodyLength = 20 * 1024 * 1024; // 20 MB

module.exports = class KnackHQClient {
  constructor(options) {
    this.host = development ? "api.knackdev.com" : "api.knack.com";
    this.token = options.token;
    this.app_id = options.app_id;
    this.api_key = options.api_key;
    this.api_version = "v1";
    this.limiter = options.limiter;
  }

  async request_async(options) {
    return new Promise((resolve, reject) => {
      limiter.removeTokens(1, () => {
        const request = http_client.request(options, response => {
          if (!response || !response.on) {
            return reject();
          }

          let document_text = "";

          response.on("data", chunk => {
            document_text += chunk;
          });

          response.on("end", () => {
            try {
              resolve(JSON.parse(document_text));
            } catch (error) {
              reject(document_text);
            }
          });
        });

        request.on("error", reject);

        if (options.body) {
          request.write(JSON.stringify(options.body));
        }

        request.end();
      });
    });
  }

  async request(options) {
    const request_options = {
      host: this.host,
      path: `/${this.api_version}/${options.path}`,
      method: options.method || (options.body ? "POST" : "GET"),
      port: development ? 3000 : 443,
      headers: {
        "X-Knack-Application-Id": this.app_id,
        "Content-Type": "application/json",
      },
      body: options.body,
    };

    if (this.token) {
      request_options.headers["Authorization"] = this.token;
    } else if (this.api_key) {
      request_options.headers["X-Knack-REST-API-Key"] = this.api_key;
    }

    return this.request_async(request_options);
  }

  async authenticate(email, password) {
    if (!email || !password) {
      return;
    }

    return this.request({
      body: {
        email,
        password,
      },
      path: `applications/${this.app_id}/session`,
    }).then(data => {
      this.token = data.session.user.token;
      return this.token;
    });
  }

  async objects() {
    return this.request({
      path: "objects",
    });
  }

  async records(object_key) {
    return this.request({
      path: `objects/${object_key}/records`,
    });
  }

  async getRecord(object_key, record_key) {
    return this.request({
      path: `objects/${object_key}/records/${record_key}`,
    });
  }

  async createRecord(object_key, body) {
    return this.request({
      path: `objects/${object_key}/records`,
      body: body,
    });
  }

  async deleteRecord(object_key, record_key) {
    return this.request({
      path: `objects/${object_key}/records/${record_key}`,
      method: "DELETE",
    });
  }

  async updateRecord(object_key, record_key, body) {
    return this.request({
      path: `objects/${object_key}/records/${record_key}`,
      method: "PUT",
      body: body,
    });
  }

  async findRecord(object_key, filters, page, rows_per_page) {
    return this.request({
      path:
        "objects/" +
        object_key +
        "/records" +
        (filters
          ? "?filters=" + encodeURIComponent(JSON.stringify(filters))
          : "") +
        (rows_per_page
          ? (filters ? "&" : "?") + "rows_per_page=" + rows_per_page
          : "") +
        (page ? (filters || rows_per_page ? "&" : "?") + "page=" + page : ""),
    });
  }

  async upload(object_key, field_key, filename, body) {
    return this.request({
      path: `applications/${this.app_id}/assets/file/upload`,
      body: _.extend({}, body),
    })
      .then(result => {
        const file_body = _.extend({}, body);
        file_body[field_key] = result.id;

        return {
          path: `objects/${object_key}/records`,
          body: file_body,
        };
      })
      .then(this.request);
  }

  async getView(scene_key, view_key, page, rows_per_page) {
    return this.request({
      path:
        `pages/scene_${scene_key}/views/view_${view_key}/records` +
        (rows_per_page ? "?rows_per_page=" + rows_per_page : "") +
        (page ? (rows_per_page ? "&" : "?") + "page=" + page : ""),
    });
  }
};
