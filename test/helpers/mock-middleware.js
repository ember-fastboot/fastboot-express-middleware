'use strict';

module.exports = function(req, res) {
    res.set('x-test-middleware', 'true');
    res.send(req.html);
};