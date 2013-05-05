http = require("http")

_ = require("underscore")

var Validator = require('validator').Validator
var v = new Validator()
v.error = function (msg) {
    console.log(msg)
    return false
}

module.exports = (function () {

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

        request.end()
    }

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

    var Account = function () {
    }

    Account.prototype.init = function (options) {
        this.options = options
    }

    /**
     * Creates new account
     * @param domain
     * @param user
     * @param callback
     * @returns {*}
     */
    Account.prototype.create = function (domain, user, callback) {
        if (!v.check(user + "@" + domain).isEmail())
            return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

        var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user)

        var options = this.options
        options.path = url
        options.method = "POST"

        query(options, 201, callback)
    }

    /**
     * Removes account and all associated metadata
     * @param domain
     * @param user
     * @param callback
     * @returns {*}
     */
    Account.prototype.delete = function (domain, user, callback) {
        if (!v.check(user + "@" + domain).isEmail())
            return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

        var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user)

        var options = this.options
        options.path = url
        options.method = "DELETE"

        query(options, 204, callback)
    }

    /* Labels */

    var Label = function () {
    }

    Label.prototype.init = function (options) {
        this.options = options
    }

    /**
     * Get all labels for account, metadata could be anything that infers to boolean
     * @param domain
     * @param user
     * @param metadata
     * @param callback
     * @returns {*}
     */
    Label.prototype.getAll = function (domain, user, metadata, callback) {
        if (!v.check(user + "@" + domain).isEmail())
            return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

        var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox"
        if (metadata)
            url += "?metadata=true"

        var options = this.options
        options.path = url
        options.method = "GET"

        query(options, 200, callback)
    }

    /**
     * Creates new label, label name can not contain ^ symbol
     * @param domain
     * @param user
     * @param label
     * @param callback
     * @returns {*}
     */
    Label.prototype.create = function (domain, user, label, callback) {
        if (!v.check(user + "@" + domain).isEmail())
            return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

        if (typeof label != "string" || label == "" || label.indexOf("^") >= 0)
            return callback("Invalid label, please use string without ^ symbol", null)

        var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/label?name=" + encodeURIComponent(label)

        var options = this.options
        options.path = url
        options.method = "POST"

        query(options, 201, callback)
    }

    /**
     * Renames label, use ID from #getAll or returned by #create
     * @param domain
     * @param user
     * @param id
     * @param newLabel
     * @param callback
     * @returns {*}
     */
    Label.prototype.rename = function (domain, user, id, newLabel, callback) {
        if (!v.check(user + "@" + domain).isEmail())
            return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

        if (typeof newLabel != "string" || newLabel == "" || newLabel.indexOf("^") >= 0)
            return callback("Invalid label, please use string without ^ symbol", null)

        if (!v.check(id).isInt())
            return callback("Invalid ID, must be integer", null)

        var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/label/" + id + "?name=" + encodeURIComponent(newLabel)

        var options = this.options
        options.path = url
        options.method = "PUT"

        query(options, 204, callback)
    }

    /**
     * Removes label
     * @param domain
     * @param user
     * @param id
     * @param callback
     * @returns {*}
     */
    Label.prototype.delete = function (domain, user, id, callback) {
        if (!v.check(user + "@" + domain).isEmail())
            return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

        if (!v.check(id).isInt())
            return callback("Invalid ID, must be integer", null)

        var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/label/" + id

        var options = this.options
        options.path = url
        options.method = "DELETE"

        query(options, 204, callback)
    }

    /* Mailboxes */

    var MailBox = function () {
    }

    MailBox.prototype.init = function (options) {
        this.options = options
    }

    /**
     * Purges mailbox (removes deleted messages forever). If date is specified purges only before date.
     * @param domain
     * @param user
     * @param date
     * @param callback
     * @returns {*}
     */
    MailBox.prototype.purge = function (domain, user, date, callback) {
        if (!v.check(user + "@" + domain).isEmail())
            return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

        if (date && !v.check(date).isDate())
            return callback("Invalid date", null)

        var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/purge"
        if (date)
            url += "?age=" + encodeURIComponent(date)

        var options = this.options
        options.path = url
        options.method = "PUT"

        query(options, 204, callback)
    }

    /**
     * Scrubs mailbox: synchronizes all counters.
     * @param domain
     * @param user
     * @param callback
     * @returns {*}
     */
    MailBox.prototype.scrub = function (domain, user, callback) {
        if (!v.check(user + "@" + domain).isEmail())
            return callback("Invalid arguments format: should be domain + username, forming email username@domain", null)

        var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/scrub/counters"

        var options = this.options
        options.path = url
        options.method = "POST"

        query(options, 204, callback)
    }

    /* Messages */

    var Message = function () {
    }

    ElasticInbox.prototype.account = new Account()
    ElasticInbox.prototype.label = new Label()
    ElasticInbox.prototype.mailbox = new MailBox()
    ElasticInbox.prototype.message = new Message()

    return ElasticInbox
})()