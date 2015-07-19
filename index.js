'use strict';
var co = require('co');
function once(fn) {
    var called = false;
    return function () {
        if (called) {
            return;
        }
        called = true;
        return fn.apply(this, arguments);
    }
}
module.exports = function (gn) {
    var wrapped = co.wrap(gn);
    return function (req, res, next) {
        next = once(next);
        wrapped.call(this, req, res, next).catch(next);
    };
}
