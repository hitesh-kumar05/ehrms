var DB_SERVICE = global.DB_SERVICE;
var securityService = require('./securityservice.js');
var RAEO_QUERIES = require('../queries/raeoQueries.js');
var req = require('request');
var async = require('async');
let config = require('config');
const { getActiveFarmerDetails } = require('./commonService.js')
const raeoVerificationFoodApi = config.get('RaeoVerificationApi');
const max_sanshodhan_count = config.get("max_sanshodhan_count2024");
var CONFIG_PARAMS = global.COMMON_CONFS;
const { format } = require('date-fns');

var raeo = {
    raeoVerificationOnFarmerByFsid: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.fs_id && params.remark && params.isFoodFarmer)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let { fs_id, farmer_code, is_approved_for_new_panjiyan = null, is_approved_for_sanshodhan = null, remark, land_details, crop_details, isFoodFarmer } = params;
        let ip_address = sessionDetails["ip_address"];
        let user_id = +sessionDetails["user_id"];

        if (is_approved_for_new_panjiyan == null && is_approved_for_sanshodhan == null) {
            return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING)
        }

        if ((is_approved_for_new_panjiyan == 1 || is_approved_for_sanshodhan == 1)) {

        }
        else {
            if ((is_approved_for_new_panjiyan == 0 || is_approved_for_sanshodhan == 0) && (land_details == 1 || crop_details == 1)) {

            }
            else {
                return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
            }
        }

        let forFoodList = [], forFoodObj = {}, tranObj, tranCallback;
        let qAndP = {};
        async.series([
            function (cback0) {
                if (fs_id && remark && isFoodFarmer && (is_approved_for_new_panjiyan == 1 || is_approved_for_new_panjiyan == 0 || is_approved_for_new_panjiyan == null) &&
                    (is_approved_for_sanshodhan == 1 || is_approved_for_sanshodhan == 0 || is_approved_for_sanshodhan == null)
                    && (land_details == 1 || land_details == 0) && (crop_details == 1 || crop_details == 0)) {
                    DB_SERVICE.createTransaction(dbkey, function (err, tranobj, trancallback) {
                        tranObj = tranobj;
                        tranCallback = trancallback;
                        dbkey = { dbkey: dbkey, connectionobj: tranObj };
                        return cback0(err);
                    })
                }
                else {
                    return cback0({ "message": `fs_id && farmer_code && remark && is_approved && isFoodFarmer, All are required.` });
                }
            },
            function (cback1) {
                let insertObj = { fs_id, farmer_code, is_approved_for_new_panjiyan, is_approved_for_sanshodhan, remark, ip_address, user_id, land_details, crop_details };
                qAndP = DB_SERVICE.getInsertClauseWithParams(insertObj, 'raeo_approved');
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err, res) {
                    if (err) {
                        return cback1(err);
                    }
                    else if (res.data["affectedRows"] == 1) {
                        return cback1();
                    }
                    else {
                        return cback1({ "message": `Insert into raeo_approved is failed.` })
                    }
                })
            },
            // call food api 
            function (cback2) {
                if (farmer_code && farmer_code.length == 15 && isFoodFarmer == "Y") {
                    forFoodObj = { "FarmerCode": farmer_code, "EnDStatus": (is_approved_for_new_panjiyan == 1 || is_approved_for_sanshodhan == 1) ? 1 : 2, "Remark": remark };
                    forFoodList.push(forFoodObj);
                    // console.log(raeoVerificationFoodApi, "Food API Called", forFoodList);
                    let options = { url: raeoVerificationFoodApi, json: true, body: forFoodList };
                    req.post(options, function (error, response, body) {
                        try {
                            if (error) {
                                return cback2(error);
                            }
                            else {
                                body = JSON.parse(body);
                                // console.log('response---------->', body, typeof (body));
                                if (body && body['Status'] == 1 && body["FarmerCode"] == farmer_code) {
                                    return cback2(null, body)
                                }
                                else if (body && body['Status'] == 1 && body["FarmerCode"] != farmer_code) {
                                    return cback2({ "message": `Farmer Code ${body["FarmerCode"]}, Found From Food Api Does Not Match with Our Farmer Code ` })
                                }
                                else {
                                    return cback2({ message: `food api error - ${body['Msg']}` })
                                }
                            }
                        } catch (e) {
                            return cback2(e);
                        }
                    });
                }
                else {
                    return cback2();
                }
            }
        ],
            function (err, res) {
                if (err) {
                    DB_SERVICE.rollbackPartialTransaction(tranObj, tranCallback, function (err4) {
                        return callback(err);
                    })
                }
                else {
                    DB_SERVICE.commitPartialTransaction(tranObj, tranCallback, function (err5) {
                        return callback(null, { "success": true, code: "RAEO_VERIFICATION_DONE" });
                    });
                }
            })
    },

    checkFarmerSanshodhanExistOrPending: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.fs_id && params.checkType)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let fs_id = +params["fs_id"];
        let checkType = +params["checkType"];
        let qAndP = RAEO_QUERIES.checkFarmerSanshodhanExistOrPending(fs_id, checkType, +max_sanshodhan_count);
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err41, res41) {
            if (err41) {
                return callback(err41);
            }
            else if (res41 && res41.data && res41.data.length > 0) {
                return callback(null, { "CheckType": checkType, "message": "Checktype Sanshodhan is Pending Or Reached To MAX Count", "success": false });
            }
            else if (res41 && res41.data && res41.data.length == 0) {
                return callback(null, { "CheckType": checkType, "message": "Checktype Sanshodhan is Valid", "success": true });
            }
            else {
                return callback({ "message": `Unexpected Error` });
            }
        })
    },

    raeoForwardKisanToSado: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.fs_id && params.uf_id && (params.edit_type_adhar_status || params.edit_type_account_status || params.edit_type_basicDetails_status))) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let { uf_id, fs_id, edit_type_adhar_status, edit_type_account_status, edit_type_basicDetails_status, farmer_code } = params;
        let insertObj = { uf_id, fs_id, farmer_code, "raeo_user_id": sessionDetails["user_id"], "raeo_entry_ip_address": sessionDetails["ip_address"] }
        let qAndP = {}, tranObj, tranCallback, Updateflag = false;
        let updateObj = { "raeo_user_id": sessionDetails["user_id"], "raeo_entry_ip_address": sessionDetails["ip_address"], "raeo_entry_dtstamp": format( new Date(), 'yyyy-MM-dd HH:mm:ss') },
            whereObj = { "fs_id": fs_id }, arr_of_status = [], old_data = [], action = '', farmer_society_data;

        const raeo_sanshodhan_select = `SELECT * FROM raeo_sanshodhan_verification rsv
        WHERE rsv.fs_id = ?`;
        async.series([
            function (cback001) {
                getActiveFarmerDetails(dbkey, request, { uf_id, fs_id }, sessionDetails, function (err, res) {
                    if (err) {
                        return cback001(err);
                    }
                    else if (res && res.isActiveFarmer && res.basic_data) {
                        farmer_society_data = res.basic_data;
                        return cback001();
                    }
                    else {
                        return cback001({ "message": `INVALID data while Checking Farmer is Active or Not` });
                    }
                })
            },
            function (cback0) {
                if (uf_id && fs_id && (edit_type_adhar_status || edit_type_account_status || edit_type_basicDetails_status)) {
                    DB_SERVICE.createTransaction(dbkey, function (err, tranobj, trancallback) {
                        tranObj = tranobj;
                        tranCallback = trancallback;
                        dbkey = { dbkey: dbkey, connectionobj: tranObj };
                        if (edit_type_adhar_status) {
                            insertObj["edit_type_adhar_status"] = 1;
                            arr_of_status.push(13);
                            updateObj["edit_type_adhar_status"] = 1;
                            action += 'PAA';
                        }
                        if (edit_type_account_status) {
                            insertObj["edit_type_account_status"] = 1;
                            arr_of_status.push(11);
                            updateObj["edit_type_account_status"] = 1;
                            action += 'PAC';
                        }
                        if (edit_type_basicDetails_status) {
                            insertObj["edit_type_basicDetails_status"] = 1;
                            arr_of_status.push(12);
                            updateObj["edit_type_basicDetails_status"] = 1;
                            action += 'PBD';
                            return cback0(err);
                        } else {
                            return cback0(err);
                        }
                    })
                }
                else {
                    return cback0({ "message": `INVALID data` });
                }
            },
            function (cback00) {
                DB_SERVICE.executeQueryWithParameters(dbkey, raeo_sanshodhan_select, [fs_id], function (err, res) {
                    if (err) {
                        return cback00(err);
                    }
                    else if (res.data && (res.data.length == 0 || res.data.length == 1)) {
                        Updateflag = res.data.length > 0;
                        old_data = res.data;
                        return cback00();
                    }
                    else {
                        return cback00({ "message": `INVALID data in Raeo_sanshodhan_verification Table` });
                    }
                })
            },
            function (cback1) {
                if (!Updateflag) {
                    qAndP = DB_SERVICE.getInsertClauseWithParams(insertObj, 'raeo_sanshodhan_verification');
                    DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err, res) {
                        if (err) {
                            return cback1(err);
                        }
                        else if (res.data["affectedRows"] == 1) {
                            return cback1()
                        }
                        else {
                            return cback1({ "message": `Insert into Proc24 raeo_sanshodhan_verification is failed.` })
                        }
                    })
                }
                else {
                    return cback1();
                }
            },
            function (cback2) {
                if (Updateflag) {
                    async.series([
                        function (cback21) {
                            let data = { ...old_data[0] }
                            data["action_ip_address"] = sessionDetails["ip_address"];
                            data['action_user_id'] = sessionDetails["user_id"];
                            data['action'] = action.trim();
                            qAndP = DB_SERVICE.getInsertClauseWithParams(data, 'app_log_raeo_sanshodhan_verification');
                            DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err, res) {
                                if (err) {
                                    return cback21(err);
                                }
                                else if (res.data["affectedRows"] == 1) {
                                    return cback21();
                                }
                                else {
                                    return cback21({ "message": `Insert into Proc24 raeo_sanshodhan_verification_log is failed.` })
                                }
                            })
                        },
                        function (cback22) {
                            qAndP = DB_SERVICE.getUpdateQueryAndparams(updateObj, whereObj, 'raeo_sanshodhan_verification');
                            DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err, res) {
                                if (err) {
                                    return cback22(err);
                                }
                                else if (res.data["affectedRows"] == 1) {
                                    return cback22()
                                }
                                else {
                                    return cback22({ "message": `UPDATE into Proc24 raeo_sanshodhan_verification is failed.` })
                                }
                            })
                        }
                    ], function (err, res) {
                        if (err) {
                            return cback2(err);
                        }
                        else {
                            return cback2()
                        }
                    })
                }
                else {
                    return cback2();
                }
            },
            function (cback3) {
                if (arr_of_status.length > 0) {
                    async.eachSeries(arr_of_status, function (status, cb1) {
                        let data = { ...farmer_society_data };
                        data["action_ip_address"] = sessionDetails["ip_address"];
                        data['action_user_id'] = sessionDetails["user_id"];
                        data['action'] = 'U';
                        data["sanshodhan_type"] = status;
                        qAndP = DB_SERVICE.getInsertClauseWithParams(data, "app_log_farmer_society");
                        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err, res) {
                            if (err) {
                                return cb1(err);
                            }
                            else if (res.data["affectedRows"] == 1) {
                                return cb1()
                            }
                            else {
                                return cb1({ "message": `Insert into Proc24 app_log_farmer_society is failed.` });
                            }
                        })
                    }, function (err, res) {
                        if (err) {
                            return cback3(err);
                        }
                        else {
                            return cback3();
                        }
                    })
                }
                else {
                    return cback3({ "message": "Internal Error Occurs" })
                }
            }
        ], function (err, res) {
            if (err) {
                DB_SERVICE.rollbackPartialTransaction(tranObj, tranCallback, function (err5) {
                    return callback(err);
                })
            }
            else {
                DB_SERVICE.commitPartialTransaction(tranObj, tranCallback, function (err5) {
                    return callback(null, { "success": true, code: "RAEO_VERIFICATION_DONE" });
                });
            }
        })
    }
}

module.exports = raeo;
