var DB_SERVICE = global.DB_SERVICE;
var CONFIG_PARAMS = global.COMMON_CONFS;
var async = require("async");
const CryptoJS = require("crypto-js");
const config = require('config');
const aadharService = require('../services/aadharService.js');
const outerService = require('../services/outerApiService.js');

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
    SERVICE_FILE_NOT_FOUND: { code: 'sc012', message: 'service file name not found' },
    FUNCTION_NAME_NOT_FOUND: { code: 'sc013', message: 'incorrect route name' }
}
module.exports.SECURITY_ERRORS = SECURITY_ERRORS

var security = {
    commonFunctionToCall: function (service_name, funcName, req, res, params, permissions, ispermreq, resSendCallback) {
        security.isAuthorized(req.query.dbkey, req, permissions, function (err, ispermit, sessionDetails) {
            if (!ispermreq || ispermit) {
                try {
                    if (!service_files[service_name]) return resSendCallback ? resSendCallback({ error: SECURITY_ERRORS.SERVICE_FILE_NOT_FOUND }) : res.status(503).json({ error: SECURITY_ERRORS.SERVICE_FILE_NOT_FOUND });

                    if (!service_files[service_name][funcName]) return resSendCallback ? resSendCallback({ error: SECURITY_ERRORS.SERVICE_FILE_NOT_FOUND }) : res.status(404).json({ error: SECURITY_ERRORS.FUNCTION_NAME_NOT_FOUND });
                    service_files[service_name][funcName](req.query.dbkey, req, params, sessionDetails, function (err, result) {
                        if (err) {
                            //errServeice.saveErrToDB(req.query.dbkey, err, funcName, sessionDetails, function (err1, res1) {
                                return resSendCallback ? resSendCallback(err, result) : res.json({ error: err, data: result });
                            //})
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

    getSessionDetails: function (dbkey, session_id, callback) {
        dbkey = CONFIG_PARAMS.getUfpDBDetails()
        let sessionDetailQueryAndParam = SECURITY_SERVICE_QUERIES.getSessionDetailQuery(session_id);
        DB_SERVICE.executeQueryWithParameters(dbkey, sessionDetailQueryAndParam.query, sessionDetailQueryAndParam.params, function (err, res) {
            if (res && res.data && res.data.length == 1) {
                return callback(null, res.data[0])
            } else {
                return callback(SECURITY_ERRORS.INVALID_SESSION);
            }

        })
    },

    isAuthorized: function (dbkey, request, permission, callback) {
        return callback(null, true, '');
        if (!permission) {
            permission = "";
        }
        dbkey = CONFIG_PARAMS.getUfpDBDetails()
        var pers = permission.split(",");
        security.getSessionDetails(dbkey, request.session.id, function (err, user) {
            if (err) {
                return callback(err, false, {})
            } else {
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
    "aadhar" : aadharService,
    "outer" : outerService
}

module.exports = security
