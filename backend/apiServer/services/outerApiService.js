var DB_SERVICE = global.DB_SERVICE;
var CONFIG_PARAMS = global.COMMON_CONFS
let OUTER_QUERIES = require('../queries/outerApiQueries')

let outer = {
    getNotification: function (dbkey, request, params, sessionDetails, callback) {
        let qAndP = OUTER_QUERIES.getNotificationQueryParamObj()
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
            if (e1) {
                return callback(e1);
            }
            else {
                return callback(null,r1.data);
            }
        })
    }
}

module.exports = outer