var query = require('../helpers/query'),
    v = require('../helpers/validator'),
    _ = require('lodash')


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

    var httpOptions = _.clone(this.options)
    httpOptions.path = url
    httpOptions.method = "GET"

    return query(httpOptions, 200, callback)
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

    var httpOptions = _.clone(this.options)
    httpOptions.path = url
    httpOptions.method = "POST"

    return query(httpOptions, 201, callback)
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

    var httpOptions = _.clone(this.options)
    httpOptions.path = url
    httpOptions.method = "PUT"

    return query(httpOptions, 204, callback)
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

    var httpOptions = _.clone(this.options)
    httpOptions.path = url
    httpOptions.method = "DELETE"

    return query(httpOptions, 204, callback)
}


module.exports = Label