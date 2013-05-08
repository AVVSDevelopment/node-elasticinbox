/** @module node-elasticinbox */
var _ = require("lodash");

var ElasticInbox = (function () {

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
    function ElasticInbox(options) {
        var defaults = {
            "host": "",
            "hostname": "",
            "method": "GET",
            "path": "/"
        };

        if (options == undefined || options == {}) {
            this.options = defaults;
        } else {
            this.options = _.extend(defaults, options);
        }

        if (!(this.options.host || this.options.hostname))
            throw Error("No host specified!");

        this.account.init(this.options);
        this.label.init(this.options);
        this.mailbox.init(this.options);
        this.message.init(this.options);
    }


    /* Accounts */
    var Account = require('./account');

    /* Labels */
    var Label   = require('./label');

    /* Mailboxes */
    var MailBox = require('./mailbox');

    /* Messages */
    var Message = require('./message/index.js');


    /**
     * Wrapper for Account API
     * @type {Account}
     * @name account
     * @memberof ElasticInbox#
     */
    ElasticInbox.prototype.account = new Account();

    /**
     * Wrapper for Label API
     * @type {Label}
     * @name label
     * @memberof ElasticInbox#
     */
    ElasticInbox.prototype.label = new Label();

    /**
     * Wrapper for mailbox API
     * @type {MailBox}
     * @name mailbox
     * @memberof ElasticInbox#
     */
    ElasticInbox.prototype.mailbox = new MailBox();

    /**
     * Wrapper for Message API
     * @type {Message}
     * @name message
     * @memberof ElasticInbox#
     */
    ElasticInbox.prototype.message = new Message();

    return ElasticInbox;

})();

module.exports = ElasticInbox;