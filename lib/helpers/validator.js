/** Validator helper **/

var Validator = require('validator').Validator,
    v = new Validator()

    v.error = function (msg) {
        return false
    }


module.exports = v