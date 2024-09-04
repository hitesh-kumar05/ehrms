var DB_SERVICE = global.DB_SERVICE;
var CONFIG_PARAMS = global.COMMON_CONFS;
var securityService = require('./securityservice.js');
var REPORT_QUERIES = require('../queries/reportQueries.js');
var async = require('async');

let report = {
    panjiyanReport: function (dbkey, request, params, sessionDetails, callback) {
        let qAndParam = REPORT_QUERIES.panjiyanReportQueryParamObj(params)
        let panjiyan_data = []
        async.series([
            function (cback1) {
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
                    if (e1) {
                        return cback1(e1);
                    }
                    else if (r1 && r1.data && r1.data.length > 0) {
                        panjiyan_data = r1.data
                        return cback1(null, panjiyan_data)
                    }
                    else {
                        return cback1(securityService.SECURITY_ERRORS.DATA_NOT_FOUND);
                    }
                })
            },
            function (cback2) {
                panjiyan_data.map(e => {
                    e.cf_per = (((e.old_cf + e.old_request + e.old_deleted) / e.total_cf) * 100)
                    return e
                })
                panjiyan_data.sort((a, b) => b["cf_per"] - a['cf_per']);
                return cback2()
            }
        ], function (err, res) {
            if (err) return callback(err)
            return callback(null, panjiyan_data)
        })

    },
    raeoVarificationReport: function (dbkey, request, params, sessionDetails, callback) {
        let qAndParam = REPORT_QUERIES.raeoVarificationReportQueryParamObj(params)
        let panjiyan_data = []
        async.series([
            function (cback1) {
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
                    if (e1) {
                        return cback1(e1);
                    }
                    else if (r1 && r1.data && r1.data.length > 0) {
                        panjiyan_data = r1.data
                        return cback1(null, panjiyan_data)
                    }
                    else {
                        return cback1(securityService.SECURITY_ERRORS.DATA_NOT_FOUND);
                    }
                })
            },
            function (cback2) {
                panjiyan_data.map(obj => {
                    obj.rest = (obj.nf + obj.society_sf + obj.tehsil_sf) - (obj.raeo_nf + obj.raeo_rf + obj.raeo_sf)
                    if ((obj.nf + obj.society_sf + obj.tehsil_sf) === 0) {
                        obj.percent = 0;
                    } else {
                        obj.percent = ((obj.raeo_nf + obj.raeo_rf + obj.raeo_sf) / (obj.nf + obj.society_sf + obj.tehsil_sf)) * 100;
                    }
                    return obj
                })
                panjiyan_data.sort((a, b) => b["percent"] - a['percent']);
                return cback2()
            }
        ], function (err, res) {
            if (err) return callback(err)
            return callback(null, panjiyan_data)
        })

    },
    cropPanjiyanReport: function (dbkey, request, params, sessionDetails, callback) {
        let qAndParam = REPORT_QUERIES.cropPanjiyanReportQueryParamObj(params)
        let panjiyan_data = []
        async.series([
            function (cback1) {
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
                    if (e1) {
                        return cback1(e1);
                    }
                    else if (r1 && r1.data && r1.data.length > 0) {
                        panjiyan_data = r1.data
                        return cback1(null, panjiyan_data)
                    }
                    else {
                        return cback1(securityService.SECURITY_ERRORS.DATA_NOT_FOUND);
                    }
                })
            }

        ], function (err, res) {
            if (err) return callback(err)
            return callback(null, panjiyan_data)
        })
    },
    panjiyanListRepost: function (dbkey, request, params, sessionDetails, callback) {
        let qAndParam = REPORT_QUERIES.panjiyanListQueryParamObj(params)
        let panjiyan_data = []
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
            if (e1) {
                return callback(e1);
            }
            else if (r1 && r1.data && r1.data.length > 0) {
                panjiyan_data = r1.data
                return callback(null, panjiyan_data)
            }
            else {
                return callback(securityService.SECURITY_ERRORS.DATA_NOT_FOUND);
            }
        })
    },
    farmerListforDisaplyBySociety : function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.society_id)) return callback({ ...securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING, 'message': 'society_id  is required.' });
        let qAndParam = REPORT_QUERIES.farmerListforDisaplyBySocietyQueryParamObj(params.society_id)
        let panjiyan_data = []
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
            if (e1) {
                return callback(e1);
            }
            else if (r1 && r1.data && r1.data.length > 0) {
                panjiyan_data = r1.data
                return callback(null, panjiyan_data)
            }
            else {
                return callback(securityService.SECURITY_ERRORS.DATA_NOT_FOUND);
            }
        })
    },
}

module.exports = report