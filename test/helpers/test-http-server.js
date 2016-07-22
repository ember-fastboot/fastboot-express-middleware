'use strict';

const express            = require('express');
const request            = require('request-promise');
const fastbootMiddleware = require('../../index');

let serverID = 0;

class TestHTTPServer {
  constructor(middleware, options) {
    this.options = options || {};
    this.middleware = middleware;
    this.listener = null;
    this.id = ++serverID;
  }

  start(afterSetup) {
    let options = this.options;
    let app = express();


    app.get('/*', this.middleware);

    if (typeof afterSetup === 'function') {
      afterSetup(app);
    }

    return new Promise((resolve, reject) => {
      let port = options.port || 3000;
      let host = options.host || 'localhost';

      let listener = app.listen(port, host, () => {
        let host = listener.address().address;
        let port = listener.address().port;
        let family = listener.address().family;

        this.listener = listener;
        this.info = {
          host: host,
          port: port,
          listener: listener
        };

        resolve(this.info);
      });
    });
  }

  request(urlPath) {
    let info = this.info;
    let url = 'http://[' + info.host + ']:' + info.port;
    return request(url + urlPath);
  }

  stop() {
    if (this.listener) {
      this.listener.close();
    }
  }
}

module.exports = TestHTTPServer;
