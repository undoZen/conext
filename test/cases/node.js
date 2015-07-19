'use strict';
var tape = require('tape');
var supertest = require('supertest');
var conext = require('../../');
var express = require('express');

var app = express();
app.get('/ok', conext(function * (req, res, next) {
    res.end(yield Promise.resolve('ok'));
}));
var midThrow = conext(function * (req, res, next) {
    throw new Error('threw');
});
app.get('/throw', midThrow);
app.get('/err', conext(function * (req, res, next) {
    return Promise.reject(new Error('errmsg'));
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
