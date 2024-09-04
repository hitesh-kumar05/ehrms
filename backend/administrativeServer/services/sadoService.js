var DB_SERVICE = global.DB_SERVICE;
var securityService = require('./securityservice.js');
var SADO_QUERIES = require('../queries/sadoQueries.js');
var async = require('async');
let req = require('request');
let config = require('config');
var CONFIG_PARAMS = global.COMMON_CONFS;
let uservalidator = require('../validators/uservalidator.js')
const { isLastDateExceeded, getActiveFarmerDetails, insrtAndUpdtOperation } = require('./commonService.js');
const { checkAadharExists } = require('../../deptServer/services/newRegistrationService.js')
const farmerBankUpdateFoodApi = config.get('farmerBankUpdateFoodApi');
const { foodApiBasicDetailsUpdate, foodApiBankDetailsUpdate } = require('./foodService.js');
let ufp_database = config.get('ufp_db').database ?? 'ufp_2024';


var sado = {
    updateBankDetailsByFsidForSADO_old: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.fs_id && params.uf_id && params.ifsc_code && params.account_no && params.branch_code && params.bank_code && params.bank_district
            && params.caccount_no && params.Remark)) return callback({ ...securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING, message: 'fs_id is required.' });
        let { fs_id, uf_id, ifsc_code, account_no, branch_code, bank_code, bank_district, caccount_no, farmer_code, Remark } = params;
        let tranObj, tranCallback, qAndP = {}, basic_data, updateObj, data = [], forFoodDataList = [], active_fs_data = [];


        const farmer_society_update = `UPDATE farmer_society fs
        INNER JOIN raeo_sanshodhan_verification rsv ON fs.fs_id = rsv.fs_id
        SET fs.branch_code = ?, fs.ifsc_code = ?, fs.account_no = ?, fs.pfms_flag = NULL, fs.operation_id = 2,
        fs.updated_user_id = ?, fs.updated_ip_address = ?
        WHERE fs.fs_id = ? AND rsv.edit_type_account_status = 1;`;

        const raeo_sanshodhan_update = `UPDATE raeo_sanshodhan_verification rsv
        SET rsv.edit_type_account_status = 2, 
	    rsv.edit_type_account_count = rsv.edit_type_account_count + 1, rsv.sado_user_id = ?, rsv.sado_update_dtstamp = NOW(),
        rsv.sado_update_ip_address = ?
        WHERE rsv.fs_id = ? AND rsv.edit_type_account_status = 1`;

        async.series([
            function (cback1) {
                isLastDateExceeded(CONFIG_PARAMS.getWorkingDBDetails(), request, { type: 4 }, sessionDetails, function (err, res) {
                    if (err) {
                        return cback1(err)
                    } else {
                        if (res && !res['is_last_date_exceeded']) {
                            return cback1()
                        } else {
                            return cback1(securityService.SECURITY_ERRORS.LAST_DATE_EXCEEDED)
                        }
                    }
                })
            },
            function (cback2) {
                params.user_id = sessionDetails['user_id']
                params.ip_address = sessionDetails['ip_address']
                const { error, value } = uservalidator.bankDetailsUpdateObjectValidation(params);
                if (error && error.details) {
                    return cback2(error.details[0].message);
                } else {
                    return cback2();
                }
            },
            // check farmer is active or not
            function (cback3) {
                getActiveFarmerDetails(dbkey, request, { fs_id: params.fs_id, uf_id: params.uf_id }, sessionDetails, function (err, res) {
                    if (err) { return cback3(err) }
                    else if (res['basic_data']) {
                        basic_data = res['basic_data']
                        return cback3()
                    } else {
                        return cback3({ message: `basic data not found in active farmer detail for fs_id : ${params.fs_id}` });
                    }
                })
            },
            function (cback4) {
                DB_SERVICE.createTransaction(dbkey, function (err, tranobj, trancallback) {
                    tranObj = tranobj;
                    tranCallback = trancallback;
                    dbkey = { dbkey: dbkey, connectionobj: tranObj };
                    return cback4(err);
                })
            },
            // inert into log
            function (cback5) {
                let obj = { ...basic_data };
                obj["action_ip_address"] = params["ip_address"];
                obj['action_user_id'] = params["user_id"];
                obj['action'] = 'U';
                obj['sanshodhan_type'] = 2;
                qAndP = DB_SERVICE.getInsertClauseWithParams(obj, 'app_log_farmer_society');
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err, res) {
                    if (err) {
                        return cback5(err);
                    }
                    else if (res.data["affectedRows"] == 1) {
                        return cback5()
                    }
                    else {
                        return cback5({ "message": `Insert into Procurement_2024 app_log_farmer_society is failed.` });
                    }
                })
            },
            //update farmer society and raeo_sanshodhan_verification
            function (cback6) {
                async.parallel([
                    function (cback61) {
                        DB_SERVICE.executeQueryWithParameters(dbkey, farmer_society_update,
                            [branch_code, ifsc_code, account_no, params["user_id"], params["ip_address"], fs_id], (err, res) => {
                                if (err) {
                                    return cback61(err);
                                }
                                else if (res.data && res.data["affectedRows"] == 1) {
                                    return cback61()
                                }
                                else {
                                    return cback61({ "message": `Proc24 farmer_society UPDATE ERROR`, "code": "Proc24_UPDATE_ERROR " });
                                }
                            });
                    },
                    function (cback62) {
                        DB_SERVICE.executeQueryWithParameters(dbkey, raeo_sanshodhan_update, [params["user_id"], params["ip_address"], fs_id], (err, res) => {
                            if (err) {
                                return cback62(err);
                            }
                            else if (res.data && res.data["affectedRows"] == 1) {
                                return cback62()
                            }
                            else {
                                return cback62({ "message": `Proc24 raeo_sanshodhan_verification UPDATE ERROR`, "code": "Proc24_UPDATE_ERROR " });
                            }
                        });
                    }
                ], function (err, res) {
                    if (err) {
                        return cback6(err);
                    }
                    else {
                        return cback6(null);
                    }
                })
            },
            //call food api
            function (cback7) {
                if (farmer_code && farmer_code.length == 15) {
                    let obj = {
                        "FarmerCode": farmer_code, "AccountNo": account_no, "BankName": bank_code, "BranchName": branch_code, "IFSCCode": ifsc_code,
                        "Remark": Remark
                    }
                    forFoodDataList.push(obj);
                    console.log(farmerBankUpdateFoodApi, "farmerBankUpdateFoodApi", forFoodDataList);
                    let options = { url: farmerBankUpdateFoodApi, json: true, body: forFoodDataList };
                    req.post(options, function (error, response, body) {
                        try {
                            if (error) {
                                return cback7(error)
                            }
                            else {
                                body = JSON.parse(body)
                                console.log('response---------->', body, typeof (body));
                                if (body && body['Status'] == 1 && body["FarmerCode"] == farmer_code) {
                                    return cback7(null)
                                }
                                else if (body && body['Status'] == 1 && body["FarmerCode"] != farmer_code) {
                                    return cback7({ "message": `Farmer Code ${body["FarmerCode"]}, Found From Food Api Does Not Match with Our Farmer Code ` })
                                }
                                else if (body && body['Status'] == 5) {
                                    return cback7({ "message": `food api error - ${body['Msg']}`, "farmer_code": body['FarmerCode'], "code": 5 })
                                }
                                else {
                                    return cback7({ "message": `food api error - ${body['Msg']}` })
                                }
                            }
                        } catch (e) {
                            return cback7(e);
                        }
                    })
                }
                else {
                    return cback7()
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
                    return callback(null, { "success": true, "code": `FARMER_ACCOUNT_UPDATED` });
                });
            }
        })
    },
    updateBankDetailsByFsidForSADO: function (dbkey, request, params, sessionDetails, callback) {
        let tranObj, tranCallback, basic_data = { society_data: {}, rsv_data: {} }, updateObj = {};

        async.series([
            // check data validation
            function (cback1) {
                async.parallel([
                    function (cback11) {
                        isLastDateExceeded(CONFIG_PARAMS.getWorkingDBDetails(), request, { type: 4 }, sessionDetails, function (err, res) {
                            if (err) {
                                return cback11(err)
                            } else {
                                if (res && !res['is_last_date_exceeded']) {
                                    return cback11()
                                } else {
                                    return cback11(securityService.SECURITY_ERRORS.LAST_DATE_EXCEEDED)
                                }
                            }
                        })
                    },
                    function (cback12) {
                        params.user_id = sessionDetails['user_id']
                        params.ip_address = sessionDetails['ip_address']
                        const { error, value } = uservalidator.bankDetailsUpdateObjectValidation(params);
                        if (error && error.details) {
                            return cback12(error.details[0].message);
                        } else {
                            return cback12();
                        }
                    }
                ], function (err, res) {
                    return cback1(err, res)
                })
            },
            // check farmer eligibility
            function (cback2) {
                async.parallel([
                    // check farmer is active or not
                    function (cback21) {
                        getActiveFarmerDetails(dbkey, request, { fs_id: params.fs_id, uf_id: params.uf_id }, sessionDetails, function (err, res) {
                            if (err) { return cback21(err) }
                            else if (res['basic_data']) {
                                basic_data['society_data'] = res['basic_data']
                                return cback21()
                            } else {
                                return cback21({ message: `basic data not found in active farmer detail for fs_id : ${params.fs_id}` });
                            }
                        })
                    },
                    // check farmer is eligible or not
                    function (cback22) {
                        sado.isFarmerEligableForSADOSansodhan(dbkey, request, { fs_id: params.fs_id, uf_id: params.uf_id, edit_type: 'edit_type_account_status' }, sessionDetails, function (err, res) {
                            if (err) { return cback22(err) }
                            else if (res['rsv_data']) {
                                basic_data['rsv_data'] = res['rsv_data']
                                return cback2()
                            } else {
                                return cback2({ message: `rsv_data not found in isFarmerEligableForSADOSansodhan for fs_id : ${params.fs_id}` });
                            }
                        })
                    }
                ], function (err, res) {
                    return cback2(err)
                })

            },
            //create transaction
            function (cback3) {
                DB_SERVICE.createTransaction(dbkey, function (err, tranobj, trancallback) {
                    tranObj = tranobj;
                    tranCallback = trancallback;
                    dbkey = { dbkey: dbkey, connectionobj: tranObj };
                    return cback3(err);
                })
            },
            // update tables
            function (cback4) {
                async.parallel([
                    // farmer_society update
                    function (cback42) {
                        updateObj = { "branch_code": params['branch_code'], "ifsc_code": params['ifsc_code'], "account_no": params['account_no'], "pfms_flag": null, updated_user_id: sessionDetails['user_id'], updated_ip_address: sessionDetails['ip_address'] }
                        insrtAndUpdtOperation(dbkey, request, { log_table_name: 'app_log_farmer_society', update_table_name: 'farmer_society', whereObj: { fs_id: params['fs_id'] }, updateObj: updateObj, update_type: 2 }, sessionDetails, function (err, res) {
                            if (err) {
                                return cback42(err);
                            }
                            else {
                                return cback42(null);
                            }
                        })
                    },
                    // rsv update
                    function (cback43) {
                        updateObj = { edit_type_account_count: basic_data['rsv_data']['edit_type_account_count'] + 1, operation_id: 2, edit_type_account_status: 2, 'sado_user_id': sessionDetails['user_id'], 'sado_update_ip_address': sessionDetails['ip_address'], sado_update_dtstamp: new Date() }
                        insrtAndUpdtOperation(dbkey, request, { log_table_name: 'app_log_raeo_sanshodhan_verification', update_table_name: 'raeo_sanshodhan_verification', whereObj: { fs_id: params['fs_id'] }, updateObj: updateObj, update_type: 2, action: 'UAC' }, sessionDetails, function (err, res) {
                            if (err) {
                                return cback43(err);
                            }
                            else {
                                return cback43(null);
                            }
                        })
                    }
                ], function (err, res) {
                    return cback4(err)
                })
            },
            // food api call
            function (cback5) {
                if (basic_data['society_data']['farmer_code']) {
                    foodApiBankDetailsUpdate(dbkey, basic_data, params, sessionDetails, function (err, body) {
                        if (err) {
                            return cback5(err);
                        }
                        else {
                            basic_data['farmer_code'] = body['FarmerCode'];//update after checking the response
                            return cback5()
                        }
                    })
                } else {
                    return cback5();
                }
            },
        ], function (err, res) {
            if (err) {
                DB_SERVICE.rollbackPartialTransaction(tranObj, tranCallback, function (err5) {
                    return callback(err);
                })
            }
            else {
                console.log('test complete');
                // DB_SERVICE.rollbackPartialTransaction(tranObj, tranCallback, function (err5) {
                //     return callback(err);
                // })
                DB_SERVICE.commitPartialTransaction(tranObj, tranCallback, function (err5) {
                    return callback(null, { "success": true, "code": `FARMER_ACCOUNT_UPDATED` });
                });
            }
        })
    },
    updateBasicDetailsByFsidForSADO: function (dbkey, request, params, sessionDetails, callback) {
        let tranObj, tranCallback, basic_data = { society_data: {}, rsv_data: {} }, updateObj, RGKNYdata = {};

        async.series([
            // check data validation
            function (cback1) {
                async.parallel([
                    function (cback11) {
                        isLastDateExceeded(CONFIG_PARAMS.getWorkingDBDetails(), request, { type: 4 }, sessionDetails, function (err, res) {
                            if (err) {
                                return cback11(err)
                            } else {
                                if (res && !res['is_last_date_exceeded']) {
                                    return cback11()
                                } else {
                                    return cback11(securityService.SECURITY_ERRORS.LAST_DATE_EXCEEDED)
                                }
                            }
                        })
                    },
                    function (cback12) {
                        params.user_id = sessionDetails['user_id']
                        params.ip_address = sessionDetails['ip_address']
                        const { error, value } = uservalidator.basicDetailsUpdateObjectVaridation(params);
                        if (error && error.details) {
                            return cback12(error.details[0].message);
                        } else {
                            RGKNYdata = params['RGKNYdata']
                            return cback12();
                        }
                    }
                ], function (err, res) {
                    return cback1(err, res)
                })
            },
            // check farmer eligibility
            function (cback2) {
                async.parallel([
                    // check farmer is active or not
                    function (cback21) {
                        getActiveFarmerDetails(dbkey, request, { fs_id: RGKNYdata.fs_id, uf_id: RGKNYdata.uf_id }, sessionDetails, function (err, res) {
                            if (err) { return cback21(err) }
                            else if (res['basic_data']) {
                                basic_data['society_data'] = res['basic_data']
                                return cback21()
                            } else {
                                return cback21({ message: `basic data not found in active farmer detail for fs_id : ${RGKNYdata.fs_id}` });
                            }
                        })
                    },
                    // check farmer is eligible or not
                    function (cback22) {
                        sado.isFarmerEligableForSADOSansodhan(dbkey, request, { fs_id: RGKNYdata.fs_id, uf_id: RGKNYdata.uf_id, edit_type: 'edit_type_basicDetails_status' }, sessionDetails, function (err, res) {
                            if (err) { return cback22(err) }
                            else if (res['rsv_data']) {
                                basic_data['rsv_data'] = res['rsv_data']
                                return cback2()
                            } else {
                                return cback2({ message: `rsv_data not found in isFarmerEligableForSADOSansodhan for fs_id : ${RGKNYdata.fs_id}` });
                            }
                        })
                    }
                ], function (err, res) {
                    return cback2(err)
                })

            },
            //create transaction
            function (cback3) {
                DB_SERVICE.createTransaction(dbkey, function (err, tranobj, trancallback) {
                    tranObj = tranobj;
                    tranCallback = trancallback;
                    dbkey = { dbkey: dbkey, connectionobj: tranObj };
                    return cback3(err);
                })
            },
            // update tables
            function (cback4) {
                async.parallel([
                    // mas_farmer update
                    function (cback41) {
                        updateObj = {
                            farmer_name_hi: RGKNYdata['farmer_name_hi'], relation: RGKNYdata['relation'], father_name: RGKNYdata['father_name'], dob: RGKNYdata['dob'], subcaste_code: RGKNYdata['subcaste_code'], gender: RGKNYdata['gender'],
                            mobile_no: RGKNYdata['mobile_no'], village_code: RGKNYdata['village_code'], address: RGKNYdata['address'], pincode: RGKNYdata['pincode'], updated_ip_address: sessionDetails['ip_address'], updated_user_id: sessionDetails['user_id']
                        }
                        insrtAndUpdtOperation(dbkey, request, { log_table_name: 'app_log_mas_farmer', update_table_name: 'mas_farmer', whereObj: { uf_id: RGKNYdata['uf_id'] }, updateObj: updateObj, update_type: 9 }, sessionDetails, function (err, res) {
                            if (err) {
                                return cback41(err);
                            }
                            else {
                                return cback41(null);
                            }
                        })
                    },
                    // mas_farmer update in ufp database
                    function (cback411) {
                        updateObj = {
                            farmer_name_hi: RGKNYdata['farmer_name_hi'], relation: RGKNYdata['relation'], father_name: RGKNYdata['father_name'], dob: RGKNYdata['dob'], subcaste_code: RGKNYdata['subcaste_code'], gender: RGKNYdata['gender'],
                            mobile_no: RGKNYdata['mobile_no'], village_code: RGKNYdata['village_code'], address: RGKNYdata['address'], pincode: RGKNYdata['pincode'], updated_ip_address: sessionDetails['ip_address'], updated_user_id: sessionDetails['user_id']
                        }
                        insrtAndUpdtOperation(dbkey, request, { log_table_name: ufp_database + '.app_log_mas_farmer', update_table_name: ufp_database + '.mas_farmer', whereObj: { uf_id: RGKNYdata['uf_id'] }, updateObj: updateObj, update_type: 10 }, sessionDetails, function (err, res) {
                            if (err) {
                                return cback411(err);
                            }
                            else {
                                return cback411(null);
                            }
                        })
                    },
                    // farmer_society update
                    function (cback42) {
                        updateObj = { village_code: RGKNYdata['society_village_code'], village_id: RGKNYdata['society_village_id'], updated_user_id: sessionDetails['user_id'], updated_ip_address: sessionDetails['ip_address'] }
                        insrtAndUpdtOperation(dbkey, request, { log_table_name: 'app_log_farmer_society', update_table_name: 'farmer_society', whereObj: { fs_id: RGKNYdata['fs_id'] }, updateObj: updateObj, update_type: 9 }, sessionDetails, function (err, res) {
                            if (err) {
                                return cback42(err);
                            }
                            else {
                                return cback42(null);
                            }
                        })
                    },
                    // rsv update
                    function (cback43) {
                        updateObj = { edit_type_basicDetails_count: basic_data['rsv_data']['edit_type_basicDetails_count'] + 1, edit_type_basicDetails_status: 2, operation_id: 9, 'sado_user_id': sessionDetails['user_id'], 'sado_update_ip_address': sessionDetails['ip_address'], sado_update_dtstamp: new Date() }
                        insrtAndUpdtOperation(dbkey, request, { log_table_name: 'app_log_raeo_sanshodhan_verification', update_table_name: 'raeo_sanshodhan_verification', whereObj: { fs_id: RGKNYdata['fs_id'] }, updateObj: updateObj, update_type: 9, action: 'UBD' }, sessionDetails, function (err, res) {
                            console.log(err, res);
                            if (err) {
                                return cback43(err);
                            }
                            else {
                                return cback43(null);
                            }
                        })
                    }
                ], function (err, res) {
                    return cback4(err)
                })
            },
            // food api call
            function (cback5) {
                if (basic_data['society_data']['farmer_code']) {
                    foodApiBasicDetailsUpdate(dbkey, basic_data, params['forFoodData'], sessionDetails, function (err, body) {
                        if (err) {
                            return cback5(err);
                        }
                        else {
                            basic_data['farmer_code'] = body['FarmerCode'];//update after checking the response
                            return cback5()
                        }
                    })
                } else {
                    return cback5();
                }
            },
        ], function (err, res) {
            if (err) {
                DB_SERVICE.rollbackPartialTransaction(tranObj, tranCallback, function (err5) {
                    return callback(err);
                })
            }
            else {
                console.log('test complete');
                // DB_SERVICE.rollbackPartialTransaction(tranObj, tranCallback, function (err5) {
                //     return callback(err);
                // })
                DB_SERVICE.commitPartialTransaction(tranObj, tranCallback, function (err5) {
                    return callback(null, { "success": true, "code": `FARMER_ACCOUNT_UPDATED` });
                });
            }
        })
    },
    updateAadharDetailsByFsidForSADO: function (dbkey, request, params, sessionDetails, callback) {
        let tranObj, tranCallback, basic_data = { society_data: {}, rsv_data: {} }, updateObj = {}, forFoodObj = {};

        async.series([
            // check data validation
            function (cback1) {
                async.parallel([
                    function (cback11) {
                        isLastDateExceeded(CONFIG_PARAMS.getWorkingDBDetails(), request, { type: 4 }, sessionDetails, function (err, res) {
                            if (err) {
                                return cback11(err)
                            } else {
                                if (res && !res['is_last_date_exceeded']) {
                                    return cback11()
                                } else {
                                    return cback11(securityService.SECURITY_ERRORS.LAST_DATE_EXCEEDED)
                                }
                            }
                        })
                    },
                    function (cback12) {
                        params.user_id = sessionDetails['user_id']
                        params.ip_address = sessionDetails['ip_address']
                        const { error, value } = uservalidator.aadharDetailsUpdateObjectVaridation(params);
                        if (error && error.details) {
                            return cback12(error.details[0].message);
                        } else {
                            return cback12();
                        }
                    }
                ], function (err, res) {
                    return cback1(err, res)
                })
            },
            // check farmer eligibility
            function (cback2) {
                async.parallel([
                    // check farmer is active or not
                    function (cback21) {
                        getActiveFarmerDetails(dbkey, request, { fs_id: params.fs_id, uf_id: params.uf_id }, sessionDetails, function (err, res) {
                            if (err) { return cback21(err) }
                            else if (res['basic_data']) {
                                basic_data['society_data'] = res['basic_data']
                                return cback21()
                            } else {
                                return cback21({ message: `basic data not found in active farmer detail for fs_id : ${params.fs_id}` });
                            }
                        })
                    },
                    // check farmer is eligible or not
                    function (cback22) {
                        sado.isFarmerEligableForSADOSansodhan(dbkey, request, { fs_id: params.fs_id, uf_id: params.uf_id, edit_type: 'edit_type_adhar_status' }, sessionDetails, function (err, res) {
                            if (err) { return cback22(err) }
                            else if (res['rsv_data']) {
                                basic_data['rsv_data'] = res['rsv_data']
                                return cback22()
                            } else {
                                return cback22({ message: `rsv_data not found in isFarmerEligableForSADOSansodhan for fs_id : ${params.fs_id}` });
                            }
                        })
                    },
                    //check aadhar
                    function (cback23) {
                        checkAadharExists(dbkey, request, { "aadharNo": params.aadhar_number, "aadharRef": params.aadhar_ref, "society_id": '0' }, sessionDetails, function (err, res) {
                            if (err) {
                                return cback23(err);
                            } else if (res && res.code && res.code == 'AADHAR_NOT_EXIST') {
                                return cback23();
                            } else {
                                return cback23(res);
                            }
                        })
                    },
                ], function (err, res) {
                    return cback2(err)
                })

            },
            //create transaction
            function (cback3) {
                DB_SERVICE.createTransaction(dbkey, function (err, tranobj, trancallback) {
                    tranObj = tranobj;
                    tranCallback = trancallback;
                    dbkey = { dbkey: dbkey, connectionobj: tranObj };
                    return cback3(err);
                })
            },
            // update tables
            function (cback4) {
                async.parallel([
                    // mas_farmer update
                    function (cback41) {
                        updateObj = { "aadhar_number": params.aadhar_number, "farmer_name_aadhar": params.farmer_name_aadhar, "aadhar_ref": params.aadhar_ref, "aadhar_verification": null, updated_user_id: sessionDetails['user_id'], updated_ip_address: sessionDetails['ip_address'] }
                        insrtAndUpdtOperation(dbkey, request, { log_table_name: 'app_log_mas_farmer', update_table_name: 'mas_farmer', whereObj: { uf_id: params['uf_id'] }, updateObj: updateObj, update_type: 10 }, sessionDetails, function (err, res) {
                            if (err) {
                                return cback41(err);
                            }
                            else {
                                return cback41(null);
                            }
                        })
                    },
                    // mas_farmer update in ufp database
                    function (cback411) {
                        updateObj = { "aadhar_number": params.aadhar_number, "farmer_name_aadhar": params.farmer_name_aadhar, "aadhar_ref": params.aadhar_ref, "aadhar_verification": null, updated_user_id: sessionDetails['user_id'], updated_ip_address: sessionDetails['ip_address'] }
                        insrtAndUpdtOperation(dbkey, request, { log_table_name: ufp_database + '.app_log_mas_farmer', update_table_name: ufp_database + '.mas_farmer', whereObj: { uf_id: params['uf_id'] }, updateObj: updateObj, update_type: 10 }, sessionDetails, function (err, res) {
                            if (err) {
                                return cback411(err);
                            }
                            else {
                                return cback411(null);
                            }
                        })
                    },
                    // farmer_society update
                    function (cback42) {
                        updateObj = { updated_user_id: sessionDetails['user_id'], updated_ip_address: sessionDetails['ip_address'] }
                        insrtAndUpdtOperation(dbkey, request, { log_table_name: 'app_log_farmer_society', update_table_name: 'farmer_society', whereObj: { fs_id: params['fs_id'] }, updateObj: updateObj, update_type: 10 }, sessionDetails, function (err, res) {
                            if (err) {
                                return cback42(err);
                            }
                            else {
                                return cback42(null);
                            }
                        })
                    },
                    // rsv update
                    function (cback43) {
                        updateObj = { edit_type_adhar_count: basic_data['rsv_data']['edit_type_adhar_count'] + 1, edit_type_adhar_status: 2, operation_id: 10, 'sado_user_id': sessionDetails['user_id'], 'sado_update_ip_address': sessionDetails['ip_address'], sado_update_dtstamp: new Date() }
                        insrtAndUpdtOperation(dbkey, request, { log_table_name: 'app_log_raeo_sanshodhan_verification', update_table_name: 'raeo_sanshodhan_verification', whereObj: { fs_id: params['fs_id'] }, updateObj: updateObj, update_type: 10, action: 'UAA' }, sessionDetails, function (err, res) {
                            if (err) {
                                return cback43(err);
                            }
                            else {
                                return cback43(null);
                            }
                        })
                    }
                ], function (err, res) {
                    return cback4(err)
                })
            },
            // food api call
            function (cback5) {
                if (basic_data['society_data']['farmer_code']) {
                    forFoodObj = {
                        "FarmerCode": params.farmer_code, "AadharNo": params.aadhar_number, "AadharName": params.farmer_name_aadhar, "FarmerName": params.FarmerName, "Sex": params.Sex, "Father_HusbandName": params.Father_HusbandName,
                        "Relation": params.Relation, "Caste": params.Caste, "SubCaste": params.SubCaste, "MobileNo": params.MobileNo, "Address": params.Address, "DOB": params.DOB, "NewVLocationCode": params.NewVLocationCode
                    };
                    foodApiBasicDetailsUpdate(dbkey, basic_data['society_data'], forFoodObj, sessionDetails, function (err, body) {
                        if (err) {
                            return cback5(err);
                        }
                        else {
                            basic_data['farmer_code'] = body['FarmerCode'];//update after checking the response
                            return cback5()
                        }
                    })
                } else {
                    return cback5();
                }
            },
        ], function (err, res) {
            if (err) {
                DB_SERVICE.rollbackPartialTransaction(tranObj, tranCallback, function (err5) {
                    return callback(err);
                })
            }
            else {
                console.log('test complete');
                // DB_SERVICE.rollbackPartialTransaction(tranObj, tranCallback, function (err5) {
                //     return callback(err);
                // })
                DB_SERVICE.commitPartialTransaction(tranObj, tranCallback, function (err5) {
                    return callback(null, { "success": true, "code": `FARMER_AADHAR_UPDATED` });
                });
            }
        })
    },
    isFarmerEligableForSADOSansodhan: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.fs_id && params.uf_id && params.edit_type)) return callback({ ...securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING, message: 'fs_id and uf_id and edit_type is required forisFarmerEligableForSADOSansodhan.' });
        dbkey = CONFIG_PARAMS.getWorkingDBDetails();
        let q = `select * from raeo_sanshodhan_verification rsv where rsv.fs_id = ${params.fs_id} and rsv.${params.edit_type} = 1;`
        DB_SERVICE.executeQueryWithParameters(dbkey, q, [], function (err, res) {
            if (err) {
                return callback(err);
            }
            else if (res.data && res.data.length == 1) {
                return callback(null, { rsv_data: res.data[0], isEligableForSADOSansodhan: true });
            }
            else {
                return callback({ "message": `Data Not Found or Multiple data found on raeo_sanshodhan_verification for fs_id- ${params.fs_id} with edit_type ${edit_type} =1 when Checking for isFarmerEligableForSADOSansodhan.` })
            }
        })

    }
}

module.exports = sado;
