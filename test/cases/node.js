'use strict';
var tape = require('tape');
var supertest = require('supertest');
var conext = require('../../');
var express = require('express');

var Promise = require('bluebird');

function sleep(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}

var app = express();
app.get('/nongen', conext(function (req, res, next) {
    res.end('nongen');
}));
app.get('/coconext', conext(conext(function * (req, res, next) {
    res.end(yield Promise.resolve('coconext'));
})));
app.get('/ok', conext(function * (req, res, next) {
    res.end(yield Promise.resolve('ok'));
}));
app.get('/wrapped', conext(Promise.coroutine(function * (req, res, next) {
    res.end(yield Promise.resolve('wrapped ok'));
})));
var midThrow = conext(function * (req, res, next) {
    throw new Error('threw');
});
app.get('/throw', midThrow);
app.get('/err', conext(function * (req, res, next) {
    throw new Error('errmsg');
}));
app.get('/errcaught', conext(function * (req, res, next) {
    throw new Error('errmsg');
}), conext(function * (err, req, res, next) {
    res.end(err.message);
}));

var resultOk = conext(function * (req, res, next) {
    res.result = res.result || {};
    res.result.ok = yield Promise.resolve(true);
    next();
});
app.get('/okmid', conext(function * (req, res, next) {
    yield conext.run(resultOk, req, res);
    res.type('json');
    res.send(res.result);
}));
app.get('/omitnext',
conext(function * (req, res) {
    yield conext.run(resultOk, req, res);
    res.result.start = Date.now();
}),
conext(Promise.coroutine(function * (req, res, next) {
    res.result.hello = yield Promise.resolve('world');
    yield sleep(100);
    next();
    return true;
})),
conext(function * (req, res) {
    yield sleep(100);
}),
function (req, res, next) {
    res.result.normal = true;
    next();
},
conext(function * (req, res) {
    yield sleep(100);
}),
conext(function * (req, res) {
    res.result.stop = Date.now();
}),
conext(function * (req, res) {
    res.type('json');
    res.send(res.result);
})
);
app.get('/throwmid', conext(function * (req, res, next) {
    yield conext.run(midThrow, req, res);
    res.type('json');
    res.send(res.result);
}));

tape(function (test) {
    test.plan(2);
    supertest(app)
    .get('/ok')
    .expect(200)
    .end(function (err, response) {
        test.ok(!err);
        test.equal(response.text, 'ok');
    });
});

tape('nongen', function (test) {
    test.plan(2);
    supertest(app)
    .get('/nongen')
    .expect(200)
    .end(function (err, response) {
        test.ok(!err);
        test.equal(response.text, 'nongen');
    });
});

tape('coconext', function (test) {
    test.plan(2);
    supertest(app)
    .get('/coconext')
    .expect(200)
    .end(function (err, response) {
        test.ok(!err);
        test.equal(response.text, 'coconext');
    });
});

tape('wrapped ok', function (test) {
    test.plan(2);
    supertest(app)
    .get('/wrapped')
    .expect(200)
    .end(function (err, response) {
        test.ok(!err);
        test.equal(response.text, 'wrapped ok');
    });
});

tape(function (test) {
    test.plan(2);
    supertest(app)
    .get('/okmid')
    .expect(200)
    .end(function (err, response) {
        test.ok(!err);
        test.deepEqual(response.body, {ok: true});
    });
});

tape(function (test) {
    test.plan(4);
    supertest(app)
    .get('/omitnext')
    .expect(200)
    .end(function (err, response) {
        test.ok(!err);
        test.ok(response.body.ok);
        test.equal(response.body.hello, 'world');
        console.log(response.body.stop - response.body.start);
        test.ok(response.body.stop - response.body.start > 300);
    });
});

tape(function (test) {
    test.plan(2);
    supertest(app)
    .get('/err')
    .expect(500)
    .end(function (err, response) {
        test.ok(!err);
        test.ok(response.text.indexOf('Error: errmsg') > -1);
    });
});

tape(function (test) {
    test.plan(2);
    supertest(app)
    .get('/errcaught')
    .expect(200)
    .end(function (err, response) {
        test.ok(!err);
        test.equal(response.text.trim(), 'errmsg');
    });
});

tape(function (test) {
    test.plan(2);
    supertest(app)
    .get('/throw')
    .expect(500)
    .end(function (err, response) {
        test.ok(!err);
        test.ok(response.text.indexOf('Error: threw') > -1);
    });
});

tape(function (test) {
    test.plan(2);
    supertest(app)
    .get('/throwmid')
    .expect(500)
    .end(function (err, response) {
        test.ok(!err);
        test.ok(response.text.indexOf('Error: threw') > -1);
    });
});
