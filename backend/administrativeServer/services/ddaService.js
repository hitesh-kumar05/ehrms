var async = require('async');
var DB_SERVICE = global.DB_SERVICE;
var SECURITY_SERVICE = require('./securityservice.js')
const { insrtAndUpdtOperation, insrtAndDltOperation } = require('./commonService.js');
let config = require('config');
let ufp_database = config.get('ufp_db').database ?? 'ufp_2024'
const userValidations = require('../validators/uservalidator.js');
let dda_s = {
    UpdateBlockOfficerDetails: (dbkey, request, params, sessionDetails, callback) => {
        let { name, alternate_mobile_no, email_id, mobile_no, user_type, circle_name, user_id } = params;
        let isNewOfficer = params["isNewOfficer"] ?? false;
        let tranObj, tranCallback;
        async.series([
            function (cback0) {
                if (name && mobile_no && alternate_mobile_no && email_id && user_type) {
                    DB_SERVICE.createTransaction(dbkey, function (err, tranobj, trancallback) {
                        tranObj = tranobj;
                        tranCallback = trancallback;
                        dbkey = { dbkey: dbkey, connectionobj: tranObj };
                        return cback0(err);
                    })
                }
                else {
                    return cback0({ ...SECURITY_SERVICE.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING, "message": `Name, Mobileno, Alternate Mobileno, emailid, usertype is required.` });
                }

            },

            function (cback1) {
                async.parallel([
                    //insert and update in mas_raeo
                    function (cback11) {
                        updateObj = { name, alternate_mobile_no, mobile_no, email_id, circle_name, "updated_ip_address": sessionDetails['ip_address'], "updated_user_id": sessionDetails['user_id'] }
                        insrtAndUpdtOperation(dbkey, request, { log_table_name: 'app_log_mas_raeo', update_table_name: 'mas_raeo', whereObj: { user_id: params['user_id'] }, updateObj: updateObj, update_type: 2, action: 'U' }, sessionDetails, function (err, res) {
                            return cback11(err)
                        })

                    },
                    // insert and update in ufp24 users table
                    function (cback12) {
                        updateObj = { "username": name, "updated_ip_address": sessionDetails['ip_address'], "updated_user_id": sessionDetails['user_id'] }
                        insrtAndUpdtOperation(dbkey, request, { log_table_name: ufp_database + '.app_log_users', update_table_name: ufp_database + '.users', whereObj: { user_id: params['user_id'] }, updateObj: updateObj, update_type: 2, action: 'U' }, sessionDetails, function (err, res) {
                            return cback12(err)
                        })
                    },
                    // update in  users table
                    function (cback13) {
                        updateObj = { "username": name, "updated_ip_address": sessionDetails['ip_address'], "updated_user_id": sessionDetails['user_id'] }
                        qAndParam = DB_SERVICE.getUpdateQueryAndparams(updateObj, { user_id: params['user_id'] }, 'users');
                        DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
                            if (e1) {
                                return cback13(e1);
                            }
                            else if (r1.data["affectedRows"] == 1) {
                                return cback13();
                            }
                            else {
                                return cback13({ "message": `zero record update in procurment users table on username change.` });
                            }
                        })
                    },
                ], function (err, res) {
                    return cback1(err)
                })

            },

        ], function (err, res) {
            if (err) {
                DB_SERVICE.rollbackPartialTransaction(tranObj, tranCallback, function (err4) {
                    return callback(err);
                });
            }
            else {
                DB_SERVICE.commitPartialTransaction(tranObj, tranCallback, function (err5) {
                    return callback(null, { "code": "OPERATION_SUCCESS" });
                });
            }
        })
    },
    UpdateRaeoDetails: function (dbkey, request, params, sessionDetails, callback) {
        // console.log(params, 'PP');
        let tranCallback, tranObj;
        let raeo_id;
        async.series([
            function (cback1) {
                const { error, value } = userValidations.UpdateRaeoDetailsObjectValidation(params);
                if (error && error.details) {
                    return cback1(error.details[0].message);
                } else {
                    DB_SERVICE.createTransaction(dbkey, function (err, tranobj, trancallback) {
                        tranObj = tranobj;
                        tranCallback = trancallback;
                        dbkey = { dbkey: dbkey, connectionobj: tranObj };
                        return cback1(err);
                    })
                }
            },
            // insert and update in mas_raeo
            function (cback2) {
                let { name, user_id, district_id, circle_name, mobile_no, subdistrict_code, alternate_mobile_no, email_id } = params;
                raeo_id = user_id
                let updateObj = {
                    name, mobile_no, alternate_mobile_no, email_id, circle_name,
                    district_id, subdistrict_code, updated_user_id: sessionDetails["user_id"], updated_ip_address: sessionDetails["ip_address"]
                };
                let whereObj = { user_id };
                insrtAndUpdtOperation(dbkey, request, { log_table_name: 'app_log_mas_raeo', update_table_name: 'mas_raeo', updateObj, whereObj, update_type: 1 }, sessionDetails, function (err, res) {
                    if (err) {
                        return cback2(err);
                    }
                    else {
                        return cback2(null, res);
                    }
                })
            },
            // insert and update in users in ufp database
            function (cback3) {
                let { name, user_id, subdistrict_code } = params;
                let updateObj = { "username": name, "subdistrict_code": subdistrict_code, updated_user_id: sessionDetails["user_id"], updated_ip_address: sessionDetails["ip_address"] }
                let whereObj = { user_id };
                insrtAndUpdtOperation(dbkey, request, { log_table_name: ufp_database + '.app_log_users', update_table_name: ufp_database + '.users', updateObj, whereObj, update_type: 1 }, sessionDetails, function (err, res) {
                    if (err) {
                        return cback3(err);
                    }
                    else {
                        return cback3(null, res);
                    }
                })
            },
            // update in offficer_village_details
            function (cback3) {
                dda_s.UpdateRaeoMapVillage(dbkey, request, { villages: params['villages'], raeo_id: raeo_id }, sessionDetails, function (err, res) {
                    if (err) {
                        return cback3(err);
                    }
                    else {
                        return cback3()
                    }
                })
            },

        ], function (e, r) {
            if (e) {
                DB_SERVICE.rollbackPartialTransaction(tranObj, tranCallback, function (err5) {
                    return callback(e);
                })
            }
            else {
                DB_SERVICE.commitPartialTransaction(tranObj, tranCallback, function (err5) {
                    return callback(null, { "code": `VILLAGE_MAPPED_SUCCESSFULLY`, "raeo_id": raeo_id });
                });
            }
        })
    },
    UpdateRaeoMapVillage: function (dbkey, request, params, sessionDetails, callback) {
        // if (!(params.villages && params.raeo_id)) return callback({ ...SECURITY_SERVICE.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING, "message": `villages array and raeo_id is required for UpdateRaeoMapVillage.` });
        // check input validation
        const { error, value } = userValidations.UpdateRaeoMapVillageObjectValidation(params);
        if (error && error.details) {
            return callback(error.details[0].message);
        }
        let department_code = 2
        async.eachSeries(params.villages, function (village_code, cb) {
            async.series([
                // insert in app_log and delete record from officer_village_map
                function (cback2) {
                    insrtAndDltOperation(dbkey, request, { delete_table_name: 'officer_village_details', log_table_name: 'app_log_officer_village_details', whereObj: { village_code: village_code, "department_code": department_code } }, sessionDetails, function (err, res) {
                        return cback2(err)
                    })
                },
                // insert new record in officer_village_map
                function (cback3) {
                    let insertObj = {
                        "officer_code": params.raeo_id, "village_code": village_code, "department_code": department_code, "ip_address": sessionDetails["ip_address"],
                        "remark": "Agri", user_id: sessionDetails['user_id']
                    }
                    qAndParam = DB_SERVICE.getInsertClauseWithParams(insertObj, 'officer_village_details');
                    DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (err, res) {
                        if (err) {
                            return cback3(err);
                        }
                        else if (res.data["affectedRows"] == 1) {
                            return cback3()
                        }
                        else {
                            return cback3({ "message": `Insert into officer_village_details is failed.` })
                        }
                    })
                }
            ], function (err, res) {
                return cb(err);
            })
        }
            , function (err, res) {
                return callback(err)
            })
    },
    AddNewRaeo: function (dbkey, request, params, sessionDetails, callback) {
        let tranCallback, tranObj;
        let raeo_id,user_type=6;
        async.series([
            function (cback1) {
                const { error, value } = userValidations.AddNewRaeoDetailsObjectValidation(params);
                if (error && error.details) {
                    return cback1(error.details[0].message);
                } else {
                    DB_SERVICE.createTransaction(dbkey, function (err, tranobj, trancallback) {
                        tranObj = tranobj;
                        tranCallback = trancallback;
                        dbkey = { dbkey: dbkey, connectionobj: tranObj };
                        return cback1(err);
                    })
                }
            },
            // insert in mas_raeo
            function (cback2) {
                let { name, district_id, circle_name, mobile_no, subdistrict_code, alternate_mobile_no, email_id } = params;
                let insertObj = {
                    name, mobile_no, alternate_mobile_no, email_id, circle_name, "user_type": user_type,
                    district_id, subdistrict_code, "created_by": sessionDetails['user_id'], "ip_address": sessionDetails['ip_address'], "remark": "Agri"
                };
                let qAndParam = DB_SERVICE.getInsertClauseWithParams(insertObj, 'mas_raeo');
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (err, res) {
                    if (err) {
                        return cback2(err);
                    }
                    else if (res.data["affectedRows"] == 1) {
                        raeo_id = res.data["insertId"]
                        return cback2()
                    }
                    else {
                        return cback2({ "message": `Insert into  mas_raeo is failed.` })
                    }
                })
            },
            // insert in users in ufp database
            function (cback3) {
                let { name, district_id, subdistrict_code } = params;
                let insertObj = {
                    "user_id": raeo_id, "username": name, "usertype": user_type, "password_flag": 0, "district_id": district_id, "tehsil_id": '',
                    "subdistrict_code": subdistrict_code, "div_id": 0, "is_active": 1,"created_by": sessionDetails['user_id'], "ip_address": sessionDetails['ip_address']
                }
                let qAndParam = DB_SERVICE.getInsertClauseWithParams(insertObj, ufp_database + '.users');
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (err, res) {
                    if (err) {
                        return cback3(err);
                    }
                    else if (res.data["affectedRows"] == 1) {
                        return cback3()
                    }
                    else {
                        return cback3({ "message": `Insert into  users is failed in ufp database.` })
                    }
                })
            },
            // update in offficer_village_details
            function (cback3) {
                dda_s.UpdateRaeoMapVillage(dbkey, request, { villages: params['villages'], raeo_id: raeo_id }, sessionDetails, function (err, res) {
                    if (err) {
                        return cback3(err);
                    }
                    else {
                        return cback3()
                    }
                })
            },

        ], function (e, r) {
            if (e) {
                DB_SERVICE.rollbackPartialTransaction(tranObj, tranCallback, function (err5) {
                    return callback(e);
                })
            }
            else {
                DB_SERVICE.commitPartialTransaction(tranObj, tranCallback, function (err5) {
                    return callback(null, { "code": `VILLAGE_MAPPED_SUCCESSFULLY`, "raeo_id": raeo_id });
                });
            }
        })
    },
}

module.exports = dda_s