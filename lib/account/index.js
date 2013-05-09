var query = require('../helpers/query'),
    v = require('../helpers/validator'),
    _ = require('lodash')

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

    var httpOptions = _.clone(this.options)
    httpOptions.path = url
    httpOptions.method = "POST"

    return query(httpOptions, 201, callback)
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

    var httpOptions = _.clone(this.options)
    httpOptions.path = url
    httpOptions.method = "DELETE"

    return query(httpOptions, 204, callback)
}


module.exports = Account