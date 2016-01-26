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

in 3.x, conext will help you call `next()` if `gn.length === 1` or `gn.length === 2`, so you can avoid `next()` to be called twice

```js
var conext = require('conext');
app.use(conext(function *(req, res) {
    res.locals.resultA = yield asyncA();
    // you can omit `return 'next';` here, in conext it will compare returned value to undefined or 'next' and then call next()
});
app.use(conext(function *(req, res) {
    if (yield asyncB()) {
        return 'next'; // or just `return;`, but `return 'next';` is more readable
    } else {
        return 'next route'; // will call you next('route'), which is a express@^4 feature I never use;
    }
}, function (req, res, next) {
    res.locals.resultB = true
    // this will never reached if asyncB() resolved by falsy value
});
app.use(conext(function *(req, res) {
    res.json(res.locals);
    return false; // `return false` or `return null` to indicate you've already taken care of response, like this.respond = true in koa
});
// ...
```

If you are using CoffeeScript, it's more convenience for you to keep using next argument because you can use yield whenever you want

```coffeescript
conext = require('conext')

app.use conext (req, res, next) ->
    res.locals.withOutYieldCompilesTo = 'normal function';
    next()

app.use conext (req, res, next) ->
    res.locals.withYieldCompilesTo = yield Promise.resolve('generator function');
    next()
```

## license
MIT
