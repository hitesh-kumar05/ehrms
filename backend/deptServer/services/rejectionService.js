
var DB_SERVICE = global.DB_SERVICE;
var CONFIG_PARAMS = global.COMMON_CONFS;
var async = require('async');
const userValidations = require('../validators/uservalidator.js');
const { isLastDateExceeded, insrtAndDltOperation, insrtAndUpdtOperation } = require('./commonService.js');
const securityService = require('./securityservice.js');
const { rejectFarmerOnFoodDept } = require('./foodServices.js')
let config = require('config');
let path = require("path");
let ufp_database = config.get('ufp_db').database ?? 'ufp_2024';
let base_database = config.get('procurement_base_db').database ?? 'rgkny_2023';


let deleteFarmer = {
    farmerRejectionByFsId: function (dbkey, request, params, sessionDetails, callback) {
        let tranObj, tranCallback, basic_data = {}, qAndP = {}, isSingleFsFarmer = false, active_fs_data = [], file_path = '';
        async.series([
            //check valid date
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
            //validate object
            function (cback2) {
                params.user_id = sessionDetails['user_id']
                params.ip_address = sessionDetails['ip_address']
                const { error, value } = userValidations.DeleteFarmerObjectValidation(params);
                if (error && error.details) {
                    return cback2(error.details[0].message);
                    ;
                } else {
                    params.letter_date = new Date(params.letter_date)
                    return cback2();
                }
            },
            // check farmer status
            function (cback3) {
                q = `select * from farmer_society fs where fs.uf_id = ${params.uf_id}`
                DB_SERVICE.executeQueryWithParameters(dbkey, q, [], function (err, res) {
                    if (err) {
                        return cback3(err);
                    }
                    else if (res.data && res.data.length > 0) {
                        active_fs_data = res.data.filter((e) => {
                            return (e.operation_id !== 3 && e.operation_id !== 5)
                        })
                        basic_data = active_fs_data.filter(e => {
                            return e.fs_id == params['fs_id']
                        })
                        if (basic_data.length == 0) {
                            return cback3({ message: `farmer fs_id-${params.fs_id} is not active in farmer_society` })
                        }
                        basic_data = basic_data[0]
                        isSingleFsFarmer = active_fs_data.length == 1
                        return cback3()
                    }
                    else {
                        return cback3()
                    }
                })
            },
            //make transcation
            function (cback4) {
                DB_SERVICE.createTransaction(dbkey, function (err, tranobj, trancallback) {
                    tranObj = tranobj;
                    tranCallback = trancallback;
                    dbkey = { dbkey: dbkey, connectionobj: tranObj };
                    return cback4(err);
                })
            },
            function (cback5) {
                async.parallel([
                    // if farmer exists in old(base) database then mark deleted in farmer society and land details
                    function (cback51) {
                        // check basic data is empty
                        if (Object.getOwnPropertyNames(basic_data).length === 0) {
                            deleteFarmer.rejectFarmerOnOldDB(dbkey, request, params, sessionDetails, function (err, res) {
                                if (err) {
                                    return cback51(err);
                                }
                                else {
                                    return cback51();
                                }
                            })

                        } else {
                            return cback51()
                        }
                    },
                    // if farmer in current database then mark in farmer society and delete farmer_representative, crop and land
                    function (cback52) {
                        //check basic data length to check farmer exists in current database
                        if (Object.getOwnPropertyNames(basic_data).length !== 0) {
                            deleteFarmer.rejectFarmerOnCurrentDB(dbkey, request, { uf_id: basic_data['uf_id'], fs_id: basic_data['fs_id'] }, sessionDetails, function (err, res) {
                                if (err) {
                                    return cback52(err);
                                }
                                else {
                                    return cback52();
                                }
                            })
                        } else {
                            return cback52()
                        }
                    },

                    //if farmer is single fs farmer then delete from farmer_scheme map table
                    function (cback53) {
                        if (isSingleFsFarmer) {
                            insrtAndDltOperation(dbkey, request, { log_table_name: ufp_database + '.app_log_farmer_scheme_mapping', delete_table_name: ufp_database + '.farmer_scheme_mapping', whereObj: { uf_id: params['uf_id'] } }, sessionDetails, function (err, res) {
                                if (err) {
                                    return cback53(err);
                                }
                                else {
                                    return cback53(null);
                                }
                            })
                        } else {
                            return cback53()
                        }

                    },
                    // doc upload
                    function (cback54) {
                        deleteFarmer.docUploadForFarmerRejection(dbkey, request, params, sessionDetails, function (err, res) {
                            if (err) {
                                return cback54(err);
                            }
                            else {
                                file_path = res['file_path']
                                return cback54();
                            }
                        })
                    }
                ], function (err, res) {
                    return cback5(err, res)
                })
            },
            // update in farmer rejected doc table
            function (cback6) {
                if (file_path == '') return cback6({ message: `file path can not be empty` })
                qAndParam = DB_SERVICE.getUpdateQueryAndparams({ "reason": params.remark, "filepath": file_path, "delete_letter_no": params.letter_no, "delete_letter_date": params.letter_date, "farmer_rejected_user_id": params.user_id, "farmer_rejected_dtstamp": new Date(), "farmer_rejected_ip_address": params.ip_address }, { "fs_id": params.fs_id }, 'farmer_rejected_docs');
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
                    if (e1) {
                        return cback6(e1);
                    }
                    else {
                        return cback6();
                    }
                })
            },
            // call food api
            function (cback7) {
                if (params.farmer_code && params.farmer_code.length == 15) {
                    rejectFarmerOnFoodDept(dbkey, request, params, sessionDetails, function (err, res) {
                        if (err) {
                            return cback7(err)
                        }
                        else {
                            return cback7();
                        }
                    })
                } else {
                    return cback7();
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
                //     return callback(err, { "success": true, "code": `FARMER_REJECTED` })
                // })
                DB_SERVICE.commitPartialTransaction(tranObj, tranCallback, function (err5) {
                    callback(null, { "success": true, "code": `FARMER_REJECTED` });
                });
            }
        })
    },

    farmerRejectionByFsId_: function (dbkey, request, params, sessionDetails, callback) {
        let workingBaseDBKey = CONFIG_PARAMS.getWorkingBaseDBDetails();
        let workingDBKey = CONFIG_PARAMS.getWorkingDBDetails();

        let fs_id = +params["fs_id"], is_fs_id_carry_forwarded = false;
        let reason = params["remark"];
        let farmer_code = params["farmer_code"];
        let letter_no = params["letter_no"],
            letter_date = params["letter_date"];
        let village_code = params['village_code'], society_id = params['society_id']
        console.log(village_code, society_id);
        params["letter_date"] = new Date(params["letter_date"]);
        let tranObj1, tranCallback1, tranObj2, tranCallback2, land_details_data = [];
        // console.log(workingBaseDBKey, workingDBKey, 'DBKEYS', reason);
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
                if (fs_id, reason, letter_no, letter_date) {
                    DB_SERVICE.createTransaction(workingBaseDBKey, function (err, tranobj, trancallback) {
                        tranObj1 = tranobj;
                        tranCallback1 = trancallback;
                        workingBaseDBKey = { workingBaseDBKey: workingBaseDBKey, connectionobj: tranObj1 };
                        cback1(err);
                    })
                } else {
                    return cback1({ 'message': `Fs_id & Reason & letter_no & letter_date is Required` });
                }
            },
            function (cback2) {
                DB_SERVICE.createTransaction(workingDBKey, function (err, tranobj, trancallback) {
                    tranObj2 = tranobj;
                    tranCallback2 = trancallback;
                    workingDBKey = { workingDBKey: workingDBKey, connectionobj: tranObj2 };
                    cback2(err);
                })
            },
            function (cback3) {
                deleteFarmer.rejectFarmerOnOldDB(workingBaseDBKey, request, params, sessionDetails, function (e, is_farmer_already_carryForwarded) {
                    if (e) {
                        return cback3(e);
                    }
                    else {
                        console.log('flag', is_farmer_already_carryForwarded);
                        // is_fs_id_carry_forwarded = is_farmer_already_carryForwarded;
                        return cback3();
                    }
                })
            },
            function (cback33) {
                let q = `SELECT fs.fs_id FROM farmer_society fs WHERE fs.old_fs_id = ?`;
                DB_SERVICE.executeQueryWithParameters(workingDBKey, q, [fs_id], function (e2, r2) {
                    // console.log(r2, "RES2");
                    if (e2) {
                        return cback33(e2);
                    }
                    else if (r2.data && r2.data.length > 0) {
                        is_fs_id_carry_forwarded = true;
                        return cback33();
                    }
                    else {
                        is_fs_id_carry_forwarded = false;
                        return cback33();
                    }
                })
            },
            //if farmer is already carry Forwareded Then delete Record From UFP_2023 and RGKNY_2023
            function (cback4) {
                if (is_fs_id_carry_forwarded) {
                    rejectFarmerOnUFP2023(workingDBKey, request, params, sessionDetails, function (err, res) {
                        if (err) {
                            return cback4(err);
                        }
                        else {
                            land_details_data = res;
                            return cback4();
                        }
                    })
                } else {
                    return cback4();
                }
            },
            function (cback21) {
                if (land_details_data.length > 0) {
                    async.eachSeries(land_details_data, function (land_row, cb) {
                        updateObj = { "carry_forward_status": "D" };
                        whereObj = { "village_code": land_row.village_code, "khasra_no": land_row.khasra_no };
                        let queryParamObj = DB_SERVICE.getUpdateQueryAndparams(updateObj, whereObj, 'land_details');
                        DB_SERVICE.executeQueryWithParameters(workingBaseDBKey, queryParamObj.query, queryParamObj.params, function (err41, res41) {
                            if (err41) {
                                return cb(err41);
                            }
                            else if (res41.data["affectedRows"] == 0 || res41.data["affectedRows"] == 1) {
                                return cb(null);
                            }
                            else {
                                return cb({ message: `carry_forward_status update unSuccessFull in land Details for village_code ${land_row.VillageCensus} and khasra_no  ${land_row.Khasra_No}.`, errno: 4444 })
                            }
                        })
                    }, function (err, res) {
                        return cback21(err, res)
                    })
                }
                else {
                    return cback21()
                }
            },
            // call Food Api
            function (cback5) {
                // console.log('FARmerCode', farmer_code);
                if (farmer_code && farmer_code.length == 15) {
                    //console.log('FARmerCode Next', farmer_code);
                    rejectFarmerOnFoodDept(dbkey, request, params, sessionDetails, function (err, res) {
                        if (err) {
                            return cback5(err)
                        }
                        else {
                            return cback5();
                        }
                    })
                } else {
                    return cback5();
                }
            },
            function (cback22) {
                docUploadForFarmerRejection(workingBaseDBKey, request, params, sessionDetails, function (err, res) {
                    if (err) {
                        return cback22(err);
                    }
                    else {
                        return cback22();
                    }
                })
            },
        ], function (err, res) {
            if (err) {
                DB_SERVICE.rollbackPartialTransaction(tranObj1, tranCallback1, function (err4) {
                    DB_SERVICE.rollbackPartialTransaction(tranObj2, tranCallback2, function (err5) {
                        return callback(err);
                    })
                })
            }
            else {
                DB_SERVICE.commitPartialTransaction(tranObj1, tranCallback1, function (err5) {
                    DB_SERVICE.commitPartialTransaction(tranObj2, tranCallback2, function (err5) {
                        updateRGKNYReportTableByVillageCode(village_code, society_id, function (err, res) {
                            console.log('updateRGKNYReportTableByVillageCode', err, res)
                            if (err) {
                                err_for_report_table(society_id, village_code, 'updateRGKNYReportTableByVillageCode', err, sessionDetails)
                            }
                        })
                        updateReportTableByVillageCode(village_code, society_id, function (err, res) {
                            console.log('updateReportTableByVillageCode', err, res)
                            if (err) {
                                err_for_report_table(society_id, village_code, 'updateReportTableByVillageCode', err, sessionDetails)
                            }
                        })
                        return callback(null, { "success": true, "code": `FARMER_REJECTED` });
                    });
                });
            }
        })
    },

    // rejectFarmerOnOldDB
    rejectFarmerOnOldDB: function (dbkey, request, params, sessionDetails, callback) {
        let fs_id = +params["fs_id"], qAndParam = {};
        async.parallel([
            //UPDATE land details
            function (cback1) {
                qAndParam = DB_SERVICE.getUpdateQueryAndparams({ "carry_forward_status": 'D' }, { "fs_id": fs_id }, base_database + '.land_details');
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
                    if (e1) {
                        return cback1(e1);
                    }
                    else {
                        return cback1();
                    }
                })
            },
            //UPDATE FARMER Society
            function (cback2) {
                qAndParam = DB_SERVICE.getUpdateQueryAndparams({ "delete_status": 'D' }, { "fs_id": fs_id }, base_database + '.farmer_society');
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
                    if (e1) {
                        return cback2(e1);
                    }
                    else if (r1.data["affectedRows"] == 1) {
                        return cback2();
                    }
                    else {
                        return cback2({ "message": `Multiple OR Zero Rows Updated In base Farmer Society` });
                    }
                })
            }
        ], function (err, res) {
            if (err) {
                return callback(err);
            }
            else {
                return callback(null);
            }
        })
    },
    // rejectFarmerOnCurrentDB
    rejectFarmerOnCurrentDB: function (dbkey, request, params, sessionDetails, callback) {

        if (!(params.fs_id && params.uf_id)) return callback({ ...securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING, 'message': 'in rejectFarmerOnCurrentDB MANDATORY_FIELDS_ARE_MISSING' });
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
                //send update-type = 6 for sansodhan_TYPE in app log for delete optration 
                let updateObj = { 'operation_id': 3, 'total_crop_area': 0, 'total_paddy_area': 0, 'total_land_area': 0, 'updated_user_id': sessionDetails['user_id'], 'updated_ip_address': sessionDetails['ip_address'] }
                insrtAndUpdtOperation(dbkey, request, { log_table_name: 'app_log_farmer_society', update_table_name: 'farmer_society', whereObj: { fs_id: params['fs_id'] }, updateObj: updateObj, update_type: 6 }, sessionDetails, function (err, res) {
                    if (err) {
                        return cback4(err);
                    }
                    else {
                        return cback4(null);
                    }
                })
            },
        ], function (err, res) {
            return callback(err, res);
        })
    },
    // need to change
    docUploadForFarmerRejection: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params && params.fs_id)) {
            return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING)
        }
        let fs_id = +params["fs_id"];
        let file_path = ``;
        const allowedExtension = ['.pdf'];
        async.series([
            function (cback1) {
                if (!request.files) {
                    return cback1({ message: `No files Found to upload.` });
                }
                else {
                    const file = request.files.file;
                    const extensionName = path.extname(file.name);

                    if (!allowedExtension.includes(extensionName)) {
                        return cback1({ "message": "Not a PDF File", "code": "INVALID_FILE" });
                    }

                    let filename = `${fs_id}.pdf`;
                    file_path = path.join(__dirname, '../farmer_rejected_docs', filename);
                    file.mv(path.join(__dirname, '../farmer_rejected_docs', filename), function (err1, res1) {
                        if (err1) {
                            return cback1(err1);
                        }
                        else {
                            return cback1();
                        }
                    })
                }
            }
        ], function (err, res) {
            if (err) {
                return callback(err);
            }
            else {
                return callback(null, { file_path: file_path });
            }
        })
    }
}


module.exports = deleteFarmer