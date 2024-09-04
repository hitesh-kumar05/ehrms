var DB_SERVICE = global.DB_SERVICE;
var CONFIG_PARAMS = global.COMMON_CONFS;
let CARRY_FORWARD_QUERIES = require('../queries/carryForwardQueries.js')
var async = require('async');
const userValidations = require('../validators/uservalidator.js');
const { isLastDateExceeded, updateFarmerCode, saveFarmerCropDetails, saveTrustLandDetails } = require('../services/commonService.js');
const securityService = require('./securityservice.js');
const { foodApiAddKisan, carryForwardFoodApi } = require('./foodServices.js');
const { getRefIdByAadhar } = require('../../apiServer/services/aadharService.js')
let config = require('config');
let ufp_database = config.get('ufp_db').database ?? 'ufp_2024';
let base_database = config.get('procurement_base_db').database ?? 'rgkny_2023';


let trust_carryForward_s = {
    saveTrustCarryForward: function (dbkey, request, params, sessionDetails, callback) {
        let tranObj, tranCallback, basic_data = {}, inserted_lands = {}, is_paddy_maize_crop_available = false, isFoodNewKisanApiCalled = false;
        async.series([
            //check valid date
            function (cback1) {
                isLastDateExceeded(CONFIG_PARAMS.getWorkingDBDetails(), request, { type: 3 }, sessionDetails, function (err, res) {
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
            //validate object and make transaction
            function (cback2) {
                const { error, value } = userValidations.trustObjectValidation(params, 1);
                if (error && error.details) {
                    return cback2(error.details[0].message);
                } else {
                    // basic_data.is_trust = params.farmer_type == 1 ? 'Y' : 'N'
                    basic_data.entry_type = 1 //for carryforward
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
            //validate and insert basic 
            function (cback3) {
                trust_carryForward_s.saveTrustBasicDetails_carryforward(dbkey, request, { ...params['basic_details'], basic_data }, sessionDetails, function (err, res) {
                    if (err) {
                        return cback3(err);
                    }
                    else {
                        basic_data = { ...basic_data, ...res };
                        return cback3(null, res);
                    }
                })
            },
            //land insert
            function (cback4) {
                saveTrustLandDetails(dbkey, basic_data, { land_details: params['land_details'], forest_land_details: params['forest_land_details'] }, sessionDetails, function (err, inserted_land_record) {
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
            //update status in base database
            function (cback6) {
                carryForward_s.updateStatusForCarryForward(dbkey, params['old_land_details'], inserted_lands, basic_data, sessionDetails, function (err, res) {
                    return cback6(err, res)
                })
            },
            // call food api for carry forward
            function (cback5) {
                if (is_paddy_maize_crop_available || (basic_data.is_bhumihin_farmer === 'Y')) {
                    if (basic_data['farmer_code']) {
                        carryForwardFoodApi(dbkey, basic_data, params, sessionDetails, function (err, body) {
                            // console.log('after food api',err,body);
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
                    return cback5();
                }
            },
            // if food new kisan api called then update the farmer code in all table
            function (cback6) {
                if (isFoodNewKisanApiCalled) {
                    updateFarmerCode(dbkey, { ...basic_data, inserted_lands }, sessionDetails, function (err, res) {
                        if (err) {
                            return cback6(err);
                        }
                        else {
                            return cback6(null, res)
                        }
                    })
                } else {
                    return cback6()
                }
            }
        ], function (err, res) {
            if (err) {
                DB_SERVICE.rollbackPartialTransaction(tranObj, tranCallback, function (err4) {
                    return callback(err)
                })
            }
            else {
                console.log('test completed')
                DB_SERVICE.commitPartialTransaction(tranObj, tranCallback, function (err5) {
                    callback(null, basic_data);
                });
            }
        })
    },
    saveTrustBasicDetails_carryforward: function (dbkey, request, params, sessionDetails, callback) {
        let basic_data = {}
        async.series([
            // CHECK AND INSERT DATA IN UFP_TABLE
            function (cback4) {
                params['mas_farmer']['relation'] = 'F'
                //params['mas_farmer']['dob'] = '1990-01-01'
                params['mas_farmer']['subcaste_code'] = '101'
                params['mas_farmer']['father_name'] = params['mas_farmer']['farmer_name_aadhar']
                params['mas_farmer']['ip_address'] = sessionDetails.ip_address;
                params['mas_farmer']['user_id'] = sessionDetails.user_id;
                params['mas_farmer']['pincode'] = params['pincode'] == '' ? null : params['pincode'];
                trust_carryForward_s.saveCarryForwardTrust_ufp24(dbkey, request, params['mas_farmer'], sessionDetails, function (err, res) {
                    if (err) return cback4(err);
                    if (!res['uf_id']) return cback4({ message: 'uf_id not sent from ufp insert in trust panjian' })
                    params['mas_farmer']['uf_id'] = res['uf_id'];
                    params['mas_farmer']['aadhar_number'] = res['aadhar_number']
                    params['mas_farmer']['aadhar_ref'] = res['aadhar_ref']
                    params['mas_farmer']['aadhar_verfication'] = res['aadhar_verfication']
                    return cback4(null)
                })
            },
            // CHECK AND INSERT DATA IN PROCURMENT_TABLE
            function (cback5) {
                trust_carryForward_s.saveTrustBasicDetails(dbkey, request, params, sessionDetails, function (err, res) {
                    if (err) return cback5(err)
                    basic_data = res
                    return cback5(null)
                })
            }
        ],
            function (err, res) {
                if (err) {
                    return callback(err);
                }
                else {
                    return callback(null, basic_data);
                }
            })

    },
    //check and insert data in ufp2024
    saveCarryForwardTrust_ufp24: function (dbkey, request, params, sessionDetails, callback) {
        let isFarmerExist = false, isFarmerExistInMap = false, uf_id, unique_no, qAndP = {};
        async.series([
            //get max entry of mas_farmer 
            function (cback) {
                qAndP = { query: `select max(uf_id) as max_uf from  ${ufp_database}.mas_farmer`, params: [] }
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
                    if (e1) return cback(e1);
                    else {
                        max_uf = r1.data[0]['max_uf']
                        unique_no = (+max_uf + 1) + '00000'
                        return cback()
                    }
                })
            },
            //get ref-id of unique no.
            function (cback01) {
                getRefIdByAadhar(dbkey, request, { aadharNo: unique_no }, sessionDetails, function (err, res) {
                    if (err) return cback01(err);
                    else {
                        params['aadhar_number'] = unique_no;
                        params['aadhar_ref'] = res;
                        params['aadhar_verification'] = null;
                        return cback01();
                    }
                })
            },
            function (cback1) {
                const { value, error } = userValidations.trust_masFarmerValidation(params, 1);
                if (error) {
                    cback1(`in mas_farmer :- ${error.details[0].message}`);
                    return;
                } else {
                    params = value;
                    return cback1();
                }

            },
            function (cback0) {
                return cback0()
                // not required for 2024 carryforward because we generate new uf_id for all trust
                qAndP = CARRY_FORWARD_QUERIES.checkExistingFarmerInUFPDBQueryParamObj(params['uf_id']);
                DB_SERVICE.executeQueryWithParameters(CONFIG_PARAMS.getUfpDBDetails(), qAndP.query, qAndP.params, function (e1, r1) {
                    try {
                        if (e1) {
                            cback0(e1);
                            return;
                        } else if (r1 && r1.data.length > 0) {
                            if (r1.data[0]['aadhar_ref'] == params['aadhar_ref']) {
                                isFarmerExist = true;
                                return cback0();
                            } else {
                                return cback0({ message: `uf_id exist with differnet aadhar ref ${r1.data[0]['aadhar_ref']}` });
                            }

                        } else {
                            isFarmerExist = false;
                            return cback0();
                        }
                    } catch (e) {
                        return cback0(e);
                    }
                })
            },
            // insert data in ufp
            function (cback1) {
                if (isFarmerExist) {
                    return cback1()
                } else {
                    qAndP = DB_SERVICE.getInsertClauseWithParams(params, ufp_database + '.mas_farmer');
                    DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
                        if (r1 && r1.data) {
                            if (+r1.data["insertId"] !== max_uf + 1) return cback1({ message: `insert id ${r1.data["insertId"]} and max uf ${max_uf + 1} did not match` });
                            else {
                                uf_id = r1.data["insertId"];
                                params['uf_id'] = uf_id
                                return cback1();
                            }

                        } else {
                            return cback1(e1);
                        }
                    })
                }
            },
            // check in map table
            function (cback2) {
                return cback2()
                // not required for 2024 carryforward because we generate new uf_id for all trust
                qAndP = CARRY_FORWARD_QUERIES.checkUfInMapTblQueryParamObj(params['uf_id']);
                DB_SERVICE.executeQueryWithParameters(CONFIG_PARAMS.getUfpDBDetails(), qAndP.query, qAndP.params, function (e1, r1) {
                    try {
                        if (e1) {
                            cback2(e1);
                            return;
                        } else if (r1 && r1.data.length > 0) {
                            isFarmerExistInMap = true;
                            return cback2();
                        } else {
                            isFarmerExistInMap = false;
                            return cback2();
                        }
                    } catch (e) {
                        cback2(e);
                        return;
                    }
                })
            },
            // insert data in map table
            function (cback1) {
                if (isFarmerExistInMap) {
                    return cback1()
                } else {
                    qAndP = DB_SERVICE.getInsertClauseWithParams({ uf_id: params['uf_id'], scheme_id: 1, ip_address: sessionDetails['ip_address'], user_id: sessionDetails['user_id'] }, ufp_database + '.farmer_scheme_mapping');
                    DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
                        if (r1 && r1.data) {
                            return cback1();
                        } else {
                            cback1(e1);
                            return;
                        }
                    })
                }
            },
        ], function (err, res) {
            if (err) return callback(err);
            return callback(null, { uf_id: uf_id, aadhar_number: params['aadhar_number'], aadhar_ref: params['aadhar_ref'], aadhar_verification: params['aadhar_verification'] })
        })
    },

    saveTrustBasicDetails: function (dbkey, request, params, sessionDetails, callback) {
        const { value, error } = userValidations.trust_basicDetailsObjectValidation(params);
        if (error) {
            callback(`in basic_details :- ${error.details[0].message}`);
            return;
        }
        let { mas_farmer, farmer_society, basic_data } = value
        let { total_crop_area, total_land_area, total_paddy_area, entry_type } = basic_data
        let isFarmerExist = false;
        mas_farmer['ip_address'] = sessionDetails.ip_address;
        mas_farmer['user_id'] = sessionDetails.user_id;
        farmer_society['user_id'] = sessionDetails.user_id;
        farmer_society['ip_address'] = sessionDetails.ip_address;

        async.series([
            //check validation for mas_farmer
            function (cback1) {
                if (!isFarmerExist) {
                    mas_farmer['pincode'] = mas_farmer['pincode'] == '' ? null : mas_farmer['pincode']
                    const { value, error } = userValidations.trust_masFarmerValidation(mas_farmer, 'proc');
                    if (error) {
                        cback1(`in mas_farmer :- ${error.details[0].message}`);
                        return;
                    } else {
                        mas_farmer = value;
                        return cback1();
                    }
                } else {
                    return cback1();
                }

            },
            // CHECK UFID IN PROCURMENT_TABLE
            function (cback3) {
                qAndP = CARRY_FORWARD_QUERIES.checkExistingUfInNewDBQueryParamObj(mas_farmer['uf_id']);
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
                    if (e1) {
                        cback3(e1);
                        return;
                    } else if (r1 && r1.data.length > 0) {
                        isFarmerExist = true;
                        return cback3();
                    } else {
                        isFarmerExist = false;
                        return cback3();
                    }
                })
            },
            //inserted in mas_farmer 
            function (cback4) {
                if (isFarmerExist) {
                    return cback4(null);
                } else {
                    qAndP = DB_SERVICE.getInsertClauseWithParams(mas_farmer, 'mas_farmer');
                    DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
                        if (r1 && r1.data) {
                            return cback4();
                        } else {
                            cback4(e1);
                            return;
                        }
                    })
                }
            },
            //check validation for farmer_society
            function (cback2) {
                farmer_society['uf_id'] = mas_farmer['uf_id'];
                farmer_society['operation_id'] = 1;
                farmer_society['total_land_area'] = total_land_area
                farmer_society['total_crop_area'] = total_crop_area
                farmer_society['total_paddy_area'] = total_paddy_area
                const { value, error } = userValidations.trust_farmerSocietyValidation(farmer_society, entry_type);
                if (error) {
                    return cback2({ message: `in farmer_society :- ${error.details[0].message}`, errno: 1001, uf_id: mas_farmer['uf_id'] });
                } else {
                    farmer_society = value;
                    return cback2();
                }
            },
            //inserted in farmer_society
            function (cback6) {
                qAndP = DB_SERVICE.getInsertClauseWithParams(farmer_society, 'farmer_society');
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
                    if (r1 && r1.data) {
                        farmer_society['fs_id'] = r1.data["insertId"]
                        cback6();
                        return;
                    } else {
                        cback6(e1);
                        return;
                    }
                })
            }
        ], function (err, res) {
            return callback(err, { "uf_id": mas_farmer['uf_id'], "fs_id": farmer_society['fs_id'], "old_fs_id": farmer_society['old_fs_id'] ?? null, "farmer_code": farmer_society['farmer_code'] ?? null, "society_id": farmer_society['society_id'], "entry_type": entry_type })
        })
    },



}

module.exports = trust_carryForward_s