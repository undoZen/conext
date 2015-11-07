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
var conext = module.exports = function (gn) {
    var wrapped = typeof gn.__generatorFunction__ === 'function' &&
        gn.__generatorFunction__ instanceof (function *() {}).constructor
        ? gn : co.wrap(gn);
    return function (req, res, next) {
        next = once(next);
        wrapped.call(this, req, res, next).catch(next);
    };
};
conext.run = function (middleware, req, res) {
    return new Promise(function (resolve, reject) {
        middleware(req, res, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}
