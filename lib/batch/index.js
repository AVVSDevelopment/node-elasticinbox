var query   = require('../helpers/query'),
    v       = require('../helpers/validator'),
    _       = require('lodash'),
    async   = require('async')

/**
 * Batch API
 * @class Use this as part of ElasticInbox instance: wrapper.batch
 * @contstructor
 * @name Batch
 */
var Batch = function () {
}

Batch.prototype.init = function (options) {
    this.options = options
}

/**
 * Creates new Batch request - Modife Messages
 * @memberof Batch#
 * @param domain {String} Account domain
 * @param user {String} Account name
 * @param addlabel {Array} Add labels to the messages, optional
 * @param removelabel {Array} Remove labels from the messages, optional
 * @param addmarker {Array} Add markers to the messages, optional
 * @param removemarker {Array} Remove markers from the messages, optional
 * @param messages {Array} Message UUIDs
 * @param callback
 * @returns {*}
 */
Batch.prototype.messageModify = function () {
    var domain          = arguments[0],
        user            = arguments[1],
        i,
        splat           = 4 <= arguments.length ? arguments.slice(2, i = arguments.length - 1) : (i = 2, []),
        addlabel        = splat[0] || [],
        removelabel     = splat[1] || [],
        addmarker       = splat[2] || [],
        removemarker    = splat[3] || [],
        messages        = arguments[i++],
        callback        = arguments[i++]


    if (!v.check(user + "@" + domain).isEmail())
        return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

    if ( (addlabel.length + removelabel.length + addmarker.length + removemarker.length) === 0 )
        return callback("No actions supplied", null)

    if ( messages.length < 0 )
        return callback("No message UUIDs supplied", null)

    async.forEach(messages, function(message, async_callback){
        var error = v.check(messages).isUUID()
        async_callback(error)

    }, function(err){
        if (err) return callback(err, null)

        var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/message?"

        addlabel.forEach(function(label){
            url += "addlabel="+label+"&"
        })

        removelabel.forEach(function(label){
            url += "removelabel="+label+"&"
        })

        addmarker.forEach(function(marker){
            url += "addmarker="+marker+"&"
        })

        removemarker.forEach(function(marker){
            url += "removemarker="+marker+"&"
        })

        var options     = _.clone(this.options)
        options.path    = url
        options.method  = "PUT"
        options.body    = messages
        options.headers = {"Content-Type" : "application/json"}


        return query(options, 204, callback)
    })
}


module.exports = Batch