var assert       = require("chai").assert,
    expect       = require('chai').expect,
    ElasticInbox = require("../index.js"),
    config       = require("../config/host.json"),
    async        = require("async"),
    _            = require('lodash')

describe("[Failsafe]", function() {

    /** ElasticInbox Wrapper **/

    describe("[Empty options]", function() {
        it("Should not allow requests if no host specified", function() {
            assert.throws(function() {
                var client = new ElasticInbox()
            }, Error)
        })
    })

    var client = new ElasticInbox({
        "host": config.host,
        "port": config.port
    })

    var valid_domain     = "example.com",
        valid_username   = "test",
        invalid_domain   = "example,.com",
        invalid_username = "user^;name",
        invalid_label    = "invalid^label"
        valid_label      = "custom_label"

    /** Accounts **/

    describe("Account", function(){

        describe("#create()", function(){

            it("shoudn't create account with invalid arguments", function(done){
                async.parallel([
                    async.apply(client.account.create, invalid_domain,  invalid_username),
                    async.apply(client.account.create, valid_domain,    invalid_username),
                    async.apply(client.account.create, invalid_domain,  valid_username)
                ], function(error){
                    assert.notEqual(error, null)
                    done()
                })
            })

            it("should create account with valid arguments", function(done){
                client.account.create(valid_domain, valid_username, function(error, result) {

                    assert.equal(error, null)
                    assert.propertyVal(result, 'ok', true)

                    done()
                })
            })
        })

        describe("#delete()", function(){

            it("should return error on invalid arguments", function(){
                client.account.delete(invalid_domain, invalid_username, function(error, result){
                    assert.notEqual(error, null)
                })

                client.account.delete(invalid_domain, valid_username, function(error, result){
                    assert.notEqual(error, null)
                })

                client.account.delete(valid_domain, invalid_username, function(error, result){
                    assert.notEqual(error, null)
                })
            })

            it("should delete account if it exists", function(done){
                client.account.delete(valid_domain, valid_username, function(error, result){
                    assert.equal(error, null)
                    done()
                })
            })
        })

        describe("#info()", function(){
            it("should return account information: not implemented", function(){
                client.account.info(valid_domain, valid_username, function(err, result){
                    assert.notEqual(err, null)
                })
            })
        })
    })


    /** Labels **/

    describe("Label", function(){

        describe("#list()", function(){

            it("Should return error on invalid arguments", function(){

                client.label.list(invalid_domain, invalid_username, function(error, result){
                    assert.notEqual(error, null)
                })

                client.label.list(invalid_domain, valid_username, function(error, result){
                    assert.notEqual(error, null)
                })

                client.label.list(valid_domain, invalid_username, function(error, result){
                    assert.notEqual(error, null)
                })
            })

            it("Should return list of labels without metadata", function(done){
                client.label.list(valid_domain, valid_username, function(error, result){
                    assert.equal(error, null)
                    assert.isObject(result, "Label list returned")

                    done()
                })
            })

            it("Should return list of labels with metadata", function(done){
                client.label.list(valid_domain, valid_username, true, function(error, result){
                    assert.equal(error, null)
                    assert.isObject(result, "Label list returned")

                    label_ids = Object.keys(result)
                    label_ids.forEach(function(label_id){
                        assert.isObject(result[label_id])
                    })

                    done()
                })
            })

        })

        describe("#create()", function(){

            it("Should return error on invalid arguments, label cant contain ^ char", function(){
                client.label.create(valid_domain, valid_username, invalid_label, function(error, result){
                    assert.notEqual(error, null)
                })
            })

            it("Should create label", function(done){
                client.label.create(valid_domain, valid_username, valid_label, function(error, result){
                    assert.equal(error, null)
                    done()
                })
            })

        })

        describe("#rename() and #delete()", function(){

            var label_id,
                reserved_label = 0

            before(function(done){

                client.label.list(valid_domain, valid_username, function(error, result){
                    if (error) return done(error)

                    label_id = _.findKey(result, function(label) {
                        return label == valid_label
                    })

                    if (label_id) return done()

                    client.label.create(valid_domain, valid_username, valid_label, function(error, result){
                        if (error) return done(error)
                        label_id = result.id
                        done()
                    })
                })
            })

            describe("#rename()", function(){

                it("Should rename existing label", function(done){
                    client.label.rename(valid_domain, valid_username, label_id, valid_label+":rename", function(err, result){
                        assert.equal(err, null)
                        done()
                    })
                })

            })

            describe("#delete()", function(){

                it("Should remove existing label", function(done){
                    client.label.delete(valid_domain, valid_username, label_id, function(err, result){
                        assert.equal(err, null)
                        done()
                    })
                })

                it("Should not remove reserved label", function(done){
                    client.label.delete(valid_domain, valid_username, reserved_label, function(err, result){
                        assert.notEqual(err, null)
                        done()
                    })
                })

            })
        })

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