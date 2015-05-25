'use strict';
var co = require('co');
module.exports = function (gn) {
    var wrapped = co.wrap(gn);
    return function (req, res, next) {
        wrapped.call(this, req, res, next).catch(next);
    };
}
