/** Validator helper **/

var Validator = require('validator').Validator,
    v = new Validator()

v.error = function (err) {
    return false
}

module.exports = v