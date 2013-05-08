/** Query helper **/

function parseResult(statusCode, expectedCode, data, callback) {
    if (statusCode != expectedCode) {
        switch (statusCode) {
            case 500:
                return callback(data, null);
            case 404:
                return callback("Resource not found", null);
            default:
                return callback("Could not access ElasticInbox server: " + data, null);
        }
    } else {
        return callback(null, data);
    }
}

var query = function(options, expectedCode, callback) {
    var request = http.request(options, function (result) {
        var data = "";

        result.setEncoding("utf8");

        result.on("data", function (chunk) {
            data += chunk
        });

        result.on("end", function () {
            parseResult(result.statusCode, expectedCode, data, callback)
        });

        result.on("error", function (error) {
            callback(error, null)
        });
    });

    request.on("error", function (error) {
        callback(error, null)
    });

    request.end();
};

module.exports = query;