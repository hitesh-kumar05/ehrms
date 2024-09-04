var DB_SERVICE = global.DB_SERVICE;
var CONFIG_PARAMS = global.COMMON_CONFS;
let CARRY_FORWARD_QUERIES = require('../queries/carryForwardQueries.js')
var async = require('async');
const userValidations = require('../validators/uservalidator.js');
const { isLastDateExceeded } = require('../services/commonService.js');
const securityService = require('./securityservice.js');
const ufp_base_database = 'ufp_2023'

let aadhar_null_entry_s = {
    aadharNullFarmerEntry: function (dbkey, request, params, sessionDetails, callback) {
        let tranObj, tranCallback, basic_data = {}, insert_obj = { mas_farmer: {}, farmer_society: {} };
        dbkey = CONFIG_PARAMS.getWorkingBaseDBDetails()
        async.series([
            //check valid date
            function (cback1) {
                isLastDateExceeded(dbkey, request, { type: 3 }, sessionDetails, function (err, res) {
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
            function (cback11) {
                const { error, value } = userValidations.AadharNullFarmerObjectValidation(params);
                if (error && error.details) {
                    cback11(error.details[0].message);
                    return;
                } else {
                    return cback11();
                }
            },
            //check farmer in aadhar null table and make transaction
            function (cback2) {
                aadhar_null_entry_s.getAadharNullFarmerDetails_base(dbkey, request, { farmer_code: params['farmer_code'] }, sessionDetails, function (err, res) {
                    if (err) return cback2(err);
                    else {
                        basic_data = {...res};
                        DB_SERVICE.createTransaction(dbkey, function (err, tranobj, trancallback) {
                            tranObj = tranobj;
                            tranCallback = trancallback;
                            dbkey = { dbkey: dbkey, connectionobj: tranObj };
                            return cback2(err);
                        })
                    }
                })
            },
            // create object and insert into ufp-23 and rgkny-23
            function (cback3) {
                insert_obj['mas_farmer'] = {
                    uf_id: basic_data['FarmerAgrID'],
                    aadhar_number: params['aadhar_number'],
                    aadhar_ref: params['aadhar_ref'],
                    aadhar_verification: null,
                    farmer_name_aadhar: params['farmer_name_aadhar'],
                    farmer_name_hi: basic_data['FarmerName'],
                    relation: params['Relation'] == 'पिता' ? 'F' : 'H',
                    father_name: basic_data['Father_HusbandName'],
                    dob: params['dob'],
                    subcaste_code: params['SubCaste'],
                    gender: basic_data['Sex'] == 'महिला' ? 'F' : 'M',
                    mobile_no: params['mobile_no'],
                    village_code: params['village_code'],
                    address: params['address'],
                    pincode: params['pincode'],
                    user_id: sessionDetails['user_id'],
                    operation_id: 7,
                    ip_address: sessionDetails['ip_address']
                };
                insert_obj['farmer_society'] = {
                    uf_id: basic_data['FarmerAgrID'],
                    society_id: basic_data['society_id'],
                    farmer_code: basic_data['FarmerCode'],
                    membership_no: null,
                    village_code: basic_data['NewVLocationCode'],
                    village_id: basic_data['NewVLocationCode'],
                    branch_code: basic_data['BranchName'],
                    ifsc_code: basic_data['IFSCCode'],
                    account_no: basic_data['AccountNo'],
                    pfms_flag: basic_data['PFMS_Flag'],
                    entry_type_code: 7,
                    old_fs_id: basic_data['old_fs_id'],
                    user_id: sessionDetails['user_id'],
                    operation_id: 1,
                    ip_address: sessionDetails['ip_address']
                };
                const { error, value } = userValidations.masFarmerValidation(insert_obj['mas_farmer']);
                if (error && error.details) {
                    return cback3(error.details[0].message);
                } else {
                    insert_obj['mas_farmer'] = value
                    return cback3();
                }
            },
            //if uf-id not found then insert into ufp mas_farmer and get uf_id
            function (cback4) {
                console.log(basic_data['FarmerAgrID']);
                if (!basic_data['FarmerAgrID']) {
                    qAndP = DB_SERVICE.getInsertClauseWithParams(insert_obj['mas_farmer'], ufp_base_database + '.mas_farmer');
                    DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
                        if (r1 && r1.data) {
                            basic_data['FarmerAgrID'] = r1.data['insertId']
                            insert_obj['mas_farmer']['uf_id'] = basic_data['FarmerAgrID']
                            return cback4();
                        } else {
                            return cback4(e1);
                        }
                    })
                } else {
                    return cback4();
                }
            },
            // insert into rgkny mas farmer
            function (cback5) {
                if (!insert_obj['mas_farmer']['uf_id']) return cback5({ message: 'uf_id not found while inserting in rgkny 2023 mas_farmer.' })
                qAndP = DB_SERVICE.getInsertClauseWithParams(insert_obj['mas_farmer'], 'mas_farmer');
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
                    if (r1 && r1.data) {
                        return cback5();
                    } else {
                        return cback5(e1);
                    }
                })
            },
            // insert into ufp farmer_society
            function (cback6) {
                const { error, value } = userValidations.farmerSocietyBaseValidation(insert_obj['farmer_society']);
                if (error && error.details) {
                    return cback6(error.details[0].message);
                } else {
                    insert_obj['farmer_society'] = value
                    qAndP = DB_SERVICE.getInsertClauseWithParams(insert_obj['farmer_society'], ufp_base_database + '.farmer_society');
                    DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
                        if (r1 && r1.data) {
                            basic_data['fs_id'] = r1.data['insertId']
                            insert_obj['farmer_society']['fs_id'] = basic_data['fs_id']
                            return cback6();
                        } else {
                            return cback6(e1);
                        }
                    })
                }
            },
            // insert into ufp farmer_society
            function (cback7) {
                if (!insert_obj['farmer_society']['fs_id']) return cback7({ message: 'fs_id not found while inserting in rgkny 2023 farmer society.' })
                qAndP = DB_SERVICE.getInsertClauseWithParams(insert_obj['farmer_society'], 'farmer_society');
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
                    if (r1 && r1.data) {
                        return cback7();
                    } else {
                        return cback7(e1);
                    }
                })
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
    getAadharNullFarmerDetails_base: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.farmer_code)) {
            return callback({ ...securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING, 'message': 'farmer_code is missing.' });
        }
        let qAndPObj = {
            query: `select * from farmer_reg_aadhar_null f
                    WHERE f.FarmerCode = "${params.farmer_code}"`, params: []
        }
        DB_SERVICE.executeQueryWithParameters(CONFIG_PARAMS.getWorkingBaseDBDetails(), qAndPObj.query, qAndPObj.params, function (err41, res41) {
            if (err41) {
                return callback(err41);
            }
            else {
                if (res41.data && res41.data.length > 0) {
                    return callback(null, res41.data[0]);
                } else {
                    return callback({ message: `farmer_code ${params.farmer_code} not found while checking in aadhar null table` });
                }

            }
        })
    }
}

module.exports = aadhar_null_entry_s