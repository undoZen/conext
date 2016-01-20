'use strict';
var Promise = require('bluebird');
function once(fn) {
    var called = false;
    return function () {
        if (called) {
            return;
        }
        called = true;
        return typeof fn === 'function' && fn.apply(this, arguments);
    }
}

var GeneratorFunction = (function *(){}).constructor;
function isGeneratorFunction(gn) {
    return gn instanceof GeneratorFunction ||
        !!gn.toString().match(/^function\s*\*/);
}

var conext = module.exports = function (gn) {
    var isCoNext2Wrapped = gn.toString().indexOf('/* conext@3 wrapped */') > -1;
    var isGenerator = isGeneratorFunction(gn);

    var fn;
    if (isCoNext2Wrapped) {
        return gn;
    } else if (isGenerator) {
        fn = Promise.coroutine(gn);
    } else {
        fn = gn;
    }

    var ref = function () { /* conext@3 wrapped */
        var next = once(fn.length >= 4 ? arguments[3] : arguments[2]);
        var p = fn.apply(this, arguments);
        if (p && p.catch && typeof p.catch === 'function') {
            p.catch(function (err) {
                console.log(err.stack);
                next(err);
            });
            p._next = next;
            return p;
        }
    };
    // keep arity
    if (gn.length >= 4) {
        return function (_1, _2, _3, _4) {
            ref.apply(this, arguments);
        };
    } else if (gn.length === 3) {
        return function (_1, _2, _3) {
            ref.apply(this, arguments);
        };
    } else {
        return function (_1, _2, next) {
            var p = ref.apply(this, arguments);
            if (p && p.then && typeof p.then === 'function' && typeof p._next === 'function') {
                p.then(p._next);
            }
        };
    }
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
