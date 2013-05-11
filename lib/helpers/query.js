var http = require('http')

/** Query helper **/

function parseResult(statusCode, expectedCode, data, headers, callback) {
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
        var response

        try {
            response = JSON.parse(data)
        } catch (e) {
            response = data
        }

        return callback(null, response, headers)
    }
}

var query = function (options, expectedCode, callback) {
    var request = http.request(options, function (result) {
        var data = ""

        result.setEncoding("utf8")

        result.on("data", function (chunk) {
            data += chunk
        })

        result.on("end", function () {
            parseResult(result.statusCode, expectedCode, data, result.headers, callback)
        })

        result.on("error", function (error) {
            callback(error, null)
        })
    })

    request.on("error", function (error) {
        callback(error, null)
    })

    if (options.body) {
        if (typeof options.body !== 'string') {
            options.body = JSON.stringify(options.body)
        }

        request.write(options.body)
    }

    if ( options.debug ){
        console.log(require('util').format("Request %s %s:%s%s", options.method, options.host, options.port, options.path))
    }

    request.end()
}

module.exports = query