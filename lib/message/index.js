var query = require('../helpers/query'),
    v = require('../helpers/validator'),
    _ = require('lodash')

/**
 * @name Message
 * @class Use this as part of ElasticInbox instance: wrapper.message
 * @constructor
 */
var Message = function () {
}

Message.prototype.init = function (options) {
    this.options = options
}

/**
 * List messages for specific user under specific label
 * @memberof Message#
 * @param domain {String} Account domain
 * @param user {String} Account name
 * @param label
 * @param options {Object} Optional params are:<ul>
 * <li>[metadata] which if present will pull not just messages ID, but also metatada</li>
 * <li>[count] which will pull only specified number of messages</li>
 * <li>[start] works only if count is present and skips specified number of messages</li>
 * <li>[reverse] which if present will pull oldest messages first</li></ul>
 * @param callback
 */
Message.prototype.list = function (domain, user, label, options, callback) {

    if (!v.check(user + "@" + domain).isEmail())
        return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

    var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/label/" + encodeURIComponent(label)

    if (typeof options == "object" && options != null) {
        // add query parameters
        if (options.hasOwnProperty("metadata"))
            url += "&metadata=true"
        if (options.hasOwnProperty("count"))
            url += "&count=" + encodeURIComponent(options.count)
        if (options.hasOwnProperty("start"))
            url += "&start=" + encodeURIComponent(options.start)
        if (options.hasOwnProperty("reverse"))
            url += "&reverse=true"
    }

    var httpOptions = _.clone(this.options)
    httpOptions.path = url
    httpOptions.method = "GET"

    return query(httpOptions, 200, callback)
}

/**
 * @memberof Message#
 * @param domain {String} Account Domain
 * @param user   {String} Account name
 * @param uuid   {String}   Message UUID
 * @param params {Object} Optional, contain options
 * @param callback {Function} callback
 */
Message.prototype.get = function(domain, user, uuid, params, callback) {
    if (!v.check(user + "@" + domain).isEmail())
        return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

    if (!v.check(uuid).isUUID())
        return callback("Invalid UUID format", null)

    var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/message/" + encodeURIComponent(uuid)

    if (typeof params == "object" && params != null) {
        // add query parameters
        if (params.hasOwnProperty("raw"))
            url += "/raw"
        if (params.hasOwnProperty("adjacent"))
            url += "&adjacent=true"
        if (params.hasOwnProperty("label"))
            url += "&label=" + encodeURIComponent(params.label)
        if (params.hasOwnProperty("markseen"))
            url += "&markseen=true"
    }

    var options = _.clone(this.options)
    options.path = url
    options.method = "GET"

    return query(options, 200, callback)
}

/**
 * @memberof Message#
 * @param domain {String} Account Domain
 * @param user   {String} Account name
 * @param uuid   {String}   Message UUID
 * @param params {Object} Optional, contains options
 * @param callback {Function} callback
 */
Message.prototype.getRaw = function(domain, user, uuid, params, callback) {
   params = params || {}
   params.raw = true
   return this.get.apply(this, arguments)
}

/**
 * @memberof Message#
 * @param domain {String} Account Domain
 * @param user   {String} Account name
 * @param uuid   {String}   Message UUID
 * @param callback {Function} callback
 */
Message.prototype.getRawURI = function(domain, user, uuid, callback) {
    if (!v.check(user + "@" + domain).isEmail())
        return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

    if (!v.check(uuid).isUUID())
        return callback("Invalid UUID format", null)


    var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/message/" + encodeURIComponent(uuid) + "/url"


    var options = _.clone(this.options)
    options.path = url
    options.method = "GET"

    return query(options, 307, callback)
}

/**
 * Saves message to ElasticInbox
 * @memberof Message#
 * @param domain {String} Account domain
 * @param user {String} Account name
 * @param label {UUID} optional label to save under
 * @param content {String} EML data
 * @param callback
 */
Message.prototype.create = function(domain, user, label, content, callback) {
    if (!v.check(user + "@" + domain).isEmail())
        return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)
    if (!content)
        return callback("Empty message", null)

    var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/message"

    if (label && label != null)
    {
        if (typeof label == "array")
            _.each(label, function(_label) {
                url += "&label=" + encodeURIComponent(_label)
            })
        else if (typeof label == "string")
            url += "&label=" + encodeURIComponent(label)
    }

    var options = _.clone(this.options)
    options.path = url
    options.method = "POST"
    options.body = content

    query(options, 201, callback)
}

/**
 * Modifies messages in batch
 * @memberof Message#
 * @param domain {String} Account domain
 * @param user {String} Account name
 * @param messages {Array} Array of messages' UUIDs
 * @param options {Object} Modification options<ul>
 * <li>addlabel {Array} Add labels to the messages, optional</li>
 * <li>removelabel {Array} Remove labels from the messages, optional</li>
 * <li>addmarker {Array} Add markers to the messages, optional</li>
 * <li>removemarker {Array} Remove markers from the messages, optional</li></ul>
 * @param callback {Function} Result callback
 */
Message.prototype.batchModify = function (domain, user, messages, options, callback) {
    if (!v.check(user + "@" + domain).isEmail())
        return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

    if (options != null && typeof options == "object")
    {
        var hasOptions = false
        if (options.hasOwnProperty("addLabel") && typeof options["addLabel"] == "object")
            hasOptions = true
        if (options.hasOwnProperty("removeLabel") && typeof options["removeLabel"] == "object")
            hasOptions = true
        if (options.hasOwnProperty("addMarker") && typeof options["addMarker"] == "object")
            hasOptions = true
        if (options.hasOwnProperty("removeMarker") && typeof options["removeMarker"] == "object")
            hasOptions = true

        if (!hasOptions)
            return callback("No modifications provided", null)
    }

    if (messages == null || typeof messages != "object" && messages.length < 0)
        return callback("No messages selected", null)

    _.each(messages, function (message, async_callback) {
        var error = v.check(messages).isUUID()
        async_callback(error)
    })

    var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/message"

    _.each(options["addLabel"], function (label) {
        url += "&addlabel=" + label
    })

    _.each(options["removeLabel"], function (label) {
        url += "&removelabel=" + label
    })

    _.each(options["addMarker"], function (marker) {
        url += "&addmarker=" + marker
    })

    _.each(options["removeMarker"], function (marker) {
        url += "&removemarker=" + marker
    })

    var httpOptions = _.clone(this.options)
    httpOptions.path = url
    httpOptions.method = "PUT"
    httpOptions.body = messages
    httpOptions.headers = {"Content-Type": "application/json"}

    return query(httpOptions, 204, callback)
}

/**
 * Creates new Batch request - Delete Messages
 * @memberof Message#
 * @param domain   {String} Account domain
 * @param user     {String} Account name
 * @param messages {Array}  Message UUIDs
 * @param callback
 * @returns {*}
 */
Message.prototype.batchDelete = function (domain, user, messages, callback) {

    if (!v.check(user + "@" + domain).isEmail())
        return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

    if ( !Array.isArray(messages) || messages.length == 0 )
        return callback("invalid messages payload", null)

    async.forEach(messages, function(message, async_callback){
        var error = v.check(message).isUUID()
        async_callback(error)
    }, function(err){
        if (err) return callback(err, null)

        var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/message"

        var options     = _.clone(this.options)
        options.path    = url
        options.method  = "DELETE"
        options.body    = messages
        options.headers = {"Content-Type" : "application/json"}

        return query(options, 204, callback)
    })
}

module.exports = Message


