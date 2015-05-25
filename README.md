# conext
use co to write express middleware

## install

```bash
npm i --save conext
```

## source code

```js
'use strict';
var co = require('co');
module.exports = function (gn) {
    var wrapped = co.wrap(gn);
    return function (req, res, next) {
        wrapped.call(this, req, res, next).catch(next);
    };
}
```
I think it should be obviously no bugs.

## usage

```js
var conext = require('conext');
//...
app.use(conext(function * (req, res, next) {
    // ...
}));
```

## license
MIT
