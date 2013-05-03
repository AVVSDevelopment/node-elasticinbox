_ = require("underscore");

module.exports = (function() {
    var ElasticInbox = function(options) {
        var defaults = {
            "host": "",
            "hostname": "",
            "port": 80,
            "method": "GET",
            "path": "/"
        };
        if (options == undefined || options == {}) {
            this.options = defaults;
        } else {
            this.options = _.extend(defaults, options);
        }
    };

    ElasticInbox.prototype.test = function() {
        console.log("TEST");
    };

    return ElasticInbox;
})();