var query   = require('../helpers/query'),
    v       = require('../helpers/validator'),
    _       = require('lodash');

/**
 * @name Message
 * @class Use this as part of ElasticInbox instance: wrapper.message
 * @constructor
 */
var Message = function () {
};

Message.prototype.init = function(options) {
    this.options = options;
};

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

    var options = _.clone(this.options);
    options.path = url;
    options.method = "GET";

    return query(options, 200, callback);
};

/**
 * @memberof Message#
 * @param domain
 * @param user
 * @param uuid
 * @param params
 * @param callback
 */
Message.prototype.get = function(domain, user, uuid, params, callback) {
    if (!v.check(user + "@" + domain).isEmail())
        return callback("Invalid arguments format: should be domain + username, forming email username@domain", null);

    var url = "/rest/v2/" + encodeURIComponent(domain) + "/" + encodeURIComponent(user) + "/mailbox/message/" + encodeURIComponent(uuid);

    if (typeof params == "object" && params != null) {
        // add query parameters
        if (params.hasOwnProperty("raw"))
            url += "/raw";
        if (params.hasOwnProperty("adjacent"))
            url += "&adjacent=true";
        if (params.hasOwnProperty("label"))
            url += "&label=" + encodeURIComponent(params.label);
        if (params.hasOwnProperty("markseen"))
            url += "&markseen=true";
    }

    var options = _.clone(this.options);
    options.path = url;
    options.method = "GET";

    return query(options, 200, callback);
};


module.expors = Message;