let DB_SERVICE = global.DB_SERVICE;
let CONFIG_PARAMS = global.COMMON_CONFS;
const securityService = require('./securityservice.js');
const userValidations = require('../validators/uservalidator.js');
const COMMON_QUERIES = require('../queries/commonQueries.js');
let async = require('async');

let common_s = {
    isLastDateExceeded: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.type)) {
            return callback({ ...securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING, 'message': 'filed type is missing.' });
        }
        let user_id = +sessionDetails["user_id"];
        let type = +params["type"];
        let data = {}, is_last_date_exceeded = true
        let qAndPObj = COMMON_QUERIES.isLastDateExceededQueryParamObj(user_id);
        DB_SERVICE.executeQueryWithParameters(CONFIG_PARAMS.getUfpDBDetails(), qAndPObj.query, qAndPObj.params, function (err41, res41) {
            if (err41) {
                return callback(err41);
            }
            else {
                if (res41.data && res41.data.length > 0) {
                    data = res41.data[0]
                    switch (type) {
                        case 2:
                            if (new Date(data['registrtation_last_date']).getTime() < new Date(data['today']).getTime) {
                                is_last_date_exceeded = true
                            } else {
                                is_last_date_exceeded = false
                            }
                            break;
                        case 3:
                            if (new Date(data['carry_last_date']).getTime() < new Date(data['today']).getTime) {
                                is_last_date_exceeded = true
                            } else {
                                is_last_date_exceeded = false
                            }
                            // code block
                            break;
                        case 4:
                            if (new Date(data['edit_last_date']).getTime() < new Date(data['today']).getTime) {
                                is_last_date_exceeded = true
                            } else {
                                is_last_date_exceeded = false
                            }
                            break;
                        case 5:
                            if (new Date(data['ganna_last_date']).getTime() < new Date(data['today']).getTime) {
                                is_last_date_exceeded = true
                            } else {
                                is_last_date_exceeded = false
                            }
                            break;
                        default:
                            if (new Date(data['registrtation_last_date']).getTime() < new Date(data['today']).getTime) {
                                is_last_date_exceeded = true
                            } else {
                                is_last_date_exceeded = false
                            }
                    }
                    return callback(null, { is_last_date_exceeded });
                } else {
                    return callback({ message: 'user id not found while checking last date' });
                }

            }
        })
    },

    insrtAndUpdtOperation: function (dbkey, request, params, sessionDetails, callback) {
        const { value, error } = userValidations.updateOprationObjectValidation(params);
        if (error) {
            return callback(`in update opration object :- ${error.details[0].message}`);
        }
        let { log_table_name, update_table_name, whereObj, update_type, updateObj, action } = params
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
                    if(!whereObj[key]){ 
                    return callback({message:`in insrtAndUpdtOperation where obj key ${key} is undefined for update ${update_table_name}.`});   
                    }
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
                    row['action'] = action ?? 'U';
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
    },
    //insert in app log then delete from table
    insrtAndDltOperation: function (dbkey, request, params, sessionDetails, callback) {

        const { value, error } = userValidations.deleteOprationObjectValidation(params);
        if (error) {
            return callback(`in delete opration object :- ${error.details[0].message}`);
        }
        if (params.delete_table_name == 'farmer_society') {
            return callback(`in delete opration object :- trying to delete record from farmer society.`);
        }
        let { log_table_name, delete_table_name, whereObj } = value
        let found_rows = [], qAndParam = {};
        async.series([
            //get data
            function (cback1) {
                let query = `select * from ${delete_table_name}`, param = [];
                query = query + " where ";
                let count = 1;
                for (let key in whereObj) {
                    if (count != 1) {
                        query = query + " and ";
                    }
                    query = query + key + "=? ";
                    if(!whereObj[key]){ 
                        return callback({message:`in insrtAndDltOperation where obj key ${key} is undefined for delete ${delete_table_name}.`});   
                        }
                    param.push(whereObj[key]);
                    count++;
                }
                DB_SERVICE.executeQueryWithParameters(dbkey, query, param, function (e1, r1) {
                    if (e1) {
                        return cback1(e1);
                    }
                    else {
                        found_rows = r1.data;
                        return cback1(null);
                    }
                })
            },
            //insert into log table
            function (cback2) {
                async.eachSeries(found_rows, function (row, cb1) {
                    async.series([
                        function (cback1) {
                            if (delete_table_name == 'land_details') {
                                qAndParam = DB_SERVICE.getDeleteQueryAndparams({ id_masterkey_khasra: row.id_masterkey_khasra }, 'land_details_extra');
                                DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
                                    if (e1) {
                                        return cback1(e1);
                                    }
                                    else if (r1.data["affectedRows"] == 1) {
                                        return cback1();
                                    }
                                    else {
                                        return cback1({ "message": `in land_details_extra delete no row found for id_masterkey_khasra ${id_masterkey_khasra}` });
                                    }
                                })
                            } else {
                                return cback1();
                            }

                        },
                        function (cback2) {
                            row["action_ip_address"] = sessionDetails["ip_address"];
                            row['action_user_id'] = sessionDetails["user_id"];
                            row['action'] = 'D';
                            qAndParam = DB_SERVICE.getInsertClauseWithParams(row, log_table_name);
                            DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (err, res) {
                                if (err) {
                                    return cback2(err);
                                }
                                else if (res.data["affectedRows"] == 1) {
                                    return cback2()
                                }
                                else {
                                    return cback2({ "message": `Insert into ${log_table_name} is failed.` })
                                }
                            })
                        }
                    ], function (err, res) {
                        return cb1(err);
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
            //delete from table   
            function (cback3) {
                qAndParam = DB_SERVICE.getDeleteQueryAndparams(whereObj, delete_table_name);
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
                    if (e1) {
                        return cback3(e1);
                    }
                    else if (found_rows.length == r1.data["affectedRows"]) {
                        return cback3();
                    }
                    else {
                        return cback3({ "message": `in delete, ${delete_table_name} found data length ${found_rows.length} and Deleted data length ${r1.data["affectedRows"]} is not Matched` });
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
    },

    getActiveFarmerDetails: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.fs_id && params.uf_id)) return callback({ ...securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING, message: 'fs_id and uf_id is required for active farmer check.' });
        dbkey = CONFIG_PARAMS.getWorkingDBDetails();
        let q = `select * from farmer_society fs where fs.uf_id = ${params.uf_id};`
        DB_SERVICE.executeQueryWithParameters(dbkey, q, [], function (err, res) {
            if (err) {
                return callback(err);
            }
            else if (res.data && res.data.length > 0) {
                let active_fs_data = res.data.filter((e) => {
                    return (e.opration_id !== 3 && e.opration_id !== 5)
                })
                let basic_data = active_fs_data.filter(e => {
                    return e.fs_id == params.fs_id
                })

                if (basic_data.length == 0) {
                    return callback({ message: `farmer fs_id-${params.fs_id} is not active in farmer_society` })
                }
                else if (basic_data.length > 1) {
                    return callback({ message: `Invalid fs_id ${params.fs_id} for farmer_society WHILE CHECKING ACTIVE FARMER IN ADMINISTRATIVE SERVER.` })
                }
                basic_data = basic_data[0]
                return callback(null, { basic_data, isActiveFarmer: true });
            }
            else {
                return callback({ "message": `Data Not Found on Farmer_society for fs_id- ${params.fs_id} when Checking for Active Farmer.` })
            }
        })
    }
}
module.exports = common_s;