# conext
use co to write express middleware

## install

```bash
npm i --save conext
```

## source code (kind of), [check it yourself](index.js)

```js
'use strict';
var bluebird = require('bluebird');
module.exports = function (gn) {
    var wrapped = bluebird.coroutine(gn);
    return gn.length >= 4 ? function (err, req, res, next) {
        wrapped.apply(this, arguments).catch(next);
    } : function (req, res, next) {
        wrapped.apply(this, arguments).catch(next);
    };
}
```

## usage

in 3.x, conext will help you call next() if gn.length === 1 or gn.length === 2, so you can avoid next() to be called twice

```js
var conext = require('conext');
app.use(conext(function *(req, res) {
    res.localResultA = yield asyncA();
});
app.use(conext(function *(req, res) {
    if (yield asyncB()) {
        return 'next'; // or just `return;`, `return 'next';` is more readable
    } else {
        return 'next route'; // will call you next('route'), which is a express@^4 feature I never use;
    }
}, function (req, res, next) {
    // this will never reached if asyncB() resolved by falsy value
});
// ...
```

If you are using CoffeeScript, it's more convenience for you to keep using next argument because you can use yield whenever you want

```coffeescript
conext = require('conext')

app.use conext (req, res, next) ->
    res.local.withOutYieldCompilesTo = 'normal function';
    next()

app.use conext (req, res, next) ->
    res.local.withYieldCompilesTo = yield Promise.resolve('generator function');
    next()
```

## license
MIT
