var assert       = require("chai").assert,
    expect       = require('chai').expect,
    ElasticInbox = require("../index.js"),
    config       = require("../config/host.json"),
    async        = require("async")

describe("[Failsafe]", function() {

    /** ElasticInbox Wrapper **/

    describe("[Empty options]", function() {
        it("Should not allow requests if no host specified", function() {
            assert.throws(function() {
                var client = new ElasticInbox()
            }, Error)
        })
    })

    /** Accounts **/

    describe("[Create email: Invalid parameters]", function() {
        var client = new ElasticInbox({
            "host": config.host,
            "port": config.port
        })

        it("Should return error on invalid parameters", function(done) {

            async.parallel([
                async.apply(client.account.create, "test-domain-wrong", "test"),
                async.apply(client.account.create, "test.com",  "wrong/,email")
            ], function(error){
                assert.notEqual(error, null)
                done()
            })

        })
    })

    describe("[Create email: Valid parameters]", function() {
        var client = new ElasticInbox({
            "host": config.host,
            "port": config.port
        })

        it("Should create user", function(done) {
            client.account.create("test.com", "test", function(error, result) {

                assert.equal(error, null)
                assert.propertyVal(result, 'ok', true)

                done()
            })
        })
    })


    describe("[Delete account: Invalid parameters]", function() {
        var client = new ElasticInbox({
            "host": config.host,
            "port": config.port
        })

        it("Should return error on invalid parameters", function() {

            client.account.delete("test-domain-wrong", "test,", function(error, result){
                assert.notEqual(error, null)
            })

            client.account.delete("test.com", 'wrong,mail', function(error, result){
                assert.notEqual(error, null)
            })

        })
    })


    describe("[Delete account: Valid parameters]", function(){
        var client = new ElasticInbox({
            "host": config.host,
            "port": config.port
        })

        it("Should delete user", function(done){
           client.account.delete("test.com", "test", function(error, result){

               assert.equal(error, null)

               done()
           })
        })
    })

    describe("[Get account information]", function(){
        it("Should return account information")
    })

    /** Labels **/

    describe("[Create label: invalid parameters]", function(){
        var client = new ElasticInbox({
            "host": config.host,
            "port": config.port
        })

        it("Should return error on invalid parameters, label cant contain ^ char", function(){
           client.label.create("test.com", "user", "label^name", function(error, result){
               assert.notEqual(error, null)
           })
        })
    })

    describe("[Create label: valid parameters]", function(){
       it("Should create label")
    })

    describe("[Delete label: label exists]", function(){
        it("Should remove existing label")
    })

    describe("[Delete label: label doesnt exist]", function(){
        it("Should throw error saying that the label doesnt exist")
    })

    describe("[getAll labels for the account: with metadata]", function(){
        it("Should return labels with metadata")
    })

    describe("[getAll labels for the account: no metadata]", function(){
        it("Should return labels without metadata")
    })

    describe("[rename label]", function(){
       it("Should rename label")
    })


    /** MailBox **/

    describe("[purge - remove deleted messages before specified data]", function(){
        it("Should delete only those messages, that were writter before specified data")
    })

    describe("[purge - remove all deleted messages forever]", function(){
        it("Should purge all deleted messages")
    })

    describe("[restore message]", function(){
        it("[Should restore deleted messages");
    })

    describe("[scrub - syncs all counter -- need clarification on that]", function(){
        it("Should do something")
    })

    /** Messages **/

    describe("[List messages]", function(){
        it("Should list messages for the specific user under specific label")
    })

    describe("[Get parsed message]", function(){
        it("Should return parsed message")
    })

    describe("[Get raw message]", function(){
        it("Should get message by UUID")
    })

    describe("[Get raw message URI]", function(){
        it("Should return raw message")
    })

    describe("[Get message part by Part ID]", function(){
        it("Should return appropriate meta-data part")
    })

    describe("[Get message part by Content ID]", function(){
        it("Should return appropriate message part by Content ID")
    })

    describe("[Store message", function(){
        it("Should store message with Label 0 if not specified")

        it("Should store message with appropriate Label id")
    })

    describe("[Update message]", function(){
        it("Should update message")
    })

    describe("[Modify labels and markers]", function(){
        it("Should be able to add and remove markers and/or labels from the message")
    })

    describe("[Delete message]", function(){
        it("Should delete message - remove all labels, and add the message to the purge queue")
    })

})