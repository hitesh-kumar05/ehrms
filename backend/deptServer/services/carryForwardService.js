var DB_SERVICE = global.DB_SERVICE;
var CONFIG_PARAMS = global.COMMON_CONFS;
let CARRY_FORWARD_QUERIES = require('../queries/carryForwardQueries.js')
var async = require('async');
const userValidations = require('../validators/uservalidator.js');
const { isLastDateExceeded, updateFarmerCode, saveFarmerBasicDetails, saveFarmerCropDetails, saveFarmerLandDetails, getActiveFarmerDetails_base } = require('../services/commonService.js');
const securityService = require('./securityservice.js');
const { foodApiAddKisan, carryForwardFoodApi } = require('./foodServices.js')
let config = require('config');
let ufp_database = config.get('ufp_db').database ?? 'ufp_2024';
let base_database = config.get('procurement_base_db').database ?? 'rgkny_2023';


let carryForward_s = {
    saveCarryForwardFarmer: function (dbkey, request, params, sessionDetails, callback) {
        let tranObj, tranCallback, basic_data = {}, inserted_lands = {}, is_paddy_maize_crop_available = false, isFoodNewKisanApiCalled = false;
        async.series([
            //check valid date
            function (cback1) {
                isLastDateExceeded(CONFIG_PARAMS.getWorkingDBDetails(), request, { type: 3 }, sessionDetails, function (err, res) {
                    if (err) {
                        return cback1(err)
                    } else {
                        // console.log(res)
                        if (res && !res['is_last_date_exceeded']) {
                            return cback1()
                        } else {
                            return cback1(securityService.SECURITY_ERRORS.LAST_DATE_EXCEEDED)
                        }
                    }
                })
            },
            
            //validate object
            function (cback11) {
                const { error, value } = userValidations.FarmerObjectValidation(params, 1);
                if (error && error.details) {
                    cback11(error.details[0].message);
                    return;
                } else {
                    return cback11();
                }
            },
            //check active farmer and make transaction
            function (cback2) {
                getActiveFarmerDetails_base(dbkey, request, {fs_id : params['basic_details']['farmer_society']['fs_id']}, sessionDetails, function (err, res) {
                    if (err) return cback2(err);
                    else {
                        basic_data.is_bhumihin_farmer = params.farmer_type == 1 ? 'Y' : 'N'
                        basic_data.entry_type = 1
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
                })


            },
            //validate and insert basic 
            function (cback3) {
                carryForward_s.saveFarmerBasicDetails_carryforward(dbkey, request, { ...params['basic_details'], basic_data }, sessionDetails, function (err, res) {
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
                // DB_SERVICE.rollbackPartialTransaction(tranObj, tranCallback, function (err4) {
                //     return callback(err, basic_data)
                // })
                DB_SERVICE.commitPartialTransaction(tranObj, tranCallback, function (err5) {
                    callback(null, basic_data);
                });
            }
        })
    },

    saveFarmerBasicDetails_carryforward: function (dbkey, request, params, sessionDetails, callback) {
        let basic_data = {}
        async.series([
            // CHECK AND INSERT DATA IN UFP_TABLE
            function (cback4) {
                carryForward_s.saveCarryForwardFarmer_ufp24(dbkey, request, params['mas_farmer'], sessionDetails, function (err, res) {
                    if (err) return cback4(err)
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

    //check and insert data in ufp2024
    saveCarryForwardFarmer_ufp24: function (dbkey, request, params, sessionDetails, callback) {
        let isFarmerExist = false, isFarmerExistInMap = false;;
        async.series([
            function (cback1) {
                params['ip_address'] = sessionDetails.ip_address;
                params['user_id'] = sessionDetails.user_id;
                params['pincode'] = params['pincode'] == '' ? null : params['pincode']
                const { value, error } = userValidations.masFarmerValidation(params, 1);
                if (error) {
                    cback1(`in mas_farmer :- ${error.details[0].message}`);
                    return;
                } else {
                    params = value;
                    return cback1();
                }

            },
            function (cback0) {
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
                        cback0(e);
                        return;
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
            return callback(null, res)
        })
    },

    updateStatusForCarryForward: function (dbkey, old_land_data, inserted_land_arr, params, sessionDetails, callback) {
        let { uf_id, fs_id, farmer_code, old_fs_id, is_bhumihin_farmer } = params;
        // console.log(inserted_land_arr);
        let updateObj = {}, whereObj = {}, queryParamObj = {}
        async.series([
            //update into farmer society
            function (c1) {
                updateObj = { "carry_forward_status": 'C' };
                whereObj = { "uf_id": uf_id, "fs_id": fs_id };
                queryParamObj = DB_SERVICE.getUpdateQueryAndparams(updateObj, whereObj, base_database + '.farmer_society');
                DB_SERVICE.executeQueryWithParameters(dbkey, queryParamObj.query, queryParamObj.params, function (err41, res41) {
                    if (err41) {
                        return c1(err41);
                    }
                    else if (res41.data["affectedRows"] == 1) {
                        return c1(null)
                    } else {
                        return c1({ message: `carry_forward_status update unSuccessFull in Farmer Society for fs_id ${fs_id}.`, errno: 4444 })
                    }
                })
            },
            //update into land_details
            function (c2) {
                if (old_land_data.length > 0) {
                    async.eachSeries(old_land_data, function (land_row, cb) {
                        const isExists = inserted_land_arr['rg_lands'].find(insert_land_row => insert_land_row.village_code == land_row.village_code && insert_land_row.khasra_no == land_row.khasra_no);
                        if (!isExists && (land_row.is_verified == "A" || land_row.is_verified == "P")) {
                            land_row.is_verified = 'D'
                        }
                        updateObj = { "carry_forward_status": land_row.is_verified };
                        whereObj = {
                            "village_code": land_row.village_code, "khasra_no": land_row.khasra_no, "fs_id": fs_id
                        };
                        queryParamObj = DB_SERVICE.getUpdateQueryAndparams(updateObj, whereObj, base_database + '.land_details');
                        DB_SERVICE.executeQueryWithParameters(dbkey, queryParamObj.query, queryParamObj.params, function (err41, res41) {
                            if (err41) {
                                return cb(err41);
                            }
                            else if (res41.data["affectedRows"] > 0) {
                                return cb(null)
                            } else {
                                return cb({ message: `carry_forward_status update unSuccessFull in land Details for village_code ${land_row.village_code} and khasra_no ${land_row.khasra_no}.`, errno: 4444 })
                            }
                        })
                    }, function (err, res) {
                        return c2(err, res)
                    })
                } else {
                    return c2(null)
                }
            },
            function (c3) {
                if (is_bhumihin_farmer == 'Y') {
                    updateObj = { "carry_forward_status": 'D' };
                    whereObj = { "fs_id": fs_id };
                    queryParamObj = DB_SERVICE.getUpdateQueryAndparams(updateObj, whereObj, base_database + '.land_details');
                    DB_SERVICE.executeQueryWithParameters(dbkey, queryParamObj.query, queryParamObj.params, function (err41, res41) {
                        if (err41) {
                            return c3(err41);
                        }
                        else if (res41.data) {
                            return c3(null)
                        } else {
                            return c3({ message: `carry_forward_status update unSuccessFull in land Details for fsid ${fs_id}.`, errno: 4444 })
                        }
                    })
                } else {
                    return c3(null)
                }
            },
            // update flag in permission table
            // function (cback31) {
            //     updateFlagInCarryForwardPermissionTable(dbkey, '', { 'uf_id': uf_id, user_id: sessionDetails.user_id }, sessionDetails, function (err, res) {
            //         if (err) {
            //             cback31(err);
            //         }
            //         else {
            //             cback31(null, res);
            //         }
            //     })
            // },
        ], function (err, res) {
            return callback(err, res)

        })
    },

}

module.exports = carryForward_s