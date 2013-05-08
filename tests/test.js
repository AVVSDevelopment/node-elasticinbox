assert = require("assert");
ElasticInbox = require("./elasticinbox");

describe("[Failsafe]", function() {
    describe("[Empty options]", function() {
        it("Should not allow requests if no host specified", function() {
            assert.throws(function() {
                var client = new ElasticInbox()
            }, function(error) {
                if (error instanceof Error)
                    return true
            })
        })
    })

    describe("[Invalid parameters]", function() {
        var client = new ElasticInbox({
            "host": "localhost",
            "port": 8181
        })

        it("Should return error on invalid parameters", function() {
            client.account.create("test-domain-wrong", "test", function(error, result) {
                assert.notEqual(error, null)
            })

            client.account.create("test.com", "wrong/,email", function(error, result) {
                assert.notEqual(error, null)
            })
        })
    })

    describe("[Valid parameters]", function() {
        var client = new ElasticInbox({
            "host": "localhost",
            "port": 8181
        })

        it("Should create user", function(done) {
            client.account.create("test.com", "test", function(error, result) {
                assert.equal(error, null)
                done()
            });
        });
    });
});