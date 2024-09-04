var DB_SERVICE = global.DB_SERVICE;
var CONFIG_PARAMS = global.COMMON_CONFS;
var async = require('async');
const userValidations = require('../validators/uservalidator.js');
const { getActiveFarmerDetails, isLastDateExceeded, updateFarmerCode, insrtAndDltOperation, insrtAndUpdtOperation, saveFarmerCropDetails, saveFarmerLandDetails } = require('../services/commonService.js');
const { saveFarmerBasicDetails_newPanjiyan } = require('./newRegistrationService.js')
const { foodApiAddKisan, foodApiSansodhanKisan, foodApiAddVarisanKisan, foodApiVarisanSansodhanKisan } = require('./foodServices.js')
const securityService = require('./securityservice.js');
const config = require('config');
const { isFarmerEligableForSADOSansodhan } = require('../../administrativeServer/services/sadoService.js');
let ufp_database = config.get('ufp_db').database ?? 'ufp_2024';
let base_database = config.get('procurement_base_db').database ?? 'rgkny_2023';


let varisan_s = {
    saveVarisanFarmer: function (dbkey, request, params, sessionDetails, callback) {
        let tranObj, tranCallback, basic_data = {}, isDeathFarmerIsNewFarmer = false;
        async.series([
            //check valid date
            function (cback1) {
                isLastDateExceeded(CONFIG_PARAMS.getWorkingDBDetails(), request, { type: 4 }, sessionDetails, function (err, res) {
                    if (err) {
                        return cback1(err);
                    } else {
                        // console.log(res)
                        if (res && !res['is_last_date_exceeded']) {
                            return cback1();
                        } else {
                            return cback1(securityService.SECURITY_ERRORS.LAST_DATE_EXCEEDED);
                        }
                    }
                })
            },
            //validate object and make transaction
            function (cback2) {
                const { error, value } = userValidations.FarmerObjectValidation(params, 5);
                if (error && error.details) {
                    return cback2(error.details[0].message);

                } else {
                    basic_data.varisanCase = params.varisanCase
                    basic_data.old_uf_id = params.varisanOldUfid
                    basic_data.old_farmer_code = params.varisanOldFarmerCode
                    basic_data.old_society_id = params.varisanOldSocietyId
                    basic_data.death_fs_id = params.varisanOldFsid
                    basic_data.old_aadhar_number = params.varisanOldAadharNo
                    basic_data.aadhar_number = params['basic_details']['mas_farmer']['aadhar_number']
                    basic_data.total_land_area = +(params['land_details'].reduce((acc, cur) => acc + +cur['FarmSize'], 0).toFixed(4)) + +(params['forest_land_details'].reduce((acc, cur) => acc + +cur['land_area'], 0).toFixed(4));
                    basic_data.total_crop_area = +(params['crop_details'].reduce((acc, cur) => acc + +cur['crop_area'], 0).toFixed(4)) + +(params['forest_crop_details'].reduce((acc, cur) => acc + +cur['crop_area'], 0).toFixed(4));
                    basic_data.total_paddy_area = +(params['crop_details'].reduce((acc, cur) => cur['crop_code'] == 104 ? acc + +cur['crop_area'] : acc, 0).toFixed(4)) + +(params['forest_crop_details'].reduce((acc, cur) => cur['crop_code'] == 104 ? acc + +cur['crop_area'] : acc, 0).toFixed(4));
                    DB_SERVICE.createTransaction(dbkey, function (err, tranobj, trancallback) {
                        tranObj = tranobj;
                        tranCallback = trancallback;
                        dbkey = { dbkey: dbkey, connectionobj: tranObj };
                        return cback2(err);
                    })
                }
            },
            // check death farmer is active 
            function (cback3) {
                varisan_s.isFarmerEligableForVarishan(dbkey, request, { fs_id: basic_data.death_fs_id, uf_id: basic_data.old_uf_id }, sessionDetails, function (err, res) {
                    return cback3(err)
                })
            },
            //return is death is a new panjiyan or not ,insert into app log then delete record of crop , land, farmer_society, farmer_reprensentative, mas_farmer and farmer_scheme_mapping of death farmer
            function (cback4) {
                varisan_s.insrtAndDltDataForVarishan(dbkey, request, { uf_id: basic_data['old_uf_id'], fs_id: basic_data['death_fs_id'] }, sessionDetails, function (err, res) {
                    if (err) {
                        return cback4(err);
                    }
                    else {
                        isDeathFarmerIsNewFarmer = res['isDeathFarmerIsNewFarmer']
                        return cback4(null);
                    }
                })
            },
            //if death farmer is not a new panjiyan on this year then mark status in base database land_details
            function (cback5) {
                if (isDeathFarmerIsNewFarmer) return cback5()
                let updateObj = { "carry_forward_status": "D" }, whereObj = { "fs_id": basic_data['death_fs_id'] };
                let queryParamObj = DB_SERVICE.getUpdateQueryAndparams(updateObj, whereObj, base_database + '.land_details');
                DB_SERVICE.executeQueryWithParameters(dbkey, queryParamObj.query, queryParamObj.params, function (err41, res41) {
                    if (err41) {
                        return cback5(err41);
                    }
                    else if (res41.data["affectedRows"] >= 0) {
                        return cback5(null)
                    }
                    else {
                        return cback5({ message: `Carry Forword Status 'D' update unSuccessFull in Land Details ON base SERVER  for varisan Old Farmer fs_id ${varisanOldfarmerOldFsId}.`, errno: 7777 });
                    }
                })
            },
            //insert varis farmer details
            function (cback6) {
                if (basic_data.varisanCase == 1 || basic_data.varisanCase == 2) {
                    // todo add new kisan
                    varisan_s.varisanAddNewFarmer(dbkey, request, params, sessionDetails, function (err, res) {
                        if (err) return cback6(err);
                        basic_data = { ...basic_data, ...res }
                        return cback6(null)
                    })
                }
                else if (basic_data.varisanCase == 3) {
                    // todo sansodhan kisan
                    varisan_s.varisanUpdateLandAndCrop(dbkey, request, params, sessionDetails, function (err, res) {
                        if (err) return cback6(err);
                        basic_data = { ...basic_data, ...res }
                        return cback6(null)
                    })
                }
                else {
                    return cback6({ "message": `Invalid Value For Varisan Case` });
                }
            },
            //insert into varisan farmer table
            function (cback7) {
                //console.log(basic_data);
                let insertObj = {
                    "uf_id": basic_data.old_uf_id, "fs_id": basic_data.death_fs_id, "farmer_code": basic_data.old_farmer_code, "society_id": basic_data.old_society_id,
                    "aadhar_number": basic_data.old_aadhar_number, "varis_uf_id": basic_data.uf_id, "varis_fs_id": basic_data.fs_id, "varis_aadhar_number": basic_data.aadhar_number,
                    "varis_farmer_code": basic_data.farmer_code ?? null, "varis_society_id": basic_data.society_id,
                    "user_id": sessionDetails["user_id"], "ip_address": sessionDetails["ip_address"]
                };
                let qAndParam1 = DB_SERVICE.getInsertClauseWithParams(insertObj, 'varisan_farmer');
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam1.query, qAndParam1.params, function (err1, res) {
                    if (err1) {
                        return cback7(err1);
                    }
                    else if (res.data && res.data["affectedRows"] == 1) {
                        return cback7()
                    }
                    else {
                        return cback7({ "message": `Insert into UFP2023 varisan_farmer is failed.` });
                    }
                })
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
    insrtAndDltDataForVarishan: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.fs_id && params.uf_id)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let isSingleFsFarmer = false, isDeathFarmerIsNewFarmer = false, active_fs_data = [];
        async.series([
            // crop delete
            function (cback1) {
                async.parallel([
                    //rg crop delete
                    function (cback11) {
                        insrtAndDltOperation(dbkey, request, { log_table_name: 'app_log_crop_details', delete_table_name: 'crop_details', whereObj: { fs_id: params['fs_id'] } }, sessionDetails, function (err, res) {
                            if (err) {
                                return cback11(err);
                            }
                            else {
                                return cback11(null);
                            }
                        })
                    },
                    // forest crop delete
                    function (cback12) {
                        insrtAndDltOperation(dbkey, request, { log_table_name: 'app_log_crop_details_forest', delete_table_name: 'crop_details_forest', whereObj: { fs_id: params['fs_id'] } }, sessionDetails, function (err, res) {
                            if (err) {
                                return cback12(err);
                            }
                            else {
                                return cback12(null);
                            }
                        })
                    }
                ], function (err, res) {
                    if (err) {
                        return cback1(err);
                    }
                    else {
                        return cback1(null);
                    }
                })
            },
            // land delete
            function (cback2) {
                async.parallel([
                    //rg crop delete
                    function (cback21) {
                        insrtAndDltOperation(dbkey, request, { log_table_name: 'app_log_land_details', delete_table_name: 'land_details', whereObj: { fs_id: params['fs_id'] } }, sessionDetails, function (err, res) {
                            if (err) {
                                return cback21(err);
                            }
                            else {
                                return cback21(null);
                            }
                        })
                    },
                    // forest land delete
                    function (cback22) {
                        insrtAndDltOperation(dbkey, request, { log_table_name: 'app_log_land_details_forest', delete_table_name: 'land_details_forest', whereObj: { fs_id: params['fs_id'] } }, sessionDetails, function (err, res) {
                            if (err) {
                                return cback22(err);
                            }
                            else {
                                return cback22(null);
                            }
                        })
                    }
                ], function (err, res) {
                    if (err) {
                        return cback2(err);
                    }
                    else {
                        return cback2(null);

                    }
                })
            },
            //get farmer society data to check is single fs farmer or not
            function (cback3) {
                let q = `SELECT * FROM farmer_society fs
                WHERE fs.uf_id = ${params.uf_id}`;
                DB_SERVICE.executeQueryWithParameters(dbkey, q, [], function (e1, r1) {
                    if (e1) {
                        return cback3(e1);
                    }
                    else if (r1.data && r1.data.length > 0) {
                        active_fs_data = r1.data.filter((e) => {
                            return (e.opration_id !== 3 && e.opration_id !== 5)
                        })
                        let society_data = active_fs_data.filter(e => {
                            return e.fs_id == params['fs_id']
                        })
                        if (society_data.length == 0) {
                            return cback3({ message: `farmer fs_id-${params.fs_id} is not active in farmer_society` })
                        }
                        isSingleFsFarmer = active_fs_data.length == 1
                        isDeathFarmerIsNewFarmer = society_data[0]['entry_tye_code'] == 2
                        isSingleFsFarmer = r1.data.length == 1;
                        return cback3(null);
                    } else {
                        return cback3({ ...securityService.SECURITY_ERRORS.DATA_NOT_FOUND, message: `no record found for uf_id ${params['uf_id']}` })
                    }
                })
            },
            //farmer_representative delete
            function (cback4) {
                insrtAndDltOperation(dbkey, request, { log_table_name: 'app_log_farmerrepresentative', delete_table_name: 'farmerrepresentative', whereObj: { fs_id: params['fs_id'] } }, sessionDetails, function (err, res) {
                    if (err) {
                        return cback4(err);
                    }
                    else {
                        return cback4(null);
                    }
                })
            },
            //farmer_society update
            function (cback4) {
                //send update-type = 5 for sansodhan_TYPE 
                insrtAndUpdtOperation(dbkey, request, { log_table_name: 'app_log_farmer_society', update_table_name: 'farmer_society', whereObj: { fs_id: params['fs_id'] }, updateObj: { 'operation_id': 5 }, update_type: 5 }, sessionDetails, function (err, res) {
                    if (err) {
                        return cback4(err);
                    }
                    else {
                        return cback4(null);
                    }
                })
            },
            // // if singlefs then mas farmer delete
            // function (cback5) {
            //     if (!isSingleFsFarmer) return cback5()
            //         insrtAndUpdtOperation(dbkey, request, { log_table_name: 'app_log_mas_farmer', update_table_name: 'mas_farmer', whereObj: { uf_id: params['uf_id'] }, updateObj: { 'operation_id': 5 } }, sessionDetails, function (err, res) {
            //         if (err) {
            //             return cback5(err);
            //         }
            //         else {
            //             return cback5(null);
            //         }
            //     })
            // },
            // if singlefs then farmer_scheme_mapping delete
            function (cback5) {
                if (!isSingleFsFarmer) return cback5()
                insrtAndDltOperation(dbkey, request, { log_table_name: ufp_database + '.app_log_farmer_scheme_mapping', delete_table_name: ufp_database + '.farmer_scheme_mapping', whereObj: { uf_id: params['uf_id'] } }, sessionDetails, function (err, res) {
                    if (err) {
                        return cback5(err);
                    }
                    else {
                        return cback5(null);
                    }
                })
            }
        ], function (err, res) {
            if (err) return callback(err);
            return callback(null, { isDeathFarmerIsNewFarmer });
        })
    },
    varisanAddNewFarmer: function (dbkey, request, params, sessionDetails, callback) {
        let basic_data = {}, inserted_lands = {}, is_paddy_maize_crop_available = false
        async.series([
            // check validation
            function (cback) {
                const { error, value } = userValidations.FarmerObjectValidation(params, 5);
                if (error && error.details) {
                    cback(error.details);
                    return;
                } else {
                    basic_data.entry_type = 6// for varishan add new farmer
                    basic_data.varisanOldFarmerCode = params.varisanOldFarmerCode
                    basic_data.total_land_area = +(+(params['land_details'].reduce((acc, cur) => acc + +cur['FarmSize'], 0).toFixed(4)) + +(params['forest_land_details'].reduce((acc, cur) => acc + +cur['land_area'], 0).toFixed(4))).toFixed(4);
                    basic_data.total_crop_area = +(+(params['crop_details'].reduce((acc, cur) => acc + +cur['crop_area'], 0).toFixed(4)) + +(params['forest_crop_details'].reduce((acc, cur) => acc + +cur['crop_area'], 0).toFixed(4))).toFixed(4);
                    basic_data.total_paddy_area = +(+(params['crop_details'].reduce((acc, cur) => cur['crop_code'] == 104 ? acc + +cur['crop_area'] : acc, 0).toFixed(4)) + +(params['forest_crop_details'].reduce((acc, cur) => cur['crop_code'] == 104 ? acc + +cur['crop_area'] : acc, 0).toFixed(4))).toFixed(4)
                    return cback();
                }
            },
            //insert basic 
            function (cback1) {
                saveFarmerBasicDetails_newPanjiyan(dbkey, request, { ...params['basic_details'], basic_data }, sessionDetails, function (err, res) {
                    if (err) {
                        return cback1(err);
                    }
                    else {
                        basic_data = { ...basic_data, ...res };
                        return cback1(null, res);
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
            // call food api
            function (cback4) {
                if (is_paddy_maize_crop_available) {
                    if (basic_data.varisanOldFarmerCode && basic_data.varisanOldFarmerCode.length == 15) {
                        foodApiAddVarisanKisan(dbkey, basic_data, params, sessionDetails, function (err, body) {
                            if (err) {
                                return cback4(err);
                            }
                            else {
                                //responseFromApi = response;
                                bodyFromApi = body;
                                basic_data['farmer_code'] = body['FarmerCode'];//update after checking the response
                                return cback4()
                            }
                        })
                    } else {
                        foodApiAddKisan(dbkey, basic_data, params, sessionDetails, function (err, body) {
                            if (err) {
                                return cback4(err);

                            }
                            else {
                                bodyFromApi = body;
                                basic_data['farmer_code'] = body['FarmerCode'];//update after checking the response
                                return cback4()
                            }
                        })
                    }
                } else {
                    return cback4();
                }
            },
            //Update the farmer code
            function (cback5) {
                if (is_paddy_maize_crop_available && basic_data['farmer_code']) {
                    updateFarmerCode(dbkey, { ...basic_data, inserted_lands }, sessionDetails, function (err, res) {
                        if (err) {
                            return cback5(err);
                        }
                        else {
                            return cback5(null, res)
                        }
                    })
                }
                else {
                    return cback5()
                }
            }
        ],
            function (err, result) {
                if (err) {
                    return callback(err)
                }
                else {
                    return callback(null, basic_data);
                }
            })
    },
    varisanUpdateLandAndCrop: function (dbkey, request, params, sessionDetails, callback) {
        let basic_data = {}, inserted_lands = {}, is_paddy_maize_crop_available = false, isFoodNewKisanApiCalled = false;
        async.series([
            //validate object and make transaction -- recheck pending
            function (cback2) {
                const { error, value } = userValidations.FarmerObjectValidation(params, 4);
                if (error && error.details) {
                    return cback2(error.details[0].message);

                } else {
                    basic_data.fs_id = params['basic_details']['farmer_society']['fs_id']
                    basic_data.old_fs_id = params['basic_details']['farmer_society']['old_fs_id']
                    basic_data.farmer_code = params['basic_details']['farmer_society']['farmer_code']
                    basic_data.society_id = params['basic_details']['farmer_society']['society_id']
                    basic_data.uf_id = params['basic_details']['mas_farmer']['uf_id']
                    basic_data.varisanOldFarmerCode = params['varisanOldFarmerCode']
                    basic_data.entry_type = 7 // for varishan sansodhan farmer
                    basic_data.total_land_area = +(+(params['land_details'].reduce((acc, cur) => acc + +cur['FarmSize'], 0).toFixed(4)) + +(params['forest_land_details'].reduce((acc, cur) => acc + +cur['land_area'], 0).toFixed(4))).toFixed(4);
                    basic_data.total_crop_area = +(+(params['crop_details'].reduce((acc, cur) => acc + +cur['crop_area'], 0).toFixed(4)) + +(params['forest_crop_details'].reduce((acc, cur) => acc + +cur['crop_area'], 0).toFixed(4))).toFixed(4);
                    basic_data.total_paddy_area = +(+(params['crop_details'].reduce((acc, cur) => cur['crop_code'] == 104 ? acc + +cur['crop_area'] : acc, 0).toFixed(4)) + +(params['forest_crop_details'].reduce((acc, cur) => cur['crop_code'] == 104 ? acc + +cur['crop_area'] : acc, 0).toFixed(4))).toFixed(4);
                    return cback2()
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
                let whereObj = { fs_id: basic_data['fs_id'] };
                let updateObj = { 'is_bhumihin_farmer': 'N', total_paddy_area: basic_data['total_paddy_area'], total_crop_area: basic_data['total_crop_area'], total_land_area: basic_data['total_land_area'], "updated_user_id": sessionDetails['user_id'], "updated_ip_address": sessionDetails['ip_address'] };
                insrtAndUpdtOperation(dbkey, request, { log_table_name: 'app_log_farmer_society', update_table_name: 'farmer_society', updateObj, whereObj, update_type: 1 }, sessionDetails, function (err, res) {
                    if (err) {
                        cback6(err);
                    }
                    else {
                        cback6(null, res);
                    }
                })
            },
            //TODO - RECHECK
            // call food api
            function (cback7) {
                if (is_paddy_maize_crop_available) {
                    if (basic_data['farmer_code']) {
                        if (basic_data['varisanOldFarmerCode']) {//VARisan sanshodhan
                            foodApiVarisanSansodhanKisan(dbkey, basic_data, params, sessionDetails, function (err, body) {
                                if (err) {
                                    return cback7(err);
                                }
                                else {
                                    bodyFromApi = body;
                                    basic_data['farmer_code'] = body['FarmerCode'];
                                    return cback7();
                                }
                            })
                        }
                        else {
                            //Normal Sanshodhan
                            foodApiSansodhanKisan(dbkey, basic_data, params, sessionDetails, function (err, body) {
                                if (err) {
                                    return cback7(err);
                                }
                                else {
                                    bodyFromApi = body;
                                    basic_data['farmer_code'] = body['FarmerCode'];
                                    return cback7();
                                }
                            })
                        }
                    } else {
                        if (basic_data['varisanOldFarmerCode']) {
                            // New VARisan Kisan
                            foodApiAddVarisanKisan(dbkey, basic_data, params, sessionDetails, function (err, body) {
                                if (err) {
                                    return cback7(err);
                                }
                                else {
                                    //responseFromApi = response;
                                    bodyFromApi = body;
                                    basic_data['farmer_code'] = body['FarmerCode'];//update after checking the response
                                    isFoodNewKisanApiCalled = true;
                                    return cback7()
                                }
                            })
                        }
                        else {
                            // New Normal Kisan
                            foodApiAddKisan(dbkey, basic_data, params, sessionDetails, function (err, body) {
                                if (err) {
                                    return cback7(err);
                                }
                                else {
                                    //responseFromApi = response;
                                    bodyFromApi = body;
                                    basic_data['farmer_code'] = body['FarmerCode'];//update after checking the response
                                    isFoodNewKisanApiCalled = true
                                    return cback7();
                                }
                            })
                        }
                    }
                } else {
                    return cback7();
                }
            },
            // if food new kisan api called then update the farmer code in all table
            function (cback8) {
                if (isFoodNewKisanApiCalled) {
                    updateFarmerCode(dbkey, { ...basic_data, inserted_lands }, sessionDetails, function (err, res) {
                        if (err) {
                            return cback8(err);
                        }
                        else {
                            return cback8(null, res);
                        }
                    })
                } else {
                    return cback8();
                }
            }
        ], function (err, res) {
            if (err) {
                return callback(err);
            }
            else {
                console.log('test completed')
                return callback(null, basic_data);
            }
        })

    },

    isFarmerEligableForVarishan: function (dbkey, request, params, sessionDetails, callback) {
        getActiveFarmerDetails(dbkey, request, { fs_id: params.fs_id, uf_id: params.uf_id }, sessionDetails, function (err, res) {
            if (err) { return callback(err) }
            else if (res['basic_data']) {
                if (res['basic_data']['is_bhumihin_farmer'] == 'Y') {
                    return callback({ message: `farmer fs_id : ${params.fs_id} is a bhumihin farmer.` });
                } else {
                    return callback()
                }

            } else {
                return callback({ message: `basic data not found in active farmer detail for fs_id : ${basic_data.fs_id}` });
            }
        })

    }


}

module.exports = varisan_s