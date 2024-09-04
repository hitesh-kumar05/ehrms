var DB_SERVICE = global.DB_SERVICE;
var CONFIG_PARAMS = global.COMMON_CONFS;
var async = require('async');
const userValidations = require('../validators/uservalidator.js');
const { isLastDateExceeded, updateFarmerCode, insrtAndDltOperation, insrtAndUpdtOperation, saveFarmerCropDetails, saveFarmerLandDetails,getLastFourDigits } = require('../services/commonService.js');
const { foodApiAddKisan, foodApiSansodhanKisan,foodApiNominneDetailsUpdate } = require('./foodServices.js')
const securityService = require('./securityservice.js');


let sansodhan_s = {
    updateLandAndCrop: function (dbkey, request, params, sessionDetails, callback) {
        let tranObj, tranCallback, basic_data = {}, inserted_lands = {}, is_paddy_maize_crop_available = false, isFoodNewKisanApiCalled = false;
        async.series([
            //check valid date
            function (cback1) {
                isLastDateExceeded(CONFIG_PARAMS.getWorkingDBDetails(), request, { type: 4 }, sessionDetails, function (err, res) {
                    if (err) {
                        return cback1(err);
                    } else {
                        if (res && !res['is_last_date_exceeded']) {
                            return cback1();
                        } else {
                            return cback1(securityService.SECURITY_ERRORS.LAST_DATE_EXCEEDED);
                        }
                    }
                })
            },
            //validate object and make transaction -- recheck pending
            function (cback2) {
                const { error, value } = userValidations.FarmerObjectValidation(params, 4);
                if (error && error.details) {
                    return cback2({ message: `in updateLandAndCrop object ${error.details[0].message}` });

                } else {
                    //basic_data = {  fs_id, old_fs_id = null, farmer_code = null, society_id } = params['basic_details']['farmer_society']
                    basic_data.fs_id = params['basic_details']['farmer_society']['fs_id']
                    basic_data.old_fs_id = params['basic_details']['farmer_society']['old_fs_id']
                    basic_data.farmer_code = params['basic_details']['farmer_society']['farmer_code']
                    basic_data.society_id = params['basic_details']['farmer_society']['society_id']
                    basic_data.uf_id = params['basic_details']['mas_farmer']['uf_id']
                    basic_data.entry_type = 4
                    basic_data.total_land_area = +(+(params['land_details'].reduce((acc, cur) => acc + +cur['FarmSize'], 0).toFixed(4)) + +(params['forest_land_details'].reduce((acc, cur) => acc + +cur['land_area'], 0).toFixed(4))).toFixed(4);
                    basic_data.total_crop_area = +(+(params['crop_details'].reduce((acc, cur) => acc + +cur['crop_area'], 0).toFixed(4)) + +(params['forest_crop_details'].reduce((acc, cur) => acc + +cur['crop_area'], 0).toFixed(4))).toFixed(4);
                    basic_data.total_paddy_area = +(+(params['crop_details'].reduce((acc, cur) => cur['crop_code'] == 104 ? acc + +cur['crop_area'] : acc, 0).toFixed(4)) + +(params['forest_crop_details'].reduce((acc, cur) => cur['crop_code'] == 104 ? acc + +cur['crop_area'] : acc, 0).toFixed(4))).toFixed(4);
                    DB_SERVICE.createTransaction(dbkey, function (err, tranobj, trancallback) {
                        tranObj = tranobj;
                        tranCallback = trancallback;
                        dbkey = { dbkey: dbkey, connectionobj: tranObj };
                        return cback2(err);
                    })
                }
            },
            //crop delete
            function (cback4) {
                async.parallel([
                    //rg crop delete
                    function (cback41) {
                        insrtAndDltOperation(dbkey, request, { log_table_name: 'app_log_crop_details', delete_table_name: 'crop_details', whereObj: { fs_id: basic_data['fs_id'] } }, sessionDetails, function (err, res) {
                            if (err) {
                                return cback41(err);
                            }
                            else {
                                return cback41(null);
                            }
                        })
                    },
                    // forest crop delete
                    function (cback42) {
                        insrtAndDltOperation(dbkey, request, { log_table_name: 'app_log_crop_details_forest', delete_table_name: 'crop_details_forest', whereObj: { fs_id: basic_data['fs_id'] } }, sessionDetails, function (err, res) {
                            if (err) {
                                return cback42(err);
                            }
                            else {
                                return cback42(null);
                            }
                        })
                    }
                ], function (err, res) {
                    if (err) {
                        return cback4(err);
                    }
                    else {
                        return cback4(null);
                    }
                })
            },
            //land delete
            function (cback5) {
                async.parallel([
                    //rg land delete
                    function (cback51) {
                        insrtAndDltOperation(dbkey, request, { log_table_name: 'app_log_land_details', delete_table_name: 'land_details', whereObj: { fs_id: basic_data['fs_id'] } }, sessionDetails, function (err, res) {
                            if (err) {
                                return cback51(err);
                            }
                            else {
                                return cback51(null);
                            }
                        })
                    },
                    // forest land delete
                    function (cback52) {
                        insrtAndDltOperation(dbkey, request, { log_table_name: 'app_log_land_details_forest', delete_table_name: 'land_details_forest', whereObj: { fs_id: basic_data['fs_id'] } }, sessionDetails, function (err, res) {
                            if (err) {
                                return cback52(err);
                            }
                            else {
                                return cback52(null);
                            }
                        })
                    }
                ], function (err, res) {
                    if (err) {
                        return cback5(err);
                    }
                    else {
                        return cback5(null);

                    }
                })

            },
            //land insert
            function (cback4) {
                saveFarmerLandDetails(dbkey, basic_data, { land_details: params['land_details'], forest_land_details: params['forest_land_details'] }, sessionDetails, function (err, inserted_land_record) {
                    if (err) {
                        return cback4(err);
                    }
                    else {
                        inserted_lands = inserted_land_record
                        cback4(null);
                        return;
                    }
                })
            },
            //crop insert
            function (cback5) {
                saveFarmerCropDetails(dbkey, basic_data, { crop_details: params['crop_details'], forest_crop_details: params['forest_crop_details'] }, inserted_lands, sessionDetails, function (err, res) {
                    if (err) {
                        return cback5(err);
                    }
                    else {
                        is_paddy_maize_crop_available = res['is_paddy_maize_crop_available']
                        return cback5(null);
                    }
                })
            },
            //society update 
            function (cback6) {
                let updateObj = { operation_id: 2, total_paddy_area: basic_data['total_paddy_area'], total_crop_area: basic_data['total_crop_area'], total_land_area: basic_data['total_land_area'], "updated_user_id": sessionDetails['user_id'], "updated_ip_address": sessionDetails['ip_address'] };
                if (sessionDetails['user_type'] == 7) {
                    updateObj['is_update_society'] = 'Y'
                } else if (sessionDetails['user_type'] == 11) {
                    updateObj['is_update_tehsil'] = 'Y'
                } else {
                    return cback6({ message: `in sessiondetails user type is not in (7,11) ${sessionDetails['user_type']}` })
                }
                let whereObj = { fs_id: basic_data['fs_id'] };
                insrtAndUpdtOperation(dbkey, request, { log_table_name: 'app_log_farmer_society', update_table_name: 'farmer_society', updateObj, whereObj, update_type: 1 }, sessionDetails, function (err, res) {
                    if (err) {
                        return cback6(err);
                    }
                    else {
                        return cback6(null, res);
                    }
                })
            },
            //TODO - new panjiyan api RECHECK
            // call food api for sansodhan
            function (cback5) {
                if (is_paddy_maize_crop_available) {
                    if (basic_data['farmer_code']) {
                        foodApiSansodhanKisan(dbkey, basic_data, params, sessionDetails, function (err, body) {
                            if (err) {
                                return cback5(err);
                            }
                            else {
                                basic_data['farmer_code'] = body['FarmerCode'];//update after checking the response
                                return cback5()
                            }
                        })
                    } else {
                        foodApiAddKisan(dbkey, basic_data, params, sessionDetails, function (err, body) {
                            if (err) {
                                return cback5(err);
                            }
                            else {
                                basic_data['farmer_code'] = body['FarmerCode'];//update after checking the response
                                isFoodNewKisanApiCalled = true
                                return cback5()
                            }
                        })
                    }
                } else {
                    cback5();
                }
            },
            // if food new kisan api called then update the farmer code in all table
            function (cback5) {
                if (isFoodNewKisanApiCalled) {
                    updateFarmerCode(dbkey, { ...basic_data, inserted_lands }, sessionDetails, function (err, res) {
                        if (err) {
                            return cback5(err);
                        }
                        else {
                            return cback5(null, res);
                        }
                    })
                } else {
                    return cback5();
                }
            }

        ], function (err, res) {
            if (err) {
                DB_SERVICE.rollbackPartialTransaction(tranObj, tranCallback, function (err4) {
                    return callback(err);
                })
            }
            else {
                console.log('test completed')
                // DB_SERVICE.rollbackPartialTransaction(tranObj, tranCallback, function (err4) {
                //     return callback(err, basic_data)
                // })
                DB_SERVICE.commitPartialTransaction(tranObj, tranCallback, function (err5) {
                    callback(null, basic_data);
                });
            }
        })
    },
    updateNomineeDetails: function (dbkey, request, params, sessionDetails, callback) {
        let tranObj, tranCallback, fs_id, farmer_code, whereObj = {}, updateObj = {},basic_data ={}
        async.series([
            function (cback0001) {
                isLastDateExceeded(CONFIG_PARAMS.getWorkingDBDetails(), request, { type: 4 }, sessionDetails, function (err, res) {
                    if (err) {
                        return cback0001(err)
                    } else {
                        console.log(res)
                        if (res && !res['is_last_date_exceeded']) {
                            return cback0001()
                        } else {
                            return cback0001({ message: 'last date exceeded' })
                        }
                    }
                })
            },
            function (cback1) {
                params['UserID'] = sessionDetails['user_id']
                params['IPAddress'] = sessionDetails['ip_address']
                params['Opration'] = 'UPDATE'
                params['FourDigit'] = getLastFourDigits(params['AadharNo'])
                params['aadhar_ref'] = params['nominee_aadhar_ref'];
                const { error, value } = userValidations.farmerReprenstativeValidation(params);
                if (error && error.details) {
                    cback1(error.details);
                    return;
                } else {
                    fs_id = params['fs_id'];
                    farmer_code = params['FarmerCode']
                    DB_SERVICE.createTransaction(dbkey, function (err, tranobj, trancallback) {
                        tranObj = tranobj;
                        tranCallback = trancallback;
                        dbkey = { dbkey: dbkey, connectionobj: tranObj };
                        return cback1(err);
                    })
                }
            },
            //insert and update nominee table
            function (cback4) {
                let { Name, Relation, AadharNo, TypeofPerson, Opration, UserID, IPAddress,aadhar_ref } = params
                updateObj = { Name, Relation, AadharNo, TypeofPerson, Opration, is_nominee_update: 'Y', UserID, IPAddress,aadhar_ref }
                whereObj = { 'fs_id': fs_id }
                insrtAndUpdtOperation(dbkey, request, { log_table_name: 'app_log_farmerrepresentative', update_table_name: 'farmerrepresentative', updateObj, whereObj, update_type: 1 }, sessionDetails, function (err, res) {
                    if (err) {
                        return cback4(err);
                    }
                    else {
                        basic_data = res[0]
                        return cback4(null, res);
                    }
                })
            },
            //insert and update society table
            function (cback4) {
                whereObj = { 'fs_id': fs_id }
                insrtAndUpdtOperation(dbkey, request, { log_table_name: 'app_log_farmer_society', update_table_name: 'farmer_society', updateObj:{"updated_ip_address":sessionDetails['ip_address'],"updated_user_id":sessionDetails['user_id']}, whereObj, update_type: 7 }, sessionDetails, function (err, res) {
                    if (err) {
                        return cback4(err);
                    }
                    else {
                        return cback4(null, res);
                    }
                })
            },
            //call food api
            function (cback5) {
                foodApiNominneDetailsUpdate(dbkey, basic_data, params, sessionDetails, function (err, body) {
                    if (err) {
                        return cback5(err);
                    }
                    else {
                        basic_data['farmer_code'] = body['FarmerCode'];//update after checking the response
                        return cback5()
                    }
                })
            },
        ], function (err, res) {
            if (err) {
                DB_SERVICE.rollbackPartialTransaction(tranObj, tranCallback, function (err4) {
                   return callback(err)
                })
            }
            else {
                console.log('test completed')
                // DB_SERVICE.rollbackPartialTransaction(tranObj, tranCallback, function (err4) {
                //     callback(err, res)
                // })
                DB_SERVICE.commitPartialTransaction(tranObj, tranCallback, function (err5) {
                   return callback(null, res);
                });
            }
        })
    }
}

module.exports = sansodhan_s