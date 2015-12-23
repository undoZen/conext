'use strict';
var Promise = require('bluebird');
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

var GeneratorFunction = (function *(){}).constructor;
function isGeneratorFunction(gn) {
    return gn instanceof GeneratorFunction ||
        !!gn.toString().match(/^function\s*\*/);
}

var conext = module.exports = function (gn) {
    var isCoNext2Wrapped = gn.toString().indexOf('/* conext@2 wrapped */') > -1;
    var isGenerator = isGeneratorFunction(gn);
    var isBluebirdCoroutineWrapped = gn.toString().match(/PromiseSpawn\$/);

    var fn;
    if (isCoNext2Wrapped) {
        return gn;
    } else if (isGenerator) {
        fn = Promise.coroutine(gn);
    } else if (isBluebirdCoroutineWrapped) {
        fn = gn;
    } else {
        return gn;
    }

    return function (req, res, next) { /* conext@2 wrapped */
        next = once(next);
        fn.call(this, req, res, next).catch(next);
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
