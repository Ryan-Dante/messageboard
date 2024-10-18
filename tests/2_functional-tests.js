const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let threadId;
let replyId;

suite('Functional Tests', function () {

    //POST request to threads
    suite('POST request to /api/threads/{board}', function () {
        test('Create a new thread', function (done) {
            chai.request(server)
                .post('/api/threads/test')
                .send({
                    board: 'test',
                    text: 'test text',
                    delete_password: 'password'
                })
                .end(function (_, res) {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body);
                    assert.property(res.body, 'text');
                    assert.property(res.body, 'delete_password');
                    assert.property(res.body, 'reported');
                    assert.property(res.body, 'replies');
                    assert.property(res.body, 'created_on');
                    assert.property(res.body, 'bumped_on');
                    assert.property(res.body, '_id');
                    threadId = res.body._id;
                    done();
                });
        });
    });

    //GET request to threads
    suite('GET request to /api/threads/{board}', function () {
        test('View the 10 most recent threads with 3 replies each', function (done) {
            chai.request(server)
                .get('/api/threads/test')
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    assert.isArray(res.body);
                    assert.isAtMost(res.body.length, 10);
                    assert.property(res.body[0], 'text');
                    assert.property(res.body[0], 'created_on');
                    assert.property(res.body[0], 'bumped_on');
                    assert.property(res.body[0], 'replies');
                    assert.isArray(res.body[0].replies);
                    assert.isAtMost(res.body[0].replies.length, 3);
                    done();
                });
        });
    });

    //DELETE request to threads
    suite('DELETE request to /api/threads/{board}', function () {
        test('Delete a thread with the incorrect password', function (done) {
            chai.request(server)
                .delete('/api/threads/test')
                .send({ thread_id: threadId, delete_password: 'wrong password' })
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    assert.equal(res.text, 'incorrect password');
                    done();
                });
        });

        test('Delete a thread with the correct password', function (done) {
            chai.request(server)
                .delete('/api/threads/test')
                .send({ thread_id: threadId, delete_password: 'password' })
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    assert.equal(res.text, 'success');
                    done();
                });
        });
    });

    //Create a new thread to test the reply routes
    suite('POST request to /api/threads/{board}', function () {
        test('Create a new thread', function (done) {
            chai.request(server)
                .post('/api/threads/test')
                .send({
                    board: 'test',
                    text: 'test text',
                    delete_password: 'password'
                })
                .end(function (_, res) {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body);
                    assert.property(res.body, 'text');
                    assert.property(res.body, 'delete_password');
                    assert.property(res.body, 'reported');
                    assert.property(res.body, 'replies');
                    assert.property(res.body, 'created_on');
                    assert.property(res.body, 'bumped_on');
                    assert.property(res.body, '_id');
                    threadId = res.body._id;
                    done();
                });
        });
    });

    //PUT request to report a thread
    suite('PUT request to /api/threads/{board}', function () {
        test('Report a thread', function (done) {
            chai.request(server)
                .put('/api/threads/test')
                .send({
                    thread_id: threadId,
                    board: 'test',
                })
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    assert.equal(res.text, 'reported');
                    done();
                });
        });
    });

    //POST request to create a reply
    suite('POST request to /api/replies/{board}', function () {
        test('Create a new reply', function (done) {
            chai.request(server)
                .post('/api/replies/test')
                .send({ thread_id: threadId, text: 'reply text', delete_password: 'password' })
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body);
                    assert.property(res.body, 'text');
                    assert.property(res.body, 'created_on');
                    replyId = res.body._id;
                    done();
                });
        });
    });

    //PUT request to report a reply
    suite('PUT request to /api/replies/{board}', function () {
        test('Report a reply', function (done) {
            chai.request(server)
                .put('/api/replies/test')
                .send({ thread_id: threadId, reply_id: replyId})
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    assert.equal(res.text, 'reported');
                    done();
                });
        })
    });

    //DELETE request to replies
    suite('DELETE request to /api/replies/{board}', function () {
        test('Delete a reply with the incorrect password', function (done) {
            chai.request(server)
                .delete('/api/replies/test')
                .send({ thread_id: threadId, reply_id: replyId, delete_password: 'wrong password' })
                .end(function (err, res) {
                    assert.equal(res.text, 'incorrect password');
                    done();
                });
        });

        test('Delete a reply with the correct password', function (done) {
            chai.request(server)
                .delete('/api/replies/test')
                .send({ thread_id: threadId, reply_id: replyId, delete_password: 'password' })
                .end(function (err, res) {
                    assert.equal(res.status, 200);
                    assert.equal(res.text, 'success');
                    done();
                });
        });
    })
});
