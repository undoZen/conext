'use strict';
var tape = require('tape');
var supertest = require('supertest');
var conext = require('../../');
var express = require('express');

var app = express();
app.get('/ok', conext(function * (req, res, next) {
    res.end(yield Promise.resolve('ok'));
}));
app.get('/err', conext(function * (req, res, next) {
    return Promise.reject(new Error('errmsg'));
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
    .get('/err')
    .expect(500)
    .end(function (err, response) {
        test.ok(!err);
        test.ok(response.text.indexOf('Error: errmsg') > -1);
    });
});
