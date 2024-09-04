var DB_SERVICE = global.DB_SERVICE;
var CONFIG_PARAMS = global.COMMON_CONFS;
var NEW_REG_QUERIES = require('../queries/newRegistrationQueries.js');
let CARRY_FORWARD_QUERIES = require('../queries/carryForwardQueries.js')
var securityService = require('./securityservice.js');
var async = require('async');
const userValidations = require('../validators/uservalidator.js');
const { isLastDateExceeded, getLastFourDigits, saveFarmerBasicDetails, saveFarmerCropDetails, saveFarmerLandDetails, updateFarmerCode } = require('../services/commonService.js');
const { foodApiAddKisan } = require('./foodServices.js')
let ufp_database = 'ufp_2024';

let newPanjiyan = {
    addNewKisan: function (dbkey, request, params, sessionDetails, callback) {
        let tranObj, tranCallback, basic_data = {}, inserted_lands = {}, is_paddy_maize_crop_available = false
        async.series([
            //check valid date
            function (cback0001) {
                isLastDateExceeded(CONFIG_PARAMS.getWorkingDBDetails(), request, { type: 2 }, sessionDetails, function (err, res) {
                    if (err) {
                        return cback0001(err)
                    } else {
                        if (res && !res['is_last_date_exceeded']) {
                            return cback0001()
                        } else {
                            return cback0001(securityService.SECURITY_ERRORS.LAST_DATE_EXCEEDED)
                        }
                    }
                })
            },
            // check validation && make transaction
            function (cback) {
                const { error, value } = userValidations.FarmerObjectValidation(params, 2);
                if (error && error.details) {
                    cback(error.details);
                    return;
                } else {
                    basic_data.entry_type = 2
                    basic_data.total_land_area = +(+(params['land_details'].reduce((acc, cur) => acc + +cur['FarmSize'], 0).toFixed(4)) + +(params['forest_land_details'].reduce((acc, cur) => acc + +cur['land_area'], 0).toFixed(4))).toFixed(4);
                    basic_data.total_crop_area = +(+(params['crop_details'].reduce((acc, cur) => acc + +cur['crop_area'], 0).toFixed(4)) + +(params['forest_crop_details'].reduce((acc, cur) => acc + +cur['crop_area'], 0).toFixed(4))).toFixed(4);
                    basic_data.total_paddy_area = +(+(params['crop_details'].reduce((acc, cur) => cur['crop_code'] == 104 ? acc + +cur['crop_area'] : acc, 0).toFixed(4)) + +(params['forest_crop_details'].reduce((acc, cur) => cur['crop_code'] == 104 ? acc + +cur['crop_area'] : acc, 0).toFixed(4))).toFixed(4);
                    DB_SERVICE.createTransaction(dbkey, function (err, tranobj, trancallback) {
                        tranObj = tranobj;
                        tranCallback = trancallback;
                        dbkey = { dbkey: dbkey, connectionobj: tranObj };
                        return cback(err);
                    })
                }
            },
            //insert basic 
            function (cback1) {
                newPanjiyan.saveFarmerBasicDetails_newPanjiyan(dbkey, request, { ...params['basic_details'], basic_data }, sessionDetails, function (err, res) {
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
                    foodApiAddKisan(dbkey, basic_data, params, sessionDetails, function (err, body) {
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
                    cback4();
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
                    //console.log('paddy or maize crop not found');
                    return cback5()
                }
            }
        ],
            function (err, result) {
                if (err) {
                    DB_SERVICE.rollbackPartialTransaction(tranObj, tranCallback, function (err4) {
                        return callback(err)
                    })
                }
                else {
                    // DB_SERVICE.rollbackPartialTransaction(tranObj, tranCallback, function (err4) {
                    //     //console.log(err);
                    //     callback(err, basic_data)
                    // })
                    DB_SERVICE.commitPartialTransaction(tranObj, tranCallback, function (err5) {
                        return callback(null, basic_data);
                    });
                }
            })
    },
    saveFarmerBasicDetails_newPanjiyan: function (dbkey, request, params, sessionDetails, callback) {
        let basic_data = {}
        async.series([
            // CHECK AND INSERT DATA IN UFP_TABLE
            function (cback4) {
                newPanjiyan.saveNewFarmer_ufp(dbkey, request, params['mas_farmer'], sessionDetails, function (err, res) {
                    if (err) return cback4(err);
                    if (!res['uf_id']) return cback4({ message: 'uf_id not sent from ufp insert in new panjian' })
                    params['mas_farmer']['uf_id'] = res['uf_id'];
                    return cback4(null)
                })
            },
            // CHECK AND INSERT DATA IN PROCURMENT_TABLE
            function (cback5) {
                saveFarmerBasicDetails(dbkey, request, params, sessionDetails, function (err, res) {
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
    //check and insert data in ufp
    saveNewFarmer_ufp: function (dbkey, request, params, sessionDetails, callback) {
        let isFarmerExist = false, isFarmerExistInMap = false, uf_id;
        async.series([
            // check aadhar exist in ufp
            function (cback0) {
                if (!params['aadhar_ref']) return cback0({ message: 'aadhar_ref is madnatory.' })
                qAndP = NEW_REG_QUERIES.getCheckFarmerExistOnUFP2024(params['aadhar_ref']);
                DB_SERVICE.executeQueryWithParameters(CONFIG_PARAMS.getUfpDBDetails(), qAndP.query, qAndP.params, function (e1, r1) {
                    if (e1) {
                        cback0(e1);
                        return;
                    } else if (r1 && r1.data.length > 0) {
                        if (params['uf_id']) {
                            if (r1.data[0]['uf_id'] == params['uf_id']) {
                                uf_id = params['uf_id']
                                isFarmerExist = true;
                                return cback0();
                            } else {
                                return cback0({ message: `aadhar exist with differnt uf_id ${r1.data[0]['uf_id']} in ufp 2024` });
                            }
                        } else {
                            return cback0({ message: `aadhar already exist with uf_id ${r1.data[0]['uf_id']} in ufp 2024` });
                        }

                    } else {
                        isFarmerExist = false;
                        return cback0();
                    }

                })
            },
            //validate
            function (cback1) {
                params['ip_address'] = sessionDetails.ip_address;
                params['user_id'] = sessionDetails.user_id;
                params['pincode'] = params['pincode'] == '' ? null : params['pincode']
                const { value, error } = userValidations.masFarmerValidation(params, 2);
                if (error) {
                    cback1(`in mas_farmer :- ${error.details[0].message}`);
                    return;
                } else {
                    params = value;
                    return cback1();
                }
            },
            // insert data in ufp
            function (cback1) {
                if (isFarmerExist) {
                    return cback1()
                } else {
                    qAndP = DB_SERVICE.getInsertClauseWithParams(params, ufp_database + '.mas_farmer');
                    DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
                        if (r1 && r1.data) {
                            uf_id = r1.data['insertId']
                            return cback1();
                        } else {
                            cback1(e1);
                            return;
                        }
                    })
                }
            },
            // check in map table
            function (cback2) {
                if (isFarmerExist) {
                    qAndP = CARRY_FORWARD_QUERIES.checkUfInMapTblQueryParamObj(params['uf_id']);
                    DB_SERVICE.executeQueryWithParameters(CONFIG_PARAMS.getUfpDBDetails(), qAndP.query, qAndP.params, function (e1, r1) {
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
                    })
                } else {
                    isFarmerExistInMap = false
                    return cback2();
                }

            },
            // insert data in map table
            function (cback1) {
                if (isFarmerExistInMap) {
                    return cback1()
                } else {
                    qAndP = DB_SERVICE.getInsertClauseWithParams({ uf_id: uf_id, scheme_id: 1, ip_address: sessionDetails['ip_address'], user_id: sessionDetails['user_id'] }, ufp_database + '.farmer_scheme_mapping');
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
            return callback(null, { uf_id: uf_id })
        })
    },

    checkAadharExists: function (dbkey, request, params, sessionDetails, callback) {
        console.log(params, "P");
        if (!(params.aadharRef && params.society_id && params.aadharNo)) return callback({ ...securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING, 'message': 'in aadhar check aadharRef ,society_id and aadharNo is required.' });
        if (params.aadharNo.toString().length != 12) return callback(securityService.SECURITY_ERRORS.INVALID_AADHAR_NO);
        let aadharNo = params["aadharNo"];
        let aadharRef = params["aadharRef"], society_id = params["society_id"], result = {}, aadharDataOld = [];
        let societyExist = false, society_data = {}, aadharDataForProcurementDB = [], aadharDataForUfp24 = [];
        let isDataExistOnUfp24ForProcurement = false, isAddharISNewForRegistration = false;
        let oldDbkey = CONFIG_PARAMS.getWorkingBaseDBDetails();
        let ufp2024dbKey = CONFIG_PARAMS.getUfpDBDetails();
        let procurmentDB = CONFIG_PARAMS.getWorkingDBDetails();
        async.series([
            // check On Old DB 2023
            function (cback2) {
                let qAndParam = NEW_REG_QUERIES.getcheckFarmerExistWithAadharQueryParamObj(aadharRef);
                DB_SERVICE.executeQueryWithParameters(oldDbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
                    // console.log(e1, r1);
                    if (e1) {
                        return cback2(e1);
                    }
                    else if (r1 && r1.data && r1.data.length > 0) {
                        aadharDataOld = r1.data;
                        return cback2();
                    }
                    else {
                        return cback2();
                    }
                });
            },
            function (cback21) {
                if (aadharDataOld.length > 0 && society_id) {
                    async.eachSeries(aadharDataOld, function (data, cb1) {
                        if (data["society_id"] == society_id) {
                            society_data = data;
                            societyExist = true;
                            return cb1({ "code": 0 })
                        }
                        else {
                            return cb1();
                        }
                    },
                        function (err, res) {
                            return cback21();
                        })
                }
                else {
                    return cback21();
                }
            },
            // check On New UFP DB 2024
            function (cback3) {
                if (aadharDataOld.length == 0) {
                    qAndParam = NEW_REG_QUERIES.getCheckFarmerExistOnUFP2024(aadharRef);
                    DB_SERVICE.executeQueryWithParameters(ufp2024dbKey, qAndParam.query, qAndParam.params, function (e1, r1) {
                        if (e1) {
                            return cback3(e1);
                        }
                        else if (r1 && r1.data && r1.data.length > 0) {
                            aadharDataForUfp24 = r1.data;
                            return cback3();
                        }
                        else {
                            return cback3();
                        }
                    });
                }
                else {
                    return cback3();
                }
            },
            function (cback4) {
                // new Aadhar For Panjiyan
                if (aadharDataOld.length == 0 && aadharDataForUfp24.length == 0) {
                    isAddharISNewForRegistration = true;
                    isDataExistOnUfp24ForProcurement = false;
                    return cback4();
                }
                // Aadhar exist on Ufp24 and check scheme for Registration
                else if (aadharDataOld.length == 0 && aadharDataForUfp24.length != 0) {
                    async.eachSeries(aadharDataForUfp24, function (data, cb1) {
                        if (data['scheme_id'] == 1) {
                            isDataExistOnUfp24ForProcurement = true;
                            return cb1({ "code": 0 });
                        }
                        else {
                            isDataExistOnUfp24ForProcurement = false;
                            return cb1();
                        }
                    }, function (err, res) {
                        return cback4();
                    })
                }
                // aadhar exist on old rgkny 2023 on pending status (null or 'R')
                else {
                    return cback4();
                }
            },
            function (cback5) {
                if (aadharDataOld.length != 0) {
                    return cback5()
                }
                // aadhar available in ufp2024 but not available for procurement scheme
                else if (aadharDataForUfp24.length != 0 && !isDataExistOnUfp24ForProcurement) {
                    return cback5();
                }
                // adhar available in ufp2024 And also available for procurement scheme
                else if (aadharDataForUfp24.length != 0 && isDataExistOnUfp24ForProcurement) {
                    // get complete data from procurement 2024
                    qAndParam = NEW_REG_QUERIES.getCheckFarmerAadharExistOnProcurementDB(aadharRef);
                    DB_SERVICE.executeQueryWithParameters(procurmentDB, qAndParam.query, qAndParam.params, function (e1, r1) {
                        if (e1) {
                            return cback5(e1);
                        }
                        else if (r1 && r1.data && r1.data.length > 0) {
                            aadharDataForProcurementDB = r1.data;
                            return cback5();
                        }
                        else {
                            return cback5({ "message": 'Scheme Id is Avilable but Data not Available in Procurment DB For Aadhar' });
                        }
                    });
                }
                else {
                    return cback5();
                }
            },
            function (cback6) {
                if (isDataExistOnUfp24ForProcurement) {
                    async.eachSeries(aadharDataForProcurementDB, function (data, cb1) {
                        if (data["society_id"] == society_id) {
                            society_data = data;
                            societyExist = true;
                            return cb1({ "code": 0 });
                        }
                        else {
                            return cb1();
                        }
                    }, function (err, res) {
                        return cback6();
                    })
                }
                else {
                    return cback6();
                }
            }
        ], function (err, res) {
            if (err) {
                return callback(err);
            }
            else {
                if (isAddharISNewForRegistration) {
                    return callback(null, { "code": "AADHAR_NOT_EXIST", "aadhar": aadharNo, "aadharRef": aadharRef });
                }
                else if (aadharDataOld.length > 0) {
                    if (societyExist) {
                        return callback(null, { "code": "AADHAR_EXIST_WITH_SAME_SOCIETY", "society_id": society_id, "aadhar": aadharNo, "aadharRef": aadharRef, "existing_data": aadharDataOld, society_data });
                    }
                    else {
                        return callback(null, { "code": "AADHAR_EXIST_WITH_DIFFERENT_SOCIETY", "society_id": society_id, "aadhar": aadharNo, "aadharRef": aadharRef, "existing_data": aadharDataOld });
                    }
                }
                else if (aadharDataOld.length == 0 && aadharDataForUfp24 != 0 && isDataExistOnUfp24ForProcurement) {
                    if (societyExist) {
                        return callback(null, { "code": "AADHAR_EXIST_WITH_SAME_SOCIETY_ON_PROCUREMENT_DB", "society_id": society_id, "aadhar": aadharNo, "aadharRef": aadharRef, "existing_data": aadharDataForProcurementDB, society_data });
                    } else {
                        return callback(null, { "code": "AADHAR_EXIST_WITH_DIFFERENT_SOCIETY_ON_PROCUREMENT_DB", "society_id": society_id, "aadhar": aadharNo, "aadharRef": aadharRef, "existing_data": aadharDataForProcurementDB });
                    }
                }
                else if (aadharDataOld.length == 0 && aadharDataForUfp24 != 0 && !isDataExistOnUfp24ForProcurement) {
                    return callback(null, { "code": "AADHAR_EXIST_ON_UFP_WITH_OTHER_SCHEME", "aadhar": aadharNo, "aadharRef": aadharRef, "existing_data": aadharDataForUfp24 });
                }
                else {
                    return callback({ "messgae": "UNKNOWN Error" });
                }
            }
        })
    },
}

module.exports = newPanjiyan




