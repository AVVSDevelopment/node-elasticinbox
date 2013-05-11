var assert       = require("chai").assert,
    expect       = require('chai').expect,
    ElasticInbox = require("../index.js"),
    config       = require("../config/host.json"),
    async        = require("async"),
    _            = require('lodash'),
    fs           = require('fs'),
    emails       = [],
    inspect      = require('util').inspect

describe("[Failsafe]", function() {
    this.timeout(10000)


    before(function(done){
        var dir = __dirname + "/fixtures"

        fs.readdir(dir, function(err, files){
            if (err) return done(err)

            async.map(files, function(fileName, callback){
                fs.readFile(dir+"/"+fileName, "utf-8", callback)
            }, function(err, result){
                if (err) return done(err)
                emails = result
                done()
            })
        })
    })

    /** ElasticInbox Wrapper **/

    describe("[Empty options]", function() {
        it("Should not allow requests if no host specified", function() {
            assert.throws(function() {
                var client = new ElasticInbox()
            }, Error)
        })
    })

    var client = new ElasticInbox({
        host: config.host,
        port: config.port,
        debug: false
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
            it("should return account information: not implemented")
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

    /** Messages **/

    describe("Message", function(){
        this.timeout(15000)

        var test_label_id,
            message_test_label = "message_test_label"

        before(function(done){

            client.label.list(valid_domain, valid_username, function(err, labels){
                test_label_id = _.findKey(labels, function(label){
                    return label == message_test_label
                })

                if (test_label_id) return done()

                client.label.create(valid_domain, valid_username, "message_test_label", function(err, result){
                    if (err) return done(new Error(err))
                    test_label_id = result.id
                    done()
                })
            })
        })

        describe("#create() and #get() ", function(){

            var mail_ids = [],
                mail_id,
                test_markers = ["replied", "sent"]


            it("create: should store message with Label 0 if not specified", function(done){

                client.message.create(valid_domain, valid_username, emails[0], function(err, result){

                    assert.equal(err, null)
                    assert.property(result, 'id')

                    mail_id = result.id

                    done()
                })
            })

            it("get: should get parsed message by UUID", function(done){

                client.message.get(valid_domain, valid_username, mail_id, function(err, message){
                    assert.equal(err, null)
                    assert.property(message, 'message')

                    done()
                })

            })

            var message_ids = []
            before(function(done){
                async.forEach([0,1,2], function(i, callback){
                    client.message.create(valid_domain, valid_username, emails[2], function(err, result){
                        if (err) return callback(err)
                        message_ids[i] = result.id
                        callback(null)
                    })
                }, done)
            })

            it("get: should return parsed message and adjacent messages by UUID", function(done){

                var options = {
                    label: 0,
                    adjacent: true
                }

                client.message.get(valid_domain, valid_username, message_ids[1], options, function(err, result){

                    assert.equal(err, null)
                    assert.property(result, 'message', "No message returned")
                    assert.isDefined(result.next || result.prev, "No adjacent markers")

                    done()
                })
            })

            after(function(done){
                client.message.batchDelete(valid_domain, valid_username, message_ids, done)
            })

            it.skip("get: should return parsed message and mark it as seen by UUID", function(done){

                var options = {
                    markseen: true
                }

                client.message.get(valid_domain, valid_username, mail_id, options, function(err, result){

                    assert.equal(err, null)
                    assert.property(result, 'message', "No message returned")

                    var message = result.message

                    assert.include(message.markers, "SEEN", "seen marker was not set")

                    done()
                })

            })


            it("create: should store message with appropriate Label id", function(done){

                var options = {
                    label:  test_label_id
                }

                client.message.create(valid_domain, valid_username, options, emails[0], function(err, result){

                    assert.equal(err, null)
                    assert.property(result, 'id')

                    var id = result.id

                    client.message.get(valid_domain, valid_username, id, function(err, result){

                        assert.equal(err, null)
                        assert.property(result, 'message', 'No message fetched')

                        var message = result.message

                        assert.include(message.labels, options.label, 'Set labels were not defined')

                        done()
                    })
                })
            })

            it.skip("create: should store message with appropriate markers", function(done){

                var options = {
                    marker:  test_markers
                }

                client.message.create(valid_domain, valid_username, options, emails[0], function(err, result){

                    assert.equal(err, null)
                    assert.property(result, 'id', 'No message created')

                    var id = result.id

                    client.message.get(valid_domain, valid_username, id, function(err, result){

                        assert.equal(err, null)
                        assert.property(result, 'message', 'No message fetched')

                        var message = result.message

                        assert.includeMembers(message.markers, options.marker, "Proper markers were not set")

                        done()
                    })
                })

            })

            after(function(done){
                client.label.delete(valid_domain, valid_username, test_label_id, function(err, result){
                    assert.equal(err, null)
                    done()
                })
            })

        })

        describe("#list()", function(){

            var default_label = 0,
                message_ids   = []

            before(function(done){
                this.timeout(15000)

                var random_message_list = [],
                    total_emails        = emails.length - 1

                for(var i=0; i<20; i++){
                    //var random_email = emails[Math.floor(total_emails*Math.random())]
                    var random_email = emails[2] // use simple ascii email for speed
                    random_message_list.push(random_email)
                }

                async.forEach(random_message_list, function(message, callback){
                    client.message.create(valid_domain, valid_username, message, function(err, result){
                        if (!err) message_ids.push(result.id)
                        callback(err)
                    })
                }, done)

            })

            it("Should list messages for the specific label with no meta-data", function(done){
                client.message.list(valid_domain, valid_username, default_label, function(err, result){

                    assert.equal(err, null)
                    assert.isArray(result)

                    done()
                })
            })

            it("Should list 10 messages for the specific label with meta-data", function(done){
                var options = {metadata: true, count: 10}

                client.message.list(valid_domain, valid_username, default_label, options, function(err, result){

                    assert.equal(err, null)
                    assert.isObject(result)
                    assert.equal(Object.keys(result).length, 10)

                    done()
                })
            })

            it("Should list not more than 10 messages for the specific label with meta-data, oldest messages first", function(done){
                var options = {metadata: true, count: 10, reverse: false}

                client.message.list(valid_domain, valid_username, default_label, options, function(err, result){

                    assert.equal(err, null)
                    assert.isObject(result)

                    var uuids   = Object.keys(result),
                        msg     = result[uuids[0]],
                        nextMsg = result[uuids[1]]

                    assert.equal(uuids.length, 10)
                    assert(new Date(msg.date) <= new Date(nextMsg.date), 'First message is not older than the next one' )

                    done()
                })
            })

            it("Should list 10 messages, starting from the 6th inserted message", function(done){
                var ids,
                    options = {count: 10}

                client.message.list(valid_domain, valid_username, default_label, {count: 20}, function(err, result){
                    if (err) return done(err)
                    assert(result.length > 15, 'not enough messages in the storage')

                    ids = result
                    options.start = ids[5]

                    client.message.list(valid_domain, valid_username, default_label, options, function(err, result){

                        assert.equal(err, null)
                        assert.isArray(result)
                        assert.equal(result.length, 10)
                        assert.equal(result[0], options.start)

                        done()
                    })
                })

            })

            after(function(done){
                client.message.batchDelete(valid_domain, valid_username, message_ids, function(err, results){
                    assert.equal(err, null)
                    done()
                })
            })

        })


        describe("#getRaw() and #getRawURI", function(){

            var message_id
            before(function(done){
                client.message.create(valid_domain, valid_username, emails[2], function (err, result){
                    message_id = result.id
                    done(err)
                })
            })

            it("Should return raw message", function(done){
                client.message.getRaw(valid_domain, valid_username, message_id, function(err, result){
                    assert.equal(err, null)
                    assert.notEqual(result, null)

                    done()
                })
            })

            it("Should return raw compressed message", function(done){
                client.message.getRaw(valid_domain, valid_username, message_id, true, function(err, result, headers){

                    assert.equal(err, null)
                    assert.propertyVal(headers, 'content-encoding', 'deflate')

                    done()
                })
            })

            it("Should return raw message URI", function(done){
                client.message.getRawURI(valid_domain, valid_username, message_id, function(err, result, headers){

                    assert.equal(err, null)
                    assert.isDefined(headers.location)

                    done()
                })
            })

            after(function(done){
                client.message.delete(valid_domain, valid_username, message_id, done)
            })
        })

        describe.skip("#getMessagePartById() and #getMessagePartByContentId()", function(){

            var message_id
            before(function(done){
                // e-mail with attachment
                client.message.create(valid_domain, valid_username, emails[0], function (err, result){
                    message_id = result.id
                    done(err)
                })
            })

            it("Should return headers of the message", function(done){
                client.message.getMessagePartById(valid_domain, valid_username, message_id, 1, function(err, result, headers){
                    assert.equal(err, null)
                    console.log(result)
                    done()
                })
            })

            it("Should return image attachment by Content-ID", function(done){
                client.message.getMessagePartByContentId(valid_domain, valid_username, message_id, 'image-001', function(err, result, headers){
                    assert.equal(err, null)
                    assert.property(headers, 'Content-Type')
                    assert.property(headers, 'Content-Disposition')
                    assert.property(headers, 'Transfer-Encoding')
                    done()
                })
            })

            after(function(done){
                client.message.delete(valid_domain, valid_username, message_id, done)
            })
        })


        describe("#update()", function(){

            var message_id
            before(function(done){
                // e-mail with attachment
                client.message.create(valid_domain, valid_username, emails[0], function (err, result){
                    message_id = result.id
                    done(err)
                })
            })

            it("Should replace existing message with the new content", function(done){

                client.message.update(valid_domain, valid_username, message_id, emails[2], function(err, result){

                    assert.equal(err, null)
                    assert.property(result, 'id')

                    message_id = result.id

                    done()
                })

            })

            after(function(done){
                client.message.delete(valid_domain, valid_username, message_id, done)
            })
        })

        describe("#modify()", function(){

            var message_id,
                marker = "replied",
                label_ids = []


            before(function(done){

                var labels = ["some_labelzz", "some_label_twozz"]

                async.parallel([
                   function(callback){ client.label.create(valid_domain, valid_username, labels[0], callback) },
                   function(callback){ client.label.create(valid_domain, valid_username, labels[1], callback) }
                ], function(err, results){

                    if (err) return done(err)

                    _.each(results, function(result){
                        label_ids.push(result[0].id)
                    })

                    var options = {
                        label: label_ids[0]
                    }

                    client.message.create(valid_domain, valid_username, emails[0], options, function (err, result){

                        assert.equal(err, null)
                        assert.property(result, 'id')

                        message_id = result.id
                        done()
                    })

                })

            })

            it("Should apply new label, remove old one and add a new marker", function(done){

                var options = {
                    addLabel    : label_ids[1],
                    removeLabel : label_ids[0],
                    addMarker   : marker
                }

                client.message.modify(valid_domain, valid_username, message_id, options, function(err, result){
                    assert.equal(err, null)

                    client.message.get(valid_domain, valid_username, message_id, function(err, result){
                        assert.equal(err, null)
                        assert.property(result, 'message')

                        var message = result.message

                        assert.sameMembers(message.labels, [0, label_ids[1]], "Abnormal labels modification")
                        assert.include(message.markers, marker.toUpperCase(), "New marked didn't appear")

                        done()
                    })
                })
            })

            after(function(done){
                async.parallel([
                    function(callback){client.label.delete(valid_domain, valid_username, label_ids[0], callback)},
                    function(callback){client.label.delete(valid_domain, valid_username, label_ids[1], callback)},
                    function(callback){client.message.delete(valid_domain, valid_username, message_id, callback)}
                ], done)
            })
        })
    })

    /** MailBox **/

    describe("Mailbox", function(){

        describe("#purge()", function(){

            var startDate = new Date()


            it("Should delete only those messages, that were written before specified date", function(done){
                client.mailbox.purge(valid_domain, valid_username, startDate, function(err, result){
                    assert.equal(err, null)
                    assert.equal(result, '')

                    done()
                })
            })

            it("Should purge all deleted messages", function(done){

                client.mailbox.purge(valid_domain, valid_username, function(err, result){
                    assert.equal(err, null)
                    assert.equal(result, '')

                    done()
                })
            })
        })

        describe("#restore()", function(){
            it("[Should restore deleted messages: not implemented")
        })

        describe("#scrub()", function(){

            it("used for some bug cleansing in the ES", function(done){
                client.mailbox.scrub(valid_domain, valid_username, function(err, result){
                    assert.equal(err, null)
                    done()
                })
            })

        })

    })

})