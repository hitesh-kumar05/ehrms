let DB_SERVICE = global.DB_SERVICE;
let CONFIG_PARAMS = global.COMMON_CONFS;
const securityService = require('./securityservice.js');
const userValidations = require('../validators/uservalidator.js');
const COMMON_QUERIES = require('../queries/commonQueries.js');
let CARRY_FORWARD_QUERIES = require('../queries/carryForwardQueries.js');
let async = require('async');
let config = require('config');
let base_database = config.get('procurement_base_db').database ?? 'rgkny_2023';

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
    getLastFourDigits: function (number) {
        const numString = number.toString();
        const lastFourDigits = numString.substr(-4);
        return lastFourDigits;
    },
    saveFarmerBasicDetails: function (dbkey, request, params, sessionDetails, callback) {
        const { value, error } = userValidations.basicDetailsObjectValidation(params);
        if (error) {
            callback(`in basic_details :- ${error.details[0].message}`);
            return;
        }
        let { mas_farmer, farmer_society, farmer_representative, basic_data } = value
        let { total_crop_area, total_land_area, total_paddy_area, entry_type, is_bhumihin_farmer } = basic_data
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
                    const { value, error } = userValidations.masFarmerValidation(mas_farmer, entry_type);
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
                farmer_society['is_bhumihin_farmer'] = is_bhumihin_farmer ?? 'N'
                const { value, error } = userValidations.farmerSocietyValidation(farmer_society, entry_type);
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
            },
            //check validation for reprensentative_list
            function (cback3) {
                if (farmer_representative['AadharNo']) {
                    farmer_representative['uf_id'] = mas_farmer['uf_id'];
                    farmer_representative['fs_id'] = farmer_society['fs_id'];
                    farmer_representative['FourDigit'] = common_s.getLastFourDigits(farmer_representative['AadharNo']);
                    farmer_representative['IPAddress'] = sessionDetails.ip_address;
                    farmer_representative['Opration'] = "INSERT";
                    farmer_representative['aadhar_ref'] = farmer_representative['nominee_aadhar_ref'];
                    farmer_representative['FarmerCode'] = farmer_society['farmer_code'] ?? null;
                    const { value, error } = userValidations.farmerReprenstativeValidation(farmer_representative, entry_type);
                    if (error) {
                        return cback3({ message: `in farmerReprenstativeValidation :- ${error.details[0].message}`, errno: 1001, uf_id: mas_farmer['uf_id'] });
                    } else {
                        farmer_representative = value;
                        return cback3();
                    }
                } else {
                    return cback3({ 'message': 'reprensentative aadhar is null' });
                }

            },

            //inserted in farmerrepresentative
            function (cback5) {
                qAndP = DB_SERVICE.getInsertClauseWithParams(farmer_representative, 'farmerrepresentative');
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e1, r1) {
                    if (r1 && r1.data) {
                        cback5();
                        return;
                    } else {
                        cback5(e1);
                        return;
                    }
                })
            }
        ], function (err, res) {
            return callback(err, { "uf_id": mas_farmer['uf_id'], "fs_id": farmer_society['fs_id'], "old_fs_id": farmer_society['old_fs_id'] ?? null, "farmer_code": farmer_society['farmer_code'] ?? null, "society_id": farmer_society['society_id'], "entry_type": entry_type })
        })
    },
    saveFarmerLandDetails: function (dbkey, basic_data, params, sessionDetails, callback) {
        if (!(params.land_details && params.forest_land_details)) {
            return callback({ ...securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING, 'message': 'field land_details or forest_land_details is missing.' });
        }
        let qAndP;
        let { uf_id, fs_id, old_fs_id = null, farmer_code = null, society_id, entry_type, is_bhumihin_farmer } = basic_data;
        let { ip_address, user_id } = sessionDetails;
        let inserted_rg_land_details_arr = [], inserted_forest_land_details_arr = [];
        let rg_landDetail_data = params['land_details'];
        let forest_landDetail_data = params['forest_land_details'];
        let land_obj = {}, land_obj_extraa;
        if (is_bhumihin_farmer === 'Y' && (rg_landDetail_data.length > 0 || forest_landDetail_data.length > 0)) {
            return callback({ message: `farmer has is_bhumihin flag ${is_bhumihin_farmer} and have land_details length ${rg_landDetail_data.length} or forest land details length ${forest_landDetail_data.length}` })
        }
        async.series([
            //rg land insert
            function (cback01) {
                async.eachSeries(rg_landDetail_data, function (data, cb) {
                    async.series([
                        //check validation
                        function (cback1) {
                            const { error, value } = userValidations.bhuiyanLandDataValidation(data, entry_type);
                            if (error) {
                                return cback1({ message: `in bhuiyanLandDataValidation :- ${error.details[0].message}`, errno: 1001, uf_id: uf_id });
                            } else {
                                let { flag_varis_land, VillageCensus, SinchitArea = 0, ASinchitArea = 0, IrrigationSorce_GovtWell = 0, IrrigationSorce_PvtWell = 0, IrrigationSorce_GovtCanal = 0, IrrigationSorce_PvtCanal = 0, IrrigationSorce_GovtPond = 0, IrrigationSorce_PvtPond = 0, IrrigationSorce_GovtOther = 0, IrrigationSorce_PvtOther = 0, IrrigationSorce_GovtTubWell = 0, IrrigationSorce_PvtTubWell = 0, IrrigationSorce_GovtPumpDiesel = 0, IrrigationSorce_PvtPumpDiesel = 0, IrrigationSorce_GovtPumpElectric = 0, IrrigationSorce_PvtPumpElectric = 0, OwnerName, FatherName, loanbook, PatwariHalka, Khasra_No, Basra_No, FarmSize, OwnerType, OwnerTypeCode, LastUpdatedOn, MutationReasonId, type, VillageID, ID_MasterKey_Khasra, jodtId } = value;
                                userValidations.checkValidOwnerTypeAndName(+OwnerTypeCode, OwnerName, +MutationReasonId, +jodtId, function (err, res) {
                                    if (res == true) {
                                        land_obj = {
                                            uf_id: uf_id,
                                            fs_id: fs_id,
                                            old_fs_id: old_fs_id,
                                            farmer_code: farmer_code,
                                            village_code: VillageCensus,
                                            sinchit_asinchit: SinchitArea > 0 ? 1 : ASinchitArea > 0 || (SinchitArea == "0.0000" && ASinchitArea == "0.0000" ? 2 : 0),
                                            sichai_id: +IrrigationSorce_GovtWell > 0 || +IrrigationSorce_PvtWell > 0 ? 5 : +IrrigationSorce_GovtCanal > 0 || +IrrigationSorce_PvtCanal > 0 ? 3 : +IrrigationSorce_GovtPond > 0 || +IrrigationSorce_PvtPond > 0 ? 4 : +IrrigationSorce_GovtOther > 0 || +IrrigationSorce_PvtOther > 0 ? 9 : +IrrigationSorce_GovtTubWell > 0 || +IrrigationSorce_PvtTubWell > 0 ? 1 : IrrigationSorce_GovtWell == "" || b.IrrigationSorce_PvtWell == "" || IrrigationSorce_GovtCanal == "" || IrrigationSorce_PvtCanal == "" || IrrigationSorce_GovtPond == "" || IrrigationSorce_PvtPond == "" || IrrigationSorce_GovtPumpDiesel == "" || IrrigationSorce_PvtPumpDiesel == "" || IrrigationSorce_GovtPumpElectric == "" || IrrigationSorce_PvtPumpElectric == "" || IrrigationSorce_GovtOther == "" || IrrigationSorce_PvtOther == "" || IrrigationSorce_GovtTubWell == "" || IrrigationSorce_PvtTubWell == "" ? 0 : 0,
                                            OwnerName: OwnerName,
                                            FatherName: FatherName,
                                            booklet_no: loanbook,
                                            patwari_halka: PatwariHalka,
                                            khasra_no: Khasra_No,
                                            basra_no: Basra_No,
                                            land_area: +FarmSize,
                                            society_id: society_id,
                                            land_type_code: type == 'RG' ? 1 : 2,
                                            mutation_reason_code: +MutationReasonId,
                                            owner_type_code: +OwnerTypeCode,
                                            village_id: +VillageID,
                                            id_masterkey_khasra: +ID_MasterKey_Khasra,
                                            bhuiyanlastupdatedon: LastUpdatedOn !== "" && LastUpdatedOn !== null ? LastUpdatedOn : null,
                                            user_id: user_id,
                                            ip_address: ip_address,
                                            operation_id: 1,
                                        };
                                        if (entry_type == 6 || entry_type == 7) {
                                            land_obj['flag_varis_land'] = flag_varis_land
                                        }
                                        land_obj_extraa = {
                                            "id_masterkey_khasra": +ID_MasterKey_Khasra,
                                            "booklet_no": loanbook,
                                            "sinchit_asinchit": SinchitArea > 0 ? 1 : ASinchitArea > 0 || (SinchitArea == "0.0000" && ASinchitArea == "0.0000" ? 2 : 0),
                                            "sichai_id": +IrrigationSorce_GovtWell > 0 || +IrrigationSorce_PvtWell > 0 ? 5 : +IrrigationSorce_GovtCanal > 0 || +IrrigationSorce_PvtCanal > 0 ? 3 : +IrrigationSorce_GovtPond > 0 || +IrrigationSorce_PvtPond > 0 ? 4 : +IrrigationSorce_GovtOther > 0 || +IrrigationSorce_PvtOther > 0 ? 9 : +IrrigationSorce_GovtTubWell > 0 || +IrrigationSorce_PvtTubWell > 0 ? 1 : IrrigationSorce_GovtWell == "" || b.IrrigationSorce_PvtWell == "" || IrrigationSorce_GovtCanal == "" || IrrigationSorce_PvtCanal == "" || IrrigationSorce_GovtPond == "" || IrrigationSorce_PvtPond == "" || IrrigationSorce_GovtPumpDiesel == "" || IrrigationSorce_PvtPumpDiesel == "" || IrrigationSorce_GovtPumpElectric == "" || IrrigationSorce_PvtPumpElectric == "" || IrrigationSorce_GovtOther == "" || IrrigationSorce_PvtOther == "" || IrrigationSorce_GovtTubWell == "" || IrrigationSorce_PvtTubWell == "" ? 0 : 0, "bhuiyanlastupdatedon": LastUpdatedOn !== "" && LastUpdatedOn !== null ? LastUpdatedOn : null,
                                        }
                                        const { error, value } = userValidations.landDataValidation(land_obj, entry_type);
                                        if (error) {
                                            return cback1({
                                                'message': `in landDataValidation :- ${error.details[0].message}`, 'errno': 1001, 'uf_id': uf_id
                                            })
                                        } else {
                                            land_obj = value
                                            return cback1()
                                        }
                                    } else {
                                        return cback1({ message: `invalid owner name or type ${err}` })
                                    }
                                })
                            }
                        },
                        //insert into Procurment database
                        function (cback2) {
                            qAndP = DB_SERVICE.getInsertClauseWithParams(land_obj, 'land_details');
                            DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err, rows) {
                                if (err) {
                                    return cback2(err);
                                }
                                else if (rows.data['affectedRows'] == 1) {
                                    inserted_rg_land_details_arr.push({ ...land_obj });
                                    return cback2(null);
                                } else {
                                    return cback2({ message: `in land detail insert no record is inserted for uf_id ${uf_id}.` });
                                }
                            })
                        },
                        //insert into procurment database land_details_extra
                        function (cback20) {
                            qAndP = DB_SERVICE.getInsertClauseWithParams(land_obj_extraa, 'land_details_extra');
                            DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err, rows) {
                                if (err) {
                                    return cback20(err);
                                }
                                else {
                                    return cback20(null);
                                }
                            })
                        },
                    ], function (err, result) {
                        if (err) {
                            cb(err);
                        }
                        else {
                            cb()
                        }
                    })
                }, function (err1) {
                    if (err1) {
                        cback01(err1)
                    }
                    else {
                        cback01(null);
                    }
                })
            },
            //forest land insert
            function (cback02) {
                if (forest_landDetail_data.length > 0) {
                    let forest_land_area = (+(forest_landDetail_data.reduce((accumulator, currentValue) => accumulator + (+currentValue['area']), 0.00)).toFixed(4)) * 2.471;
                    //check area not grater area then 10
                    if (forest_land_area > 10) {
                        return cback02({ 'message': 'forest area is greater then 10 acre' })
                    } else {
                        async.eachSeries(forest_landDetail_data, function (data, cb) {
                            let { village_code, khasra_no, land_area, type, flag_varis_land } = data;
                            land_obj = {
                                uf_id: uf_id,
                                fs_id: fs_id,
                                old_fs_id: old_fs_id,
                                farmer_code: farmer_code,
                                village_code: village_code,
                                khasra_no: khasra_no,
                                land_area: land_area,
                                land_type_code: type == 'VG' ? 3 : type == 'VP' ? 2 : 4,
                                society_id: society_id,
                                operation_id: 1,
                                user_id: user_id,
                                ip_address: ip_address
                            };
                            if (entry_type == 6 || entry_type == 7) {
                                land_obj['flag_varis_land'] = flag_varis_land
                            }
                            async.series([
                                //check validation
                                function (cback020) {
                                    const { error, value } = userValidations.forestLandDataValidation(land_obj, entry_type);
                                    if (error) {
                                        return cback020({
                                            'message': `in forestLandDataValidation :- ${error.details[0].message}`, 'errno': 1001, 'uf_id': uf_id
                                        })
                                    } else {
                                        land_obj = value;
                                        return cback020();
                                    }
                                },
                                //insert into base database
                                function (cback021) {
                                    qAndP = DB_SERVICE.getInsertClauseWithParams(land_obj, 'land_details_forest');
                                    DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err, rows) {
                                        if (err) {
                                            return cback021(err);
                                        }
                                        else {
                                            land_obj['land_forest_id'] = rows.data["insertId"];
                                            inserted_forest_land_details_arr.push({ ...land_obj });
                                            return cback021(null);
                                        }
                                    })
                                },
                            ], function (err, res) {
                                return cb(err);
                            })

                        }, function (err, res) {
                            return cback02(err);
                        })
                    }
                } else {
                    return cback02();
                }
            },
        ], function (err, res) {
            return callback(err, { rg_lands: inserted_rg_land_details_arr, forest_lands: inserted_forest_land_details_arr });
        });
    },
    saveFarmerCropDetails: function (dbkey, basic_data, params, inserted_land_arr, sessionDetails, callback) {
        if (!(params.crop_details && params.forest_crop_details)) {
            return callback({ ...securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING, 'message': 'feild crop_details or forest_crop_details is missing.' });
        }
        let { uf_id, fs_id, old_fs_id = null, farmer_code = null, society_id, entry_type, is_bhumihin_farmer } = basic_data
        let { user_id, ip_address } = sessionDetails
        let rg_crop_data = [];
        let forest_crop_data = []
        let crop_obj = {};
        let checkedCropArr = [];
        let is_paddy_maize_crop_available = false;
        async.series([
            function (cback0) {
                rg_crop_data = params['crop_details'];
                forest_crop_data = params['forest_crop_details'];
                if ((rg_crop_data.length == 0 && forest_crop_data.length == 0 && is_bhumihin_farmer === 'N')) {
                    return cback0({ errno: 4001, message: 'no crop data found' })
                } else {
                    return cback0()
                }
            },
            // rg crop
            function (cback1) {
                if (rg_crop_data.length > 0) {
                    async.eachSeries(rg_crop_data, function (crop, cb) {
                        let qAndP;
                        async.series([
                            //make object for validation
                            function (cback11) {
                                let { error, value } = userValidations.cropObjectValidation(crop);
                                if (error) {
                                    cback11(error.details);
                                    return;
                                } else {

                                    let { crop_code, crop_area, village_code, khasra_no, village_id, type, status, girdawari_status } = crop;
                                    crop_obj = {
                                        "fs_id": fs_id, "uf_id": uf_id, "old_fs_id": old_fs_id, "farmer_code": farmer_code, "crop_code": crop_code, "crop_area": crop_area, "society_id": society_id, "village_code": village_code, "khasra_no": khasra_no, "operation_id": 1, "ip_address": ip_address, 'village_id': village_id, "land_type_code": type == 'RG' ? 1 : 2, girdawari_status,
                                        crop_status_code: status == 'OC' ? 1 : status == 'CC' ? 2 : status == 'PC' ? 3 : 4, "user_id": user_id
                                    };
                                    if (!is_paddy_maize_crop_available) {
                                        is_paddy_maize_crop_available = (crop_code == 104 || crop_code == 103);
                                    }
                                    return cback11()
                                }
                            },
                            //check crop area is not greater then land area and insert id_masterkey_khasra in crop obj
                            function (cback111) {
                                let checkedCrop = checkedCropArr.filter(function (e) {
                                    return (e.village_code == crop_obj.village_code && e.khasra_no == crop_obj.khasra_no)
                                })
                                if (checkedCrop.length > 0) {
                                    crop_obj['village_id'] = checkedCrop[0]['village_id'];
                                    crop_obj['id_masterkey_khasra'] = checkedCrop[0]['id_masterkey_khasra'];
                                    return cback111()
                                }
                                // get crop details for same village and khasra number
                                let cropArrInKhasra = rg_crop_data.filter(function (e) {
                                    return (e.village_code == crop_obj.village_code && e.khasra_no == crop_obj.khasra_no)
                                })


                                //calculate summed area of crop
                                let sum_area = +(cropArrInKhasra.reduce((accumulator, currentValue) => accumulator + (+currentValue['crop_area']), 0.00)).toFixed(4);

                                // get area from land details
                                let land_data = inserted_land_arr['rg_lands'].filter(function (e) {
                                    return (e.village_code == crop_obj.village_code && e.khasra_no == crop_obj.khasra_no)
                                });


                                if (land_data.length == 0) {
                                    return cback111({ message: `land not found for crop in khasra ${crop_obj.khasra_no} and village ${crop_obj.village_code} ` })
                                }
                                //if summed crop area is greater then land area
                                if (land_data[0]['land_area'] < sum_area) {
                                    return cback111({ 'message': `crop area is grater then land area for khasra ${crop_obj.khasra_no} and village code ${crop_obj.village_code} ` })
                                } else {
                                    //crop_obj['village_id'] = land_data['village_id'];
                                    crop_obj['village_id'] = land_data[0]['village_id'];
                                    crop_obj['id_masterkey_khasra'] = land_data[0]['id_masterkey_khasra'];
                                    checkedCropArr.push({ ...crop_obj })
                                    return cback111()
                                }
                            },
                            // check validation 
                            function (cback112) {
                                const { error, value } = userValidations.cropDataValidation(crop_obj, entry_type);
                                if (error) {
                                    return cback112({
                                        'message': `in cropDataValidation_carryForward :- ${error.details[0].message}`, 'errno': 1001, 'uf_id': uf_id
                                    })
                                    // return cback112(error.details)
                                } else {
                                    crop_obj = value
                                    return cback112()
                                }
                            },
                            //insert base
                            function (cback12) {
                                qAndP = DB_SERVICE.getInsertClauseWithParams(crop_obj, 'crop_details');
                                DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err, rows) {
                                    if (err) {
                                        // errResponse.push({ khasra_no: Khasra_No })
                                        cback12(err);
                                    }
                                    else {
                                        crop_obj['crop_id'] = rows.data["insertId"]
                                        cback12(null, rows);
                                    }
                                })
                            }
                        ], function (err, res) {
                            if (err) {
                                cb(err);
                            }
                            else {
                                cb();
                            }
                        })
                    },
                        function (err1) {
                            if (err1) {
                                cback1(err1);
                            }
                            else {
                                cback1(null);
                            }
                        })
                } else {
                    return cback1()
                }
            },
            //forest crop
            function (cback2) {
                if (forest_crop_data.length > 0) {
                    checkedCropArr = [];
                    async.eachSeries(forest_crop_data, function (crop, cb) {
                        let qAndP;
                        async.series([
                            //make object for validation
                            function (cback21) {
                                let { error, value } = userValidations.cropObjectValidation(crop);
                                if (error) {
                                    cback21(error.details);
                                    return;
                                } else {
                                    let { crop_code, crop_area, village_code, khasra_no, type, status } = crop;
                                    crop_obj = {
                                        "fs_id": fs_id, "uf_id": uf_id, "old_fs_id": old_fs_id, farmer_code,
                                        "crop_code": crop_code, "crop_area": crop_area, "society_id": society_id,
                                        "village_code": village_code, "khasra_no": khasra_no, "operation_id": 1,
                                        "ip_address": ip_address,
                                        "land_type_code": type == 'VG' ? 3 : type == 'VP' ? 2 : 4,
                                        crop_status_code: status == 'OC' ? 1 : status == 'CC' ? 2 : status == 'PC' ? 3 : 4,
                                        "user_id": user_id
                                    };
                                    if (!is_paddy_maize_crop_available) {
                                        is_paddy_maize_crop_available = (crop_code == 104 || crop_code == 103);
                                    }
                                    return cback21()
                                }
                            },
                            ///check crop area is not greater then land area and insert land_forest_id in crop obj
                            function (cback211) {
                                let checkedCrop = checkedCropArr.filter(function (e) {
                                    return (e.village_code == crop.village_code && e.khasra_no == crop.khasra_no)
                                })
                                if (checkedCrop.length > 0) {
                                    crop_obj['land_forest_id'] = checkedCrop[0]['land_forest_id'];
                                    return cback211();
                                }
                                // get crop details for same village and khasra number
                                let cropArrInKhasra = forest_crop_data.filter(function (e) {
                                    return (e.village_code == crop.village_code && e.khasra_no == crop.khasra_no)
                                })

                                //calculate summed area of crop
                                let sum_area = +(cropArrInKhasra.reduce((accumulator, currentValue) => accumulator + (+currentValue['crop_area']), 0.00)).toFixed(4);

                                // get area from land details
                                let land_data = inserted_land_arr['forest_lands'].filter(function (e) {
                                    return (e.village_code == crop.village_code && e.khasra_no == crop.khasra_no)
                                });

                                if (land_data.length == 0) {
                                    return cback211({ message: `land not found for crop forest in khasra ${crop.khasra_no} and village ${crop.village_code} ` })
                                }
                                //if summed crop area is greater then land area
                                if (land_data[0]['land_area'] < sum_area) {
                                    return cback211({ 'message': `forest crop area is grater then land area for khasra ${crop.khasra_no} and village code ${crop.village_code} ` })
                                } else {
                                    crop_obj['land_forest_id'] = land_data[0]['land_forest_id'];
                                    checkedCropArr.push({ ...crop_obj })
                                    return cback211();
                                }
                            },
                            // check validation 
                            function (cback112) {
                                const { error, value } = userValidations.forestCropDataValidation(crop_obj, entry_type);
                                if (error) {
                                    return cback112({
                                        'message': `in forestCropDataValidation_carryForward :- ${error.details[0].message}`, 'errno': 1001, 'uf_id': uf_id
                                    })
                                } else {
                                    crop_obj = value
                                    return cback112()
                                }
                            },
                            //insert base
                            function (cback22) {
                                qAndP = DB_SERVICE.getInsertClauseWithParams(crop_obj, 'crop_details_forest');
                                DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err, rows) {
                                    if (err) {
                                        return cback22(err);
                                    }
                                    else {
                                        crop_obj['crop_forest_id'] = rows.data["insertId"];
                                        return cback22(null, rows);
                                    }
                                })
                            }
                        ], function (err, res) {
                            if (err) {
                                cb(err);
                            }
                            else {
                                cb();
                            }
                        })
                    },
                        function (err1) {
                            if (err1) {
                                cback2(err1);
                            }
                            else {
                                cback2(null);
                            }
                        })
                } else {
                    return cback2()
                }
            }
        ], function (err, res) {
            callback(err, { is_paddy_maize_crop_available });
        })
    },
    updateFarmerCode: function (dbkey, params, sessionDetails, callback) {
        let { farmer_code, uf_id, fs_id, inserted_lands } = params;
        if (!farmer_code) {
            return callback({ message: 'farmer code not supplied on update farmer code' })
        }
        let updateObj = {}, whereObj = {}, rg_land = inserted_lands['rg_lands'];
        let forest_landDetail_data = inserted_lands['forest_lands']
        async.series([
            //update into farmer society
            function (c1) {
                updateObj = { "farmer_code": farmer_code };
                whereObj = { "uf_id": uf_id, "fs_id": fs_id };
                queryParamObj = DB_SERVICE.getUpdateQueryAndparams(updateObj, whereObj, 'farmer_society');
                DB_SERVICE.executeQueryWithParameters(dbkey, queryParamObj.query, queryParamObj.params, function (err41, res41) {
                    if (err41) {
                        return c1(err41);
                    }
                    else if (res41.data["affectedRows"] == 1) {
                        return c1(null)
                    } else {
                        return c1({ message: `FarmerCode update unSuccessFull in Farmer Society for fs_id ${fs_id}.`, errno: 4444 })
                    }
                })
            },
            //update into  land_details
            function (c2) {
                if (rg_land.length > 0) {
                    updateObj = { "farmer_code": farmer_code };
                    whereObj = { "uf_id": uf_id, "fs_id": fs_id };
                    queryParamObj = DB_SERVICE.getUpdateQueryAndparams(updateObj, whereObj, 'land_details');
                    DB_SERVICE.executeQueryWithParameters(dbkey, queryParamObj.query, queryParamObj.params, function (err41, res41) {
                        if (err41) {
                            return c2(err41);
                        }
                        else if (res41.data["affectedRows"] > 0) {
                            return c2(null)
                        } else {
                            return c2({ message: `FarmerCode update unSuccessFull in land Details for fs_id ${fs_id}.`, errno: 4444 })
                        }
                    })
                } else {
                    return c2(null)
                }

            },

            //update into base land_details_forest
            function (c3) {
                if (forest_landDetail_data.length > 0) {
                    updateObj = { "farmer_code": farmer_code };
                    whereObj = { "uf_id": uf_id, "fs_id": fs_id };
                    queryParamObj = DB_SERVICE.getUpdateQueryAndparams(updateObj, whereObj, 'land_details_forest');
                    DB_SERVICE.executeQueryWithParameters(dbkey, queryParamObj.query, queryParamObj.params, function (err41, res41) {
                        if (err41) {
                            return c3(err41);
                        }
                        else if (res41.data["affectedRows"] > 0) {
                            return c3(null)
                        } else {
                            return c3({ message: `FarmerCode update unSuccessFull in land Details_forest for fs_id ${fs_id}.` })
                        }
                    })
                } else {
                    return c3(null)
                }

            },
            //update into base farmerrepresentative
            function (c4) {
                updateObj = { "FarmerCode": farmer_code };
                whereObj = { "uf_id": uf_id, "fs_id": fs_id };
                queryParamObj = DB_SERVICE.getUpdateQueryAndparams(updateObj, whereObj, 'farmerrepresentative');
                DB_SERVICE.executeQueryWithParameters(dbkey, queryParamObj.query, queryParamObj.params, function (err41, res41) {
                    if (err41) {
                        return c4(err41);
                    }
                    else if (res41.data["affectedRows"] > 0) {
                        return c4(null)
                    } else {
                        return c4({ message: `FarmerCode update unSuccessFull in ${base_database} farmerrepresentative for fs_id ${fs_id}.` })
                    }
                })
            },
            //update into base crop_details
            function (c51) {
                updateObj = { "farmer_code": farmer_code };
                whereObj = { "uf_id": uf_id, "fs_id": fs_id };
                queryParamObj = DB_SERVICE.getUpdateQueryAndparams(updateObj, whereObj, 'crop_details');
                DB_SERVICE.executeQueryWithParameters(dbkey, queryParamObj.query, queryParamObj.params, function (err41, res41) {
                    if (err41) {
                        return c51(err41);
                    }
                    else {
                        return c51(null)
                    }
                })
            },
            //update into new crop_details_forest
            function (c60) {
                updateObj = { "farmer_code": farmer_code };
                whereObj = { "uf_id": uf_id, "fs_id": fs_id };
                queryParamObj = DB_SERVICE.getUpdateQueryAndparams(updateObj, whereObj, 'crop_details_forest');
                DB_SERVICE.executeQueryWithParameters(dbkey, queryParamObj.query, queryParamObj.params, function (err41, res41) {
                    if (err41) {
                        return c60(err41);
                    }
                    else {
                        return c60(null)
                    }
                })
            },


        ], function (err, res) {
            callback(err, res)
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
                    if (!whereObj[key]) {
                        return callback({ message: `in insrtAndDltOperation where obj key ${key} is undefined for update ${delete_table_name}.` });
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
    //insert in app log then update from table
    insrtAndUpdtOperation: function (dbkey, request, params, sessionDetails, callback) {
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
                    if (!whereObj[key]) {
                        return callback({ message: `in insrtAndUpdtOperation where obj key ${key} is undefined for update ${update_table_name}.` });
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
                return callback(null, found_rows);
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
                    return (e.operation_id !== 3 && e.operation_id !== 5)
                })
                let basic_data = active_fs_data.filter(e => {
                    return e.fs_id == params.fs_id
                })

                if (basic_data.length == 0) {
                    return callback({ ...securityService.SECURITY_ERRORS.FAEMER_NOT_ACTIVE, message: `farmer fs_id-${params.fs_id} is not active in farmer_society` })
                }
                else if (basic_data.length > 1) {
                    return callback({ message: `Invalid fs_id ${params.fs_id} for farmer_society WHILE CHECKING ACTIVE FARMER IN farmer SERVER.` })
                }
                basic_data = basic_data[0]
                return callback(null, { basic_data, isActiveFarmer: true });
            }
            else {
                return callback({ "message": `Data Not Found on Farmer_society for fs_id- ${params.fs_id} when Checking for Active Farmer.` })
            }
        })
    },

    getActiveFarmerDetails_base: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.fs_id)) return callback({ ...securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING, message: 'fs_id is required for active farmer check in base.' });
        dbkey = CONFIG_PARAMS.getWorkingBaseDBDetails();
        let q = `select * from farmer_society fs where fs.fs_id = ${params.fs_id} and fs.carry_forward_status is null and fs.delete_status is null ;`
        DB_SERVICE.executeQueryWithParameters(dbkey, q, [], function (err, res) {
            if (err) {
                return callback(err);
            }
            else if (res.data && res.data.length == 1) {
                basic_data = res.data[0]
                return callback(null, { basic_data, isActiveFarmer: true });
            }
            else {
                return callback({ ...securityService.SECURITY_ERRORS.FAEMER_NOT_ACTIVE, "message": `Data Not Found on base Farmer_society for fs_id- ${params.fs_id} when Checking for Active Farmer.`, code: `sc01` })
            }
        })
    },

    //////////////////////////////////trust////////////////////////////////////////////////////
    saveTrustLandDetails: function (dbkey, basic_data, params, sessionDetails, callback) {
        if (!(params.land_details)) {
            return callback({ ...securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING, 'message': 'field land_details is missing.' });
        }
        let qAndP;
        let { uf_id, fs_id, old_fs_id = null, farmer_code = null, society_id, entry_type } = basic_data;
        let { ip_address, user_id } = sessionDetails;
        let inserted_rg_land_details_arr = [];
        let rg_landDetail_data = params['land_details'];
        let land_obj = {}, land_obj_extraa;
        if (rg_landDetail_data.length === 0) {
            return callback({ message: `land_details is required.` })
        }
        async.series([
            //rg land insert
            function (cback01) {
                async.eachSeries(rg_landDetail_data, function (data, cb) {
                    async.series([
                        //check validation
                        function (cback1) {
                            const { error, value } = userValidations.bhuiyanLandDataValidation(data, entry_type);
                            if (error) {
                                return cback1({ ...securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING, message: `in bhuiyanLandDataValidation :- ${error.details[0].message}`, errno: 1001, uf_id: uf_id });
                            } else {
                                let { flag_varis_land, VillageCensus, SinchitArea = 0, ASinchitArea = 0, IrrigationSorce_GovtWell = 0, IrrigationSorce_PvtWell = 0, IrrigationSorce_GovtCanal = 0, IrrigationSorce_PvtCanal = 0, IrrigationSorce_GovtPond = 0, IrrigationSorce_PvtPond = 0, IrrigationSorce_GovtOther = 0, IrrigationSorce_PvtOther = 0, IrrigationSorce_GovtTubWell = 0, IrrigationSorce_PvtTubWell = 0, IrrigationSorce_GovtPumpDiesel = 0, IrrigationSorce_PvtPumpDiesel = 0, IrrigationSorce_GovtPumpElectric = 0, IrrigationSorce_PvtPumpElectric = 0, OwnerName, FatherName, loanbook, PatwariHalka, Khasra_No, Basra_No, FarmSize, OwnerType, OwnerTypeCode, LastUpdatedOn, MutationReasonId, type, VillageID, ID_MasterKey_Khasra, jodtId } = value;
                                if (jodtId == 3) {
                                    land_obj = {
                                        uf_id: uf_id,
                                        fs_id: fs_id,
                                        old_fs_id: old_fs_id,
                                        farmer_code: farmer_code,
                                        village_code: VillageCensus,
                                        sinchit_asinchit: SinchitArea > 0 ? 1 : ASinchitArea > 0 || (SinchitArea == "0.0000" && ASinchitArea == "0.0000" ? 2 : 0),
                                        sichai_id: +IrrigationSorce_GovtWell > 0 || +IrrigationSorce_PvtWell > 0 ? 5 : +IrrigationSorce_GovtCanal > 0 || +IrrigationSorce_PvtCanal > 0 ? 3 : +IrrigationSorce_GovtPond > 0 || +IrrigationSorce_PvtPond > 0 ? 4 : +IrrigationSorce_GovtOther > 0 || +IrrigationSorce_PvtOther > 0 ? 9 : +IrrigationSorce_GovtTubWell > 0 || +IrrigationSorce_PvtTubWell > 0 ? 1 : IrrigationSorce_GovtWell == "" || b.IrrigationSorce_PvtWell == "" || IrrigationSorce_GovtCanal == "" || IrrigationSorce_PvtCanal == "" || IrrigationSorce_GovtPond == "" || IrrigationSorce_PvtPond == "" || IrrigationSorce_GovtPumpDiesel == "" || IrrigationSorce_PvtPumpDiesel == "" || IrrigationSorce_GovtPumpElectric == "" || IrrigationSorce_PvtPumpElectric == "" || IrrigationSorce_GovtOther == "" || IrrigationSorce_PvtOther == "" || IrrigationSorce_GovtTubWell == "" || IrrigationSorce_PvtTubWell == "" ? 0 : 0,
                                        OwnerName: OwnerName,
                                        FatherName: FatherName,
                                        booklet_no: loanbook,
                                        patwari_halka: PatwariHalka,
                                        khasra_no: Khasra_No,
                                        basra_no: Basra_No,
                                        land_area: +FarmSize,
                                        society_id: society_id,
                                        land_type_code: type == 'RG' ? 1 : 2,
                                        mutation_reason_code: +MutationReasonId,
                                        owner_type_code: +OwnerTypeCode,
                                        village_id: +VillageID,
                                        id_masterkey_khasra: +ID_MasterKey_Khasra,
                                        bhuiyanlastupdatedon: LastUpdatedOn !== "" && LastUpdatedOn !== null ? LastUpdatedOn : null,
                                        user_id: user_id,
                                        ip_address: ip_address,
                                        operation_id: 1,
                                    };
                                    if (entry_type == 6 || entry_type == 7) {
                                        land_obj['flag_varis_land'] = flag_varis_land
                                    }
                                    land_obj_extraa = {
                                        "id_masterkey_khasra": +ID_MasterKey_Khasra,
                                        "booklet_no": loanbook,
                                        "sinchit_asinchit": SinchitArea > 0 ? 1 : ASinchitArea > 0 || (SinchitArea == "0.0000" && ASinchitArea == "0.0000" ? 2 : 0),
                                        "sichai_id": +IrrigationSorce_GovtWell > 0 || +IrrigationSorce_PvtWell > 0 ? 5 : +IrrigationSorce_GovtCanal > 0 || +IrrigationSorce_PvtCanal > 0 ? 3 : +IrrigationSorce_GovtPond > 0 || +IrrigationSorce_PvtPond > 0 ? 4 : +IrrigationSorce_GovtOther > 0 || +IrrigationSorce_PvtOther > 0 ? 9 : +IrrigationSorce_GovtTubWell > 0 || +IrrigationSorce_PvtTubWell > 0 ? 1 : IrrigationSorce_GovtWell == "" || b.IrrigationSorce_PvtWell == "" || IrrigationSorce_GovtCanal == "" || IrrigationSorce_PvtCanal == "" || IrrigationSorce_GovtPond == "" || IrrigationSorce_PvtPond == "" || IrrigationSorce_GovtPumpDiesel == "" || IrrigationSorce_PvtPumpDiesel == "" || IrrigationSorce_GovtPumpElectric == "" || IrrigationSorce_PvtPumpElectric == "" || IrrigationSorce_GovtOther == "" || IrrigationSorce_PvtOther == "" || IrrigationSorce_GovtTubWell == "" || IrrigationSorce_PvtTubWell == "" ? 0 : 0, "bhuiyanlastupdatedon": LastUpdatedOn !== "" && LastUpdatedOn !== null ? LastUpdatedOn : null,
                                    }
                                    const { error, value } = userValidations.landDataValidation(land_obj, entry_type);
                                    if (error) {
                                        return cback1({
                                            'message': `in landDataValidation :- ${error.details[0].message}`, 'errno': 1001, 'uf_id': uf_id
                                        })
                                    } else {
                                        land_obj = value
                                        return cback1()
                                    }
                                } else {
                                    return cback1({ message: `not a trust land jot_id ${jodtId}.` })
                                }

                            }
                        },
                        //insert into Procurment database
                        function (cback2) {
                            qAndP = DB_SERVICE.getInsertClauseWithParams(land_obj, 'land_details');
                            DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err, rows) {
                                if (err) {
                                    return cback2(err);
                                }
                                else if (rows.data['affectedRows'] == 1) {
                                    inserted_rg_land_details_arr.push({ ...land_obj });
                                    return cback2(null);
                                } else {
                                    return cback2({ message: `in land detail insert no record is inserted for uf_id ${uf_id}.` });
                                }
                            })
                        },
                        //insert into procurment database land_details_extra
                        function (cback20) {
                            qAndP = DB_SERVICE.getInsertClauseWithParams(land_obj_extraa, 'land_details_extra');
                            DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err, rows) {
                                if (err) {
                                    return cback20(err);
                                }
                                else {
                                    return cback20(null);
                                }
                            })
                        },
                    ], function (err, result) {
                        if (err) {
                            cb(err);
                        }
                        else {
                            cb()
                        }
                    })
                }, function (err1) {
                    if (err1) {
                        cback01(err1)
                    }
                    else {
                        cback01(null);
                    }
                })
            },

        ], function (err, res) {
            return callback(err, { rg_lands: inserted_rg_land_details_arr, forest_lands: [] });
        });
    },
}

module.exports = common_s