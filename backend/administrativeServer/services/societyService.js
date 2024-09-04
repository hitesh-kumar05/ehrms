var DB_SERVICE = global.DB_SERVICE;
var securityService = require('./securityservice.js');
var async = require('async');
let config = require('config');
var CONFIG_PARAMS = global.COMMON_CONFS;
const userValidations = require('../validators/uservalidator.js')
let base_database = config.get('procurement_base_db').database ?? 'rgkny_2023';

var farmer = {
    sendFarmerTehsilForRejection: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.fs_id && params.isFarmerNew && params.uf_id)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let { fs_id, isFarmerNew, uf_id, farmer_code } = params;
        let tranObj, tranCallback, active_fs_data = [];
        async.series([
            function (cback1) {
                DB_SERVICE.createTransaction(dbkey, function (err, tranobj, trancallback) {
                    tranObj = tranobj;
                    tranCallback = trancallback;
                    dbkey = { dbkey: dbkey, connectionobj: tranObj };
                    return cback1(err);
                })
            },
            //check farmer status in current
            function (cback2) {
                if (isFarmerNew == 1) {
                    let q = `select * from farmer_society fs where fs.uf_id = ${params.uf_id}`
                    DB_SERVICE.executeQueryWithParameters(dbkey, q, [], function (err, res) {
                        if (err) {
                            return cback2(err);
                        }
                        else if (res.data && res.data.length > 0) {
                            active_fs_data = res.data.filter((e) => {
                                return (e.operation_id !== 3 && e.operation_id !== 5)
                            })
                            active_fs_data = active_fs_data.filter(e => {
                                return e.fs_id == params['fs_id'];
                            })
                            if (active_fs_data.length == 0) {
                                return cback2({ message: `farmer fs_id-${params.fs_id} is not active in PROC24 farmer_society` })
                            }
                            return cback2();
                        }
                        else {
                            return cback2({ message: `farmer fs_id-${params.fs_id} is not Found in PROC24 farmer_society` })
                        }
                    })
                }
                else if (isFarmerNew == 2) {
                    let q = `select * from rgkny_2023.farmer_society fs where fs.fs_id = ${params.fs_id} AND fs.carry_forward_status is NULL AND delete_status is NULL;`
                    DB_SERVICE.executeQueryWithParameters(dbkey, q, [], function (err, res) {
                        if (err) {
                            return cback2(err);
                        }
                        else if (res.data && res.data.length == 1) {
                            return cback2();
                        }
                        else {
                            return cback2({ message: `farmer fs_id-${params.fs_id} is not Valid in RGKNY23 farmer_society` });
                        }
                    })
                }
                else {
                    return cback2({ "message": "Invalid IsNewFarmer Flag" });
                }
            },
            function (cback3) {
                if (isFarmerNew == 1) {
                    insrtAndUpdtOperation(dbkey, request, { log_table_name: 'app_log_farmer_society', update_table_name: 'farmer_society', whereObj: { fs_id: params['fs_id'] }, updateObj: { 'operation_id': 4 }, update_type: 8 }, sessionDetails, function (err, res) {
                        if (err) {
                            return cback3(err);
                        }
                        else {
                            return cback3(null);
                        }
                    })
                }
                else if (isFarmerNew == 2) {
                    updateObj = { "delete_status": 'R' };
                    whereObj = { "fs_id": fs_id };
                    let queryParamObj = DB_SERVICE.getUpdateQueryAndparams(updateObj, whereObj, base_database + '.farmer_society');
                    DB_SERVICE.executeQueryWithParameters(dbkey, queryParamObj.query, queryParamObj.params, function (err41, res41) {
                        if (err41) {
                            return cback3(err41);
                        }
                        else if (res41.data["affectedRows"] == 1) {
                            return cback3(null);
                        }
                        else {
                            return cback3({ message: `Flag update unSuccessFull in Farmer Society for fs_id In RGKNY23 ${fs_id}.`, errno: 4444 });
                        }
                    })
                }
                else {
                    return cback3({ "message": "Invalid IsNewFarmer Flag" });
                }
            },
            // insert into farmer_rejected_docs table
            function (cback5) {
                if (isFarmerNew == 2 || isFarmerNew == 1) {
                    let insertObj = {
                        fs_id, uf_id, farmer_code, "isFarmerCF": isFarmerNew == 1 ? 'Y' : 'N', "send_tehsil_user_id": sessionDetails["user_id"],
                        "send_tehsil_ip_address": sessionDetails["ip_address"]
                    }
                    let queryParamObj = DB_SERVICE.getInsertClauseWithParams(insertObj, 'farmer_rejected_docs');
                    DB_SERVICE.executeQueryWithParameters(dbkey, queryParamObj.query, queryParamObj.params, function (err41, res41) {
                        if (err41) {
                            return cback5(err41);
                        }
                        else if (res41.data && res41.data["affectedRows"] == 1) {
                            return cback5(null);
                        }
                        else {
                            return cback5({ message: `Insert into farmer_rejected_docs table for fs_id ON NEW DB Procurment24 is Failed ${fs_id}.`, errno: 4444 });
                        }
                    })
                }
                else {
                    return cback5({ "message": "Invalid IsNewFarmer Flag" });
                }
            }
        ], function (err, res) {
            if (err) {
                DB_SERVICE.rollbackPartialTransaction(tranObj, tranCallback, function (err4) {
                    return callback(err);
                })
            }
            else {
                DB_SERVICE.commitPartialTransaction(tranObj, tranCallback, function (err5) {
                    return callback(null, { "success": true, code: "FARMER_SUCCESSFULLY_SENT_TO_TEHSIL" });
                });
            }
        })
    },

    getBackFarmerFromRejection: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.fs_id && params.isFarmerNew && params.uf_id)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let { fs_id, isFarmerNew, uf_id, farmer_code } = params;
        let tranObj, tranCallback, active_fs_data = [];

        async.series([
            function (cback1) {
                DB_SERVICE.createTransaction(dbkey, function (err, tranobj, trancallback) {
                    tranObj = tranobj;
                    tranCallback = trancallback;
                    dbkey = { dbkey: dbkey, connectionobj: tranObj };
                    return cback1(err);
                })
            },
            //check farmer status in current
            function (cback2) {
                if (isFarmerNew == 1) {
                    let q = `select * from farmer_society fs where fs.uf_id = ${params.uf_id}`
                    DB_SERVICE.executeQueryWithParameters(dbkey, q, [], function (err, res) {
                        if (err) {
                            return cback2(err);
                        }
                        else if (res.data && res.data.length > 0) {
                            active_fs_data = res.data.filter((e) => {
                                return (e.operation_id == 4);
                            })
                            active_fs_data = active_fs_data.filter(e => {
                                return e.fs_id == params['fs_id'];
                            })
                            if (active_fs_data.length == 0) {
                                return cback2({ message: `farmer fs_id-${params.fs_id} is Not Requested For Deleted in PROC24 farmer_society` })
                            }
                            return cback2();
                        }
                        else {
                            return cback2({ message: `farmer fs_id-${params.fs_id} is not Found in PROC24 farmer_society` })
                        }
                    })
                }
                else if (isFarmerNew == 2) {
                    let q = `select * from rgkny_2023.farmer_society fs where fs.fs_id = ${params.fs_id} AND fs.carry_forward_status is NULL AND delete_status = 'R';`
                    DB_SERVICE.executeQueryWithParameters(dbkey, q, [], function (err, res) {
                        if (err) {
                            return cback2(err);
                        }
                        else if (res.data && res.data.length == 1) {
                            return cback2();
                        }
                        else {
                            return cback2({ message: `farmer fs_id-${params.fs_id} is not Requested for Delete in RGKNY23 farmer_society` });
                        }
                    })
                }
                else {
                    return cback2({ "message": "Invalid IsNewFarmer Flag" });
                }
            },
            function (cback3) {
                if (isFarmerNew == 1) {
                    insrtAndUpdtOperation(dbkey, request, { log_table_name: 'app_log_farmer_society', update_table_name: 'farmer_society', whereObj: { fs_id: params['fs_id'] }, updateObj: { 'operation_id': 2 }, update_type: 14 }, sessionDetails, function (err, res) {
                        if (err) {
                            return cback3(err);
                        }
                        else {
                            return cback3(null);
                        }
                    })
                }
                else if (isFarmerNew == 2) {
                    updateObj = { "delete_status": null };
                    whereObj = { "fs_id": fs_id };
                    let queryParamObj = DB_SERVICE.getUpdateQueryAndparams(updateObj, whereObj, base_database + '.farmer_society');
                    DB_SERVICE.executeQueryWithParameters(dbkey, queryParamObj.query, queryParamObj.params, function (err41, res41) {
                        if (err41) {
                            return cback3(err41);
                        }
                        else if (res41.data["affectedRows"] == 1) {
                            return cback3(null);
                        }
                        else {
                            return cback3({ message: `Flag update unSuccessFull in Farmer Society for fs_id In RGKNY23 ${fs_id}.`, errno: 4444 });
                        }
                    })
                }
                else {
                    return cback3({ "message": "Invalid IsNewFarmer Flag" });
                }
            },
            function (cback4){
                if (isFarmerNew == 2 || isFarmerNew == 1) {
                    let whereObj = {fs_id, uf_id};
                    let queryParamObj = DB_SERVICE.getDeleteQueryAndparams(whereObj, 'farmer_rejected_docs');
                    DB_SERVICE.executeQueryWithParameters(dbkey, queryParamObj.query, queryParamObj.params, function (err41, res41) {
                        if (err41) {
                            return cback4(err41);
                        }
                        else if (res41.data && res41.data["affectedRows"] == 1) {
                            return cback4(null);
                        }
                        else {
                            return cback4({ message: `Delete From farmer_rejected_docs table for fs_id ON NEW DB Procurment24 is Failed ${fs_id}.`, errno: 4444 });
                        }
                    })
                }
                else {
                    return cback4({ "message": "Invalid IsNewFarmer Flag" });
                }
            }
        ], function (err, res) {
            if (err) {
                DB_SERVICE.rollbackPartialTransaction(tranObj, tranCallback, function (err4) {
                    return callback(err);
                })
            }
            else {
                DB_SERVICE.commitPartialTransaction(tranObj, tranCallback, function (err5) {
                    return callback(null, { "success": true, code: "FARMER_SUCCESSFULLY_GET_BACK_FROM_REJECTION" });
                });
            }
        })
    }
}

//insert in app log then update from table
let insrtAndUpdtOperation = function (dbkey, request, params, sessionDetails, callback) {
    const { value, error } = userValidations.updateOprationObjectValidation(params);
    if (error) {
        return callback(`in update opration object :- ${error.details[0].message}`);
    }
    let { log_table_name, update_table_name, whereObj, update_type, updateObj } = value
    let found_rows = [], qAndParam = {};
    async.series([
        //get data
        function (cback1) {
            let query = `select * from ${update_table_name}`, param = [];
            query = query + " where ";
            let count = 1;
            for (let key in whereObj) {
                if (count != 1) {
                    query = query + " and ";
                }
                query = query + key + "=? ";
                param.push(whereObj[key]);
                count++;
            }
            DB_SERVICE.executeQueryWithParameters(dbkey, query, param, function (e1, r1) {
                if (e1) {
                    return cback1(e1);
                }
                else if (r1 && r1.data) {
                    found_rows = r1.data;
                    return cback1(null);
                }
            })
        },
        //insert into log table
        function (cback2) {
            async.eachSeries(found_rows, function (row, cb1) {
                row["action_ip_address"] = sessionDetails["ip_address"];
                row['action_user_id'] = sessionDetails["user_id"];
                row['action'] = 'U';
                if (log_table_name == 'app_log_farmer_society') {
                    row['sanshodhan_type'] = update_type;
                }
                qAndParam = DB_SERVICE.getInsertClauseWithParams(row, log_table_name);
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (err, res) {
                    if (err) {
                        return cb1(err);
                    }
                    else if (res.data["affectedRows"] == 1) {
                        return cb1()
                    }
                    else {
                        return cb1({ "message": `Insert into ${log_table_name} is failed.` })
                    }
                })
            }, function (err, res) {
                if (err) {
                    return cback2(err)
                }
                else {
                    return cback2()
                }
            })
        },
        //update table   
        function (cback3) {
            qAndParam = DB_SERVICE.getUpdateQueryAndparams(updateObj, whereObj, update_table_name);
            DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
                if (e1) {
                    return cback3(e1);
                }
                else if (found_rows.length == r1.data["affectedRows"]) {
                    return cback3();
                }
                else {
                    return cback3({ "message": `in update, ${update_table_name} found data length ${found_rows.length} and updated data length ${r1.data["affectedRows"]} is not Matched` });
                }
            })
        },
    ], function (err, res) {
        if (err) {
            return callback(err);
        }
        else {
            return callback(null, res);
        }
    })
}
module.exports = farmer;
