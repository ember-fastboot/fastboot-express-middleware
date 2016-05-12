'use strict';

var FastBoot = require('fastboot');
var chalk = require('chalk');

function fastbootExpressMiddleware(distPath, options) {
  var opts = options;

  if (arguments.length === 1) {
    if (typeof distPath === 'string') {
      opts = { distPath: distPath };
    } else {
      opts = distPath;
    }
  }

  opts = opts || {};

  var log = opts.log !== false ? _log : function() {};

  var fastboot = opts.fastboot;

  if (!fastboot) {
    fastboot = new FastBoot({
      distPath: opts.distPath,
      resilient: opts.resilient
    });
  }

  return function(req, res, next) {
    var path = req.url;
    fastboot.visit(path, { request: req, response: res })
      .then(success, failure);

    function success(result) {
      result.html()
        .then(function(html) {
          var headers = result.headers;

          for (var pair of headers.entries()) {
            res.set(pair[0], pair[1]);
          }

          log(result.statusCode, 'OK ' + path);
          res.status(result.statusCode);
          res.send(html);
        })
        .catch(function(error) {
          console.log(error.stack);
          res.sendStatus(500);
        });
    }

    function failure(error) {
      if (error.name === "UnrecognizedURLError") {
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
  var color = statusCode === 200 ? 'green' : 'red';
  var now = new Date();

  if (startTime) {
    var diff = Date.now() - startTime;
    message = message + chalk.blue(" " + diff + "ms");
  }

  console.log(chalk.blue(now.toISOString()) + " " + chalk[color](statusCode) + " " + message);
}

module.exports = fastbootExpressMiddleware;
