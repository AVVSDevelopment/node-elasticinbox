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
 * @param user   {String} Account name
 * @param label  {Number} Label id
 * @param options {Object} Optional params are:<ul>
 * <li>[metadata] which if present will pull not just messages ID, but also metatada</li>
 * <li>[count] which will pull only specified number of messages</li>
 * <li>[start] works only if count is present and skips specified number of messages</li>
 * <li>[reverse] which if present will pull oldest messages first</li></ul>
 * @param callback
 */
Message.prototype.list = function (domain, user, label, options, callback) {

    if (arguments.length === 4)
        callback = options

    if (!v.check(user + "@" + domain).isEmail())
        return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

    if (!v.check(label).isNumeric())
        return callback("Invalid label id format", null)

    var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/label/" + label

    if (typeof options == "object" && options != null) {
        url += "?"
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
 * Get parsed message
 * @memberof Message#
 * @param domain {String} Account Domain
 * @param user   {String} Account name
 * @param uuid   {String} Message UUID
 * @param options {Object} Optional, contain options <ul>
 * <li>{*} [raw] - return raw message</li>
 * <li>{*} [adjacent] - returns prev and next messages</li>
 * <li>{Number} [label] - required with adjacent argument for fetching prev and next messages </li>
 * <li>{*} [markseen] - specify to mark message as seen
 * </ul>
 * @param callback {Function} callback
 */
Message.prototype.get = function (domain, user, uuid, options, callback) {
    if (arguments.length == 4) {
        callback = options
        options  = null
    }

    if (!v.check(user + "@" + domain).isEmail())
        return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

    if (!v.check(uuid).isUUID())
        return callback("Invalid UUID format", null)

    var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/message/" + encodeURIComponent(uuid)

    if (typeof options == "object" && options != null) {
        // add query parameters
        if (options.hasOwnProperty("raw"))
            url += "/raw"

        url += "?"

        if (options.hasOwnProperty("adjacent"))
            url += "&adjacent=true"
        if (options.hasOwnProperty("label"))
            url += "&label=" + options.label
        if (options.hasOwnProperty("markseen"))
            url += "&markseen=true"
    }

    var httpOptions = _.clone(this.options)
    httpOptions.path = url
    httpOptions.method = "GET"

    if ( options && options.compressed ) {
        httpOptions.headers = {"Accept-Encoding": "deflate"}
    }

    return query(httpOptions, 200, callback)
}

/**
 * @memberof Message#
 * @param domain {String} Account Domain
 * @param user   {String} Account name
 * @param uuid   {String}   Message UUID
 * @param [compressed] {Boolean} Get compressed message
 * @param callback {Function} callback
 */
Message.prototype.getRaw = function (domain, user, uuid, compressed, callback) {
    var options = {
        raw: true
    }

    if ( arguments.length === 5 ){
        options.compressed = true
    } else {
        callback = compressed
    }

    return this.get.call(this, domain, user, uuid, options, callback)
}

/**
 * @memberof Message#
 * @param domain {String} Account Domain
 * @param user   {String} Account name
 * @param uuid   {String}   Message UUID
 * @param callback {Function} callback
 */
Message.prototype.getRawURI = function (domain, user, uuid, callback) {
    if (!v.check(user + "@" + domain).isEmail())
        return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

    if (!v.check(uuid).isUUID())
        return callback("Invalid UUID format", null)


    var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/message/" + encodeURIComponent(uuid) + "/url"


    var httpOptions = _.clone(this.options)
    httpOptions.path = url
    httpOptions.method = "GET"

    return query(httpOptions, 307, callback)
}


/**
 * Get message part by Part ID
 * @memberof Message#
 * @param domain {String} Account Domain
 * @param user   {String} Account name
 * @param uuid   {String} Message UUID
 * @param partId {String} Part Id according to IMAP4 specification (e.g. 2 or 3.1)
 * @param callback {Function} callback
 */
Message.prototype.getMessagePartById = function (domain, user, uuid, partId, callback) {
    if (!v.check(user + "@" + domain).isEmail())
        return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

    if (!v.check(uuid).isUUID())
        return callback("Invalid UUID format", null)


    var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/message/" + encodeURIComponent(uuid) + "/" + partId


    var httpOptions = _.clone(this.options)
    httpOptions.path = url
    httpOptions.method = "GET"

    return query(httpOptions, 200, callback)
}

/**
 * Get message part by Content ID
 * @memberof Message#
 * @param domain {String} Account Domain
 * @param user   {String} Account name
 * @param uuid   {String} Message UUID
 * @param contentId {String} MIME parts can also be fetched by Content-ID which is usually used for inline attachments. Content-ID string in request MUST be enclosed within angle brackets <...> (similar to RFC2392).
 * @param callback {Function} callback
 */
Message.prototype.getMessagePartByContentId = function (domain, user, uuid, contentId, callback) {
    if (!v.check(user + "@" + domain).isEmail())
        return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

    if (!v.check(uuid).isUUID())
        return callback("Invalid UUID format", null)


    var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/message/" + encodeURIComponent(uuid) + "/<" + contentId + ">"


    var httpOptions = _.clone(this.options)
    httpOptions.path = url
    httpOptions.method = "GET"

    return query(httpOptions, 200, callback)
}


/**
 * Saves message to ElasticInbox
 * @memberof Message#
 * @param {String} domain   Account domain
 * @param {String} user     Account name
 * @param {Object} options Options to apply to: <ul>
 * <li>[label] {Number[]}  - These labels will be automatically applied to the message. Specify multiple times to apply multiple labels.</li>
 * <li>[marker] {String[]} - These markers will be automatically applied to the message. Specify multiple times to apply multiple markers.</li>
 * </ul>
 * @param {String} content  EML data
 * @param {Function} callback
 */
Message.prototype.create = function (domain, user, options, content, callback) {

    if (arguments.length === 4 ){
        callback = content
        content  = options
        options  = null
    }

    if (!v.check(user + "@" + domain).isEmail())
        return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)
    if (!content)
        return callback("Empty message", null)

    var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/message"

    if (typeof options == 'object' && options != null){
        url += "?"


        if ( options.hasOwnProperty('label') ){
            var label = options.label

            if (Array.isArray(marker)){
                _.each(label, function (_label) {
                    url += "&label=" + encodeURIComponent(_label)
                })
            } else {
                url += "&label=" + encodeURIComponent(label)
            }
        }

        if ( options.hasOwnProperty('marker') ){
            var marker = options.marker

            if (Array.isArray(marker)) {
                _.each(marker, function (_marker) {
                    url += "&marker=" + encodeURIComponent(_marker)
                })
            } else {
                url += "&marker=" + encodeURIComponent(marker)
            }
        }

    }



    var httpOptions = _.clone(this.options)
    httpOptions.path = url
    httpOptions.method = "POST"
    httpOptions.body = content

    return query(httpOptions, 201, callback)
}

/**
 * Updates existing message
 * @memberof Message#
 * @param domain {String} Account domain
 * @param user {String} Account name
 * @param uuid {String} optional label to save under
 * @param content {String} EML data
 * @param callback
 */
Message.prototype.update = function (domain, user, uuid, content, callback) {
    if (!v.check(user + "@" + domain).isEmail())
        return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

    if (!content)
        return callback("Empty message", null)

    if (!v.check(uuid).isUUID())
        return callback("Invalid UUID format", null)

    var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/message/" + uuid

    var httpOptions = _.clone(this.options)
    httpOptions.path = url
    httpOptions.method = "POST"
    httpOptions.body = content

    query(httpOptions, 201, callback)
}


/**
 * Modify labels and markers for a single message
 * @memberof Message#
 * @param domain {String} Account domain
 * @param user {String} Account name
 * @param uuid {String} message UUID
 * @param options {Object} Modification options<ul>
 * <li>addlabel {Array} Add labels to the messages, optional</li>
 * <li>removelabel {Array} Remove labels from the messages, optional</li>
 * <li>addmarker {Array} Add markers to the messages, optional</li>
 * <li>removemarker {Array} Remove markers from the messages, optional</li></ul>
 * @param callback {Function} Result callback
 */
Message.prototype.modify = function (domain, user, uuid, options, callback) {
    if (!v.check(user + "@" + domain).isEmail())
        return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

    if (!v.check(uuid).isUUID())
        return callback("Invalid UUID format", null)

    var hasOptions = false
    if (options != null && typeof options == "object") {

        opts = ['addLabel', 'removeLabel', 'addMarker', 'removeMarker']

        _.each(opts, function(opt){
            if ( options.hasOwnProperty(opt) ){
                if ( !Array.isArray(options[opt]) ){
                    options[opt] = [options[opt]]
                }
                hasOptions = true
            }
        })
    }

    if (!hasOptions)
        return callback("No modifications provided", null)

    var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/message/" + uuid + "?"

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
    httpOptions.headers = {"Content-Type": "application/json"}

    return query(httpOptions, 204, callback)
}

/**
 * Delete message from ElasticInbox: removes all labels, pushes message to the purge queue
 * @memberof Message#
 * @param domain {String} Account domain
 * @param user {String} Account name
 * @param uuid {String} Message's UUID
 * @param callback
 */
Message.prototype.delete = function (domain, user, uuid, callback) {
    if (!v.check(user + "@" + domain).isEmail())
        return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

    if (!v.check(uuid).isUUID())
        return callback("Invalid UUID format", null)

    var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/message/" + uuid


    var httpOptions = _.clone(this.options)
    httpOptions.path = url
    httpOptions.method = "DELETE"

    query(httpOptions, 204, callback)
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

    if (options != null && typeof options == "object") {
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

    _.each(messages, function (message) {
        var valid = v.check(message).isUUID()
        if (!valid)
            return callback("Invalid message UUID: " + message, null)
    })

    var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/message?"

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
 * @param messages {String[]}  Message UUIDs
 * @param callback {Function} callback
 * @returns {*}
 */
Message.prototype.batchDelete = function (domain, user, messages, callback) {

    if (!v.check(user + "@" + domain).isEmail())
        return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

    if (!Array.isArray(messages) || messages.length == 0)
        return callback("invalid messages payload", null)

    var error = null
    _.each(messages, function (message) {
        var valid = v.check(message).isUUID()
        if (!valid)
            error = "Invalid message UUID: " + message
    })
    if (error) return callback(error, null)

    var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/message"

    var httpOptions = _.clone(this.options)
    httpOptions.path = url
    httpOptions.method = "DELETE"
    httpOptions.body = messages
    httpOptions.headers = {"Content-Type": "application/json"}

    return query(httpOptions, 204, callback)
}

module.exports = Message


