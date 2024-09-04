
var DB_SERVICE = global.DB_SERVICE;
var CONFIG_PARAMS = global.COMMON_CONFS;
var SECURITY_SERVICE_QUERIES = require('../queries/securityservicequeries');
var farmerService = require('./farmerService.js');
let errServeice = require('./errorService.js');
let bhuiyanService = require('./bhuiyanService.js');
let listService = require('./listService.js');
let reportService = require('./reportService.js');

let SECURITY_ERRORS = {
    UNKNOWN_ERROR: { code: "sc000", message: "Some error occurred" },
    USER_NOT_EXIST: { code: "sc001", message: "Invalid Username Or Password" },
    INVALID_USER_OR_PASSWORD: { code: "sc002", message: "Invalid Username Or Password" },
    INVALID_SESSION: { code: "sc003", message: "Invalid Session" },
    SESSION_EXPIRES: { code: "sc005", message: "Session Expires" },
    INVALID_USER_DETAILS: { code: "sc004", message: "Invalid User Details" },
    INVALID_LOGIN_DETAILS: { code: "sc0", message: "Invalid Login Id" },
    MANDATORY_FIELDS_ARE_MISSING: { code: "sc005", message: "Mandatory Fields Are Missing" },
    USER_ALREADY_EXISTS: { code: "sc006", message: "User Already Registered" },
    SUCCESS: { code: "000", message: "Successfull" },
    UNABLE_TO_CREATE_USER: { code: "sc007", message: "Unable To Create User" },
    PERMISSIONS_CANNOT_BE_SET: { code: "sc008", message: "Permissions Cannot Be Set" },
    PERMISSION_DENIED: { code: "sc009", message: "Permission Denied" },
    USER_ID_BLOCKED: { code: "sc010", message: "User is blocked" },
    USERFULLNAME_ALREADY_EXISTS: { code: "sc0011", message: "Duplicate Display Name" },
    SERVICE_FILE_NOT_FOUND: { code: 'sc012', message: 'Service File Name Not Found' },
    FUNCTION_NAME_NOT_FOUND: { code: 'sc013', message: 'Incorrect Route Name' },
    DATA_NOT_FOUND: { code: 'sc014', message: 'No Data Found' },
    INVALID_AADHAR_NO: { code: 'sc014', message: 'Invalid Aadhar Provided' },
}
module.exports.SECURITY_ERRORS = SECURITY_ERRORS

var security = {
    commonFunctionToCall: function (service_name, funcName, req, res, params, permissions, ispermreq, resSendCallback) {
        security.isAuthorized(req.query.dbkey, req, permissions, function (err, ispermit, sessionDetails) {
            if (!ispermreq || ispermit) {
                try {
                    if (!service_files[service_name]) return resSendCallback ? resSendCallback({ error: SECURITY_ERRORS.SERVICE_FILE_NOT_FOUND }) : res.status(503).json({ error: SECURITY_ERRORS.SERVICE_FILE_NOT_FOUND });

                    if (!service_files[service_name][funcName]) return resSendCallback ? resSendCallback({ error: SECURITY_ERRORS.SERVICE_FILE_NOT_FOUND }) : res.status(404).json({ error: SECURITY_ERRORS.FUNCTION_NAME_NOT_FOUND });
                    // for live database access in report
                    if (service_name == 'report') {
                        req.query.dbkey = CONFIG_PARAMS.getLiveDBDetails();
                        req.query.dbkey['database'] = season_live_database[sessionDetails.season ?? 24]
                    }
                    service_files[service_name][funcName](req.query.dbkey, req, params, sessionDetails, function (err, result) {
                        if (err) {
                            errServeice.saveErrToDB(req.query.dbkey, err, funcName, sessionDetails, function (err1, res1) {
                                return resSendCallback ? resSendCallback(err, result) : res.json({ error: err, data: result });
                            })
                        } else {
                            return resSendCallback ? resSendCallback(err, result) : res.json({ error: err, data: result });
                        }
                    })
                } catch (error) {
                    console.log(error);
                    return resSendCallback ? resSendCallback({ error: SECURITY_ERRORS.UNKNOWN_ERROR }) : res.status(500).json({ error: SECURITY_ERRORS.UNKNOWN_ERROR });
                }

            } else {
                res.status(401).json({ invalidsession: (!sessionDetails || !sessionDetails.rootuserid), error: err, data: { permission: ispermit } });
            }
        })
    },

    getSessionDetails: function (dbkey, session_id, season, callback) {
        dbkey = CONFIG_PARAMS.getUfpDBDetails()
        let sessionDetailQueryAndParam = SECURITY_SERVICE_QUERIES.getSessionDetailQuery(session_id, season);
        DB_SERVICE.executeQueryWithParameters(dbkey, sessionDetailQueryAndParam.query, sessionDetailQueryAndParam.params, function (err, res) {
            if (res && res.data && res.data.length == 1) {
                return callback(null, res.data[0])
            } else {
                return callback(SECURITY_ERRORS.INVALID_SESSION);
            }

        })
    },

    isAuthorized: function (dbkey, request, permission, callback) {
        if (!permission) {
            permission = "";
        }
        dbkey = CONFIG_PARAMS.getUfpDBDetails()
        var pers = permission.split(",");
        security.getSessionDetails(dbkey, request.session.id, 24, function (err, user) {
            if (err) {
                return callback(err, false, {})
            } else {
                user['district_id'] = request.session.district_id
                user['rev_district_id'] = request.session.rev_district_id
                user['user_type'] = request.session.user_type;
                user['season'] = request.session.season;
                if (request.headers['x-forwarded-for']) {
                    ip = request.headers['x-forwarded-for'].split(",")[0];
                    user["ip_address"] = ip;
                } else if (request.connection && request.connection.remoteAddress) {
                    ip = request.connection.remoteAddress;
                    user["ip_address"] = ip;
                } else {
                    ip = request.ip;
                    user["ip_address"] = ip;
                }
                return callback(null, true, (user) ? user : null);
            }
        })

    },
}

var service_files = {
    "farmer": farmerService,
    "security": security,
    "bhuiyan": bhuiyanService,
    "list": listService,
    "report": reportService
}
let season_live_database ={
    '24':'procurement_2024'
}

module.exports = security
