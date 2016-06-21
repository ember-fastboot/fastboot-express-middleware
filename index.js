'use strict';

const FastBoot = require('fastboot');
const chalk = require('chalk');

function fastbootExpressMiddleware(distPath, options) {
  let opts = options;

  if (arguments.length === 1) {
    if (typeof distPath === 'string') {
      opts = { distPath: distPath };
    } else {
      opts = distPath;
    }
  }

  opts = opts || {};

  let log = opts.log !== false ? _log : function() {};

  let fastboot = opts.fastboot;

  if (!fastboot) {
    fastboot = new FastBoot({
      distPath: opts.distPath,
      resilient: opts.resilient
    });
  }

  return function(req, res, next) {
    let path = req.url;
    fastboot.visit(path, { request: req, response: res })
      .then(success, failure);

    function success(result) {
      result.html()
        .then(html => {
          let headers = result.headers;

          for (var pair of headers.entries()) {
            res.set(pair[0], pair[1]);
          }

          log(result.statusCode, 'OK ' + path);
          res.status(result.statusCode);
          res.send(html);
        })
        .catch(error => {
          console.log(error.stack);
          res.sendStatus(500);
        });
    }

    function failure(error) {
      if (error.name === "UnrecognizedURLError" || error.name === "TransitionAborted") {
        next();
      } else {
        log(500, "Unknown Error: " + error.stack);
        if (error.stack) {
          res.status(500).send(error.stack);
        } else {
          res.sendStatus(500);
        }
      }
    }
  };
}

function _log(statusCode, message, startTime) {
  let color = statusCode === 200 ? 'green' : 'red';
  let now = new Date();

  if (startTime) {
    let diff = Date.now() - startTime;
    message = message + chalk.blue(" " + diff + "ms");
  }

  console.log(chalk.blue(now.toISOString()) + " " + chalk[color](statusCode) + " " + message);
}

module.exports = fastbootExpressMiddleware;
