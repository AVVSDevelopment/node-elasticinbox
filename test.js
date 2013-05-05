assert = require("assert");
ElasticInbox = require("./elasticinbox");

describe("[Failsafe]", function() {
    describe("[Empty options]", function() {
        var client = new ElasticInbox();

        it("Should not allow requests if no host specified", function() {
            client.account.create("test.com", "test@test.com", function(error, result) {
                assert.notEqual(error, null);
            });
        });
    });

    describe("[Invalid parameters]", function() {
        var client = new ElasticInbox({
            "host": "localhost",
            "port": 8181
        });

        it("Should return error on invalid parameters", function() {
            client.account.create("test-domain-wrong", "test", function(error, result) {
                assert.notEqual(error, null);
            });

            client.account.create("test.com", "wrong/,email", function(error, result) {
                assert.notEqual(error, null);
            })
        });
    });

    describe("[Valid parameters]", function() {
        var client = new ElasticInbox({
            "host": "localhost",
            "port": 8181
        });

        it("Should create user", function(done) {
            client.account.create("test.com", "test", function(error, result) {
                assert.equal(error, null);

                console.log(result);

                done();
            });
        });
    });
});