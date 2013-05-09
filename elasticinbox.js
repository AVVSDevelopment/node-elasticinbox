/** @module node-elasticinbox */

var ElasticInbox = function () {

    var http = require("http")

    var _ = require("underscore")

    var Validator = require('validator').Validator
    var v = new Validator()
    v.error = function (msg) {
        return false
    }

    var parseResult = function(statusCode, expectedCode, data, callback) {
        if (statusCode != expectedCode) {
            switch (statusCode) {
                case 500:
                    return callback(data, null)
                case 404:
                    return callback("Resource not found", null)
                default:
                    return callback("Could not access ElasticInbox server: " + data, null)
            }
        } else {
            callback(null, data)
        }
    }

    var query = function(options, expectedCode, callback) {
        var request = http.request(options, function (result) {
            var data = ""

            result.setEncoding("utf8")

            result.on("data", function (chunk) {
                data += chunk
            })

            result.on("end", function () {
                parseResult(result.statusCode, expectedCode, data, callback)
            })

            result.on("error", function (error) {
                callback(error, null)
            })
        })

        request.on("error", function (error) {
            callback(error, null)
        })

        if (options.content && typeof options.content == "string")
            request.write(options.content)

        request.end()
    }

    /**
     * ElasticInbox wrapper for Node.js
     * Constructs a new wrapper instance, you should provide and options hash which includes at least host or hostname
     * @author Dmitry Gorbunov
     * @class
     * @name ElasticInbox
     * @param options {Object} Initialization parameters
     * @constructor
     * @throws Error if no host specified
     */
    var ElasticInbox = function (options) {
        var defaults = {
            "host": "",
            "hostname": "",
            "method": "GET",
            "path": "/"
        }
        if (options == undefined || options == {}) {
            this.options = defaults
        } else {
            this.options = _.extend(defaults, options)
        }

        if (!(this.options.host || this.options.hostname))
            throw Error("No host specified!")

        this.account.init(this.options)
        this.label.init(this.options)
        this.mailbox.init(this.options)
        this.message.init(this.options)
    }


    /* Accounts */

    /**
     * Account API
     * @class Use this as part of ElasticInbox instance: wrapper.account
     * @contstructor
     * @name Account
     */
    var Account = function () {
    }

    Account.prototype.init = function (options) {
        this.options = options
    }

    /**
     * Creates new account
     * @memberof Account#
     * @param domain {String} Account domain
     * @param user {String} Account name
     * @param callback
     * @returns {*}
     */
    Account.prototype.create = function (domain, user, callback) {
        if (!v.check(user + "@" + domain).isEmail())
            return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

        var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user)

        var options = _.clone(this.options)
        options.path = url
        options.method = "POST"

        query(options, 201, callback)
    }

    /**
     * Removes account and all associated metadata
     * @memberof Account
     * @param domain {String} Account domain
     * @param user {String} Account name
     * @param callback
     * @returns {*}
     */
    Account.prototype.delete = function (domain, user, callback) {
        if (!v.check(user + "@" + domain).isEmail())
            return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

        var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user)

        var options = _.clone(this.options)
        options.path = url
        options.method = "DELETE"

        query(options, 204, callback)
    }

    /* Labels */

    /**
     * Label API
     * @name Label
     * @class Use this as part of ElasticInbox instance: wrapper.label
     * @constructor
     */
    var Label = function () {
    }

    /**
     * @ignore
     */
    Label.prototype.init = function (options) {
        this.options = options
    }

    /**
     * Get all labels for account, metadata could be anything that infers to boolean
     * @memberof Label#
     * @param domain {String} Account domain
     * @param user {String} Account name
     * @param metadata {Boolean} If present forces to pull labels metadata
     * @param callback {Function(error, result)} You have to parse result according to ElasticInbox API documentation
     */
    Label.prototype.getAll = function (domain, user, metadata, callback) {
        if (!v.check(user + "@" + domain).isEmail())
            return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

        var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox"
        if (metadata)
            url += "?metadata=true"

        var options = _.clone(this.options)
        options.path = url
        options.method = "GET"

        query(options, 200, callback)
    }

    /**
     * Creates new label, label name can not contain ^ symbol
     * @memberof Label#
     * @param domain {String} Account domain
     * @param user {String} Account name
     * @param label
     * @param callback {Function}
     */
    Label.prototype.create = function (domain, user, label, callback) {
        if (!v.check(user + "@" + domain).isEmail())
            return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

        if (typeof label != "string" || label == "" || label.indexOf("^") >= 0)
            return callback("Invalid label, please use string without ^ symbol", null)

        var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/label?name=" + encodeURIComponent(label)

        var options = _.clone(this.options)
        options.path = url
        options.method = "POST"

        query(options, 201, callback)
    }

    /**
     * Renames label, use ID from #getAll or returned by #create
     * @memberof Label#
     * @param domain {String} Account domain
     * @param user {String} Account name
     * @param id
     * @param newLabel
     * @param callback
     */
    Label.prototype.rename = function (domain, user, id, newLabel, callback) {
        if (!v.check(user + "@" + domain).isEmail())
            return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

        if (typeof newLabel != "string" || newLabel == "" || newLabel.indexOf("^") >= 0)
            return callback("Invalid label, please use string without ^ symbol", null)

        if (!v.check(id).isInt())
            return callback("Invalid ID, must be integer", null)

        var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/label/" + id + "?name=" + encodeURIComponent(newLabel)

        var options = _.clone(this.options)
        options.path = url
        options.method = "PUT"

        query(options, 204, callback)
    }

    /**
     * Removes label
     * @memberof Label#
     * @param domain {String} Account domain
     * @param user {String} Account name
     * @param id
     * @param callback
     */
    Label.prototype.delete = function (domain, user, id, callback) {
        if (!v.check(user + "@" + domain).isEmail())
            return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

        if (!v.check(id).isInt())
            return callback("Invalid ID, must be integer", null)

        var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/label/" + id

        var options = _.clone(this.options)
        options.path = url
        options.method = "DELETE"

        query(options, 204, callback)
    }

    /* Mailboxes */

    /**
     * MailBox API
     * @name MailBox
     * @class Use this as part of ElasticInbox instance: wrapper.mailbox
     * @constructor
     */
    var MailBox = function () {
    }

    MailBox.prototype.init = function (options) {
        this.options = options
    }

    /**
     * Purges mailbox (removes deleted messages forever). If date is specified purges only before date.
     * @memberof MailBox#
     * @param domain {String} Account domain
     * @param user {String} Account name
     * @param date
     * @param callback
     */
    MailBox.prototype.purge = function (domain, user, date, callback) {
        if (!v.check(user + "@" + domain).isEmail())
            return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

        if (date && !v.check(date).isDate())
            return callback("Invalid date", null)

        var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/purge"
        if (date)
            url += "?age=" + encodeURIComponent(date)

        var options = _.clone(this.options)
        options.path = url
        options.method = "PUT"

        query(options, 204, callback)
    }

    /**
     * Scrubs mailbox: synchronizes all counters.
     * @memberof MailBox#
     * @param domain {String} Account domain
     * @param user {String} Account name
     * @param callback
     */
    MailBox.prototype.scrub = function (domain, user, callback) {
        if (!v.check(user + "@" + domain).isEmail())
            return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

        var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/scrub/counters"

        var options = _.clone(this.options)
        options.path = url
        options.method = "POST"

        query(options, 204, callback)
    }

    /* Messages */


    /**
     * @name Message
     * @class Use this as part of ElasticInbox instance: wrapper.message
     * @constructor
     */
    var Message = function () {
    }

    Message.prototype.init = function(options) {
        this.options = options
    }

    /**
     * List messages for specific user under specific label
     * @memberof Message#
     * @param domain {String} Account domain
     * @param user {String} Account name
     * @param label
     * @param params {Object} Optional params are:<ul>
     * <li>[metadata] which if present will pull not just messages ID, but also metatada</li>
     * <li>[count] which will pull only specified number of messages</li>
     * <li>[start] works only if count is present and skips specified number of messages</li>
     * <li>[reverse] which if present will pull oldest messages first</li></ul>
     * @param callback
     */
    Message.prototype.list = function(domain, user, label, params, callback) {
        if (!v.check(user + "@" + domain).isEmail())
            return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

        var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/label/" + encodeURIComponent(label)

        if (typeof params == "object" && params != null) {
            // add query parameters
            if (params.hasOwnProperty("metadata"))
                url += "&metadata=true"
            if (params.hasOwnProperty("count"))
                url += "&count=" + encodeURIComponent(params.count)
            if (params.hasOwnProperty("start"))
                url += "&start=" + encodeURIComponent(params.start)
            if (params.hasOwnProperty("reverse"))
                url += "&reverse=true"
        }

        var options = _.clone(this.options)
        options.path = url
        options.method = "GET"

        query(options, 200, callback)
    }

    /**
     * Get message by UUID
     * @memberof Message#
     * @param domain {String} Account domain
     * @param user {String} Account name
     * @param uuid
     * @param params
     * @param callback
     */
    Message.prototype.get = function(domain, user, uuid, params, callback) {
        if (!v.check(user + "@" + domain).isEmail())
            return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

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

        query(options, 200, callback)
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
        options.content = content;

        query(options, 201, callback)
    }

    /**
     * Wrapper for Account API
     * @type {Account}
     * @name account
     * @memberof ElasticInbox#
     */
    ElasticInbox.prototype.account = new Account()

    /**
     * Wrapper for Label API
     * @type {Label}
     * @name label
     * @memberof ElasticInbox#
     */
    ElasticInbox.prototype.label = new Label()

    /**
     * Wrapper for MailBox API
     * @type {MailBox}
     * @name mailbox
     * @memberof ElasticInbox#
     */
    ElasticInbox.prototype.mailbox = new MailBox()

    /**
     * Wrapper for Message API
     * @type {Message}
     * @name message
     * @memberof ElasticInbox#
     */
    ElasticInbox.prototype.message = new Message()

    return ElasticInbox
}

module.exports = exports = ElasticInbox()