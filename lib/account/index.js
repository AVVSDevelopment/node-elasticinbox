var query   = require('../helpers/query'),
    v       = require('../helpers/validator'),
    _       = require('lodash')

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

    return query(options, 201, callback)
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

    return query(options, 204, callback)
}


module.exports = Account