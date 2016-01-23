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

var conext = module.exports = function (gn) {
    var isCoNext2Wrapped = gn.toString().indexOf('/* conext@3 wrapped */') > -1;
    var isGenerator = gn.toString().indexOf('function*') === 0;

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
    } else if (gn.length === 3 || gn.length === 0) {
        // if gn.length === 0, it may be already wrapped, so skip
        return function (_1, _2, _3) {
            ref.apply(this, arguments);
        };
    } else {
        return function (req, res) {
            var p = ref.apply(this, arguments);
            if (p && p.then && typeof p.then === 'function' && typeof p._next === 'function') {
                p.then(function (result) {
                    if (result === false) {
                        return;
                    }
                    p._next.call(null);
                });
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
