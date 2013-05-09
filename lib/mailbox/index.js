var query = require('../helpers/query'),
    v = require('../helpers/validator'),
    _ = require('lodash')


/**
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

    return query(options, 204, callback)
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

    return query(options, 204, callback)
}

/**
 * Restore deleted messages.
 * @memberof mailbox#
 * @param domain {String} Account domain
 * @param user   {String} Account name
 * @param age    {Date}   Date can be in any format in the current locale which is understood by the java.text.DateFormat.parse(String), for instance "2011/04/15" or "2011/05/01 14:30"
 * @param callback
 */
MailBox.prototype.restore = function(){
   var domain   = arguments[0],
       user     = arguments[1],
       i,
       splat    = 4 <= arguments.length ? arguments.slice(2, i = arguments.length - 1) : (i = 2, []),
       age      = splat[0],
       callback = arguments[i]

   return callback("NOT IMPLEMENTED", null)
}

module.exports = MailBox