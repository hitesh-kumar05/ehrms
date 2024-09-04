var joi = require('joi');
var async = require('async');
const Joi = require('joi');
var DB_SERVICE = global.DB_SERVICE;
var CONFIG_PARAMS = global.COMMON_CONFS;


///////////////////////// for checking land details are invalid or valid ////////////////////////////////
let checkValidOwnerTypeAndName = function (owner_type, owner_name = '', mutation_reason = 0, jod_id, callback) {
    //console.log(owner_type, owner_name, mutation_reason, jod_id);
    let valid_owner_type_code_arr = [0, 1, 3, 4, 6];
    let valid_arr = [];
    let invalid_arr = [];
    if (valid_owner_type_code_arr.includes(+owner_type) && jod_id != 3) {
        //check owner name also
        if (owner_type == 0) {//check if owner type is goverment then check mutation
            return callback(null, mutation_reason == 26 ? true : false);
        } else {
            async.series([
                function (cback1) {
                    getValidInvalidWord((err, res) => {
                        if (err) {
                            return cback1(err)
                        } else {
                            for (const element of res) {
                                valid_arr.push(element.valid_words)
                                invalid_arr.push(element.invalid_words)
                            }
                            invalid_arr = (invalid_arr.filter(item => item !== null)).toString();
                            valid_arr = (valid_arr.filter(item => item !== null)).toString();
                            let invalid_arr_str = invalid_arr.split(',');
                            let valid_arr_str = valid_arr.split(',')
                            //console.log(invalid_arr_str);
                            const regex_patterns_invalid = invalid_arr_str.map(s => new RegExp(s));

                            const regex_patterns_valid = valid_arr_str.map(s => new RegExp(s));
                            //console.log(regex_patterns_valid);
                            // if owner name matches excption word then return true 
                            if (regex_patterns_valid.some(pattern => pattern.test(owner_name))) {
                                // console.log('valid word');
                                return cback1(null, true)
                            } else {
                                let isPresent = regex_patterns_invalid.some(pattern => pattern.test(owner_name));
                                // console.log('in valid word');
                                return cback1(null, !isPresent);
                            }
                        }
                    })
                }
            ], function (err, res) {
                ////console.log(err, res);
                if (err) {
                    return callback(err);
                } else {
                    return callback(null, res[0]);
                }
            })
        }
    } else {
        return callback(null, false);;
    };
}
module.exports.checkValidOwnerTypeAndName = checkValidOwnerTypeAndName;

let getValidInvalidWord = function (callback) {
    let dbkey = CONFIG_PARAMS.getWorkingDBDetails();
    let qAndpObj = { query: `SELECT miw.invalid_words, miw.valid_words FROM mas_invalid_words miw`, params: [] };
    DB_SERVICE.executeQueryWithParameters(dbkey, qAndpObj.query, qAndpObj.params, function (e1, r1) {
        if (r1 && r1.data) {
            callback(null, r1.data);
        } else {
            callback(e1);
        }
    })
}


//////////////////////////// object validation //////////////////////////////////////
module.exports.FarmerObjectValidation = function (reqBody, type) {
    let farmer_object = {
        basic_details: joi.object({
            "mas_farmer": joi.object().required(),
            "farmer_society": joi.object().required(),
            "farmer_representative": joi.object().required()
        }).required(),
        land_details: joi.array().items(
            joi.object({
                VillageCensus: joi.number().required(),
                OwnerName: joi.string().required(),
                FatherName: joi.string().required(),
                loanbook: joi.required(),
                PatwariHalka: joi.number().required(),
                Khasra_No: joi.string().required(),
                Basra_No: joi.string().required(),
                FarmSize: joi.number().required(),
                OwnerType: joi.string().required(),
                OwnerTypeCode: joi.number().required(),
                LastUpdatedOn: joi.required(),
                MutationReasonId: joi.required()
            }).unknown(true)
        ).required(),
        forest_land_details: joi.array().items(
            joi.object({
                village_code: joi.number().required(),
                khasra_no: joi.string().required(),
                land_area: joi.number().required(),
                type: joi.string().valid("VG", "US", "VP").required(),
            })
        ).required(),
        crop_details: joi.array().items(
            joi.object({
                village_code: joi.number().required(),
                khasra_no: joi.string().required(),
                crop_area: joi.number().required(),
                crop_code: joi.number().required(),
                status: joi.string().valid("OC", "PC", "CC", "NE").required(),
                type: joi.string().required(),
                girdawari_status: joi.any()
            })
        ).required(),
        forest_crop_details: joi.array().items(
            joi.object({
                village_code: joi.number().required(),
                khasra_no: joi.string().required(),
                crop_area: joi.number().required(),
                crop_code: joi.number().required(),
                status: joi.string().valid("OC", "PC", "CC", "NE").required(),
                type: joi.string().required(),
                girdawari_status: joi.any()
            })
        ).required(),
        society_id: joi.required()
    };
    if (type == 1) {//for carry forward
        farmer_object = { ...farmer_object, old_land_details: joi.array().items().required(), farmer_type: joi.number().required() }
    } else if (type == 4) {// for sansodhan
        farmer_object = farmer_object//{ ...farmer_object, fs_id: joi.number().required(), farmer_code: joi.required() }
    } else if (type == 5) {// for varisan
        farmer_object = {
            ...farmer_object, varisanOldAadharNo: joi.required(), varisanOldFarmerCode: joi.required(),
            varisanCase: joi.number().required(), varisanOldFsid: joi.number().required(), varisanOldUfid: joi.number().required(),

        }
    }
    let schema = joi.object(farmer_object).unknown(true);
    return schema.validate(reqBody, { allowUnknown: true });
}

module.exports.basicDetailsObjectValidation = function (reqBody) {
    let schema = joi.object({
        "mas_farmer": joi.object().required(),
        "farmer_society": joi.object().required(),
        "farmer_representative": joi.object().required(),
        "basic_data": joi.object({ "entry_type": joi.number().required(), "total_paddy_area": joi.number().required(), "total_land_area": joi.number().required(), "total_crop_area": joi.number().required() }).required()
    }).unknown(true);
    return schema.validate(reqBody, { allowUnknown: true });
}

module.exports.masFarmerValidation = function (reqBody, type) {
    let mas_farmer_object = {
        "uf_id": joi.required(),
        "aadhar_number": joi.number().min(100000000000).max(999999999999).required(),
        "aadhar_ref": joi.string().required(),
        "aadhar_verification": joi.required(),
        "farmer_name_aadhar": joi.string().trim().max(250).required(),
        "farmer_name_hi": joi.string().max(250).required().trim(),
        "relation": joi.string().max(1).required(),
        "father_name": joi.string().max(250).required(),
        "dob": joi.date().required(),
        "subcaste_code": joi.number().required(),
        "gender": joi.string().length(1).valid("M", "F", "T").required(),
        "mobile_no": joi.string().pattern(/^(?!.*(\d)\1{4})(?:\+91|0)?[6-9]\d{9}$/).required(),
        "operation_id": joi.number().required(),
        "user_id": joi.number().required(),
        "ip_address": joi.string().required(),
        "village_code": joi.number().required(),
        "address": joi.string().trim(),
        "pincode": joi.any()
    }
    // if (type == 1) {
    //     mas_farmer_object = { ...mas_farmer_object, uf_id: joi.number().required() }
    // }
    let schema = joi.object(mas_farmer_object).options({ stripUnknown: true });

    return schema.validate(reqBody, { allowUnknown: true });
}

module.exports.farmerSocietyValidation = function (reqBody, type) {
    let farmer_society_object = {
        "uf_id": joi.number().required(),
        "society_id": joi.number().required(),
        "membership_no": joi.any(),
        "village_code": joi.number().required(),
        "village_id": joi.number().required(),
        "branch_code": joi.number().required(),
        "ifsc_code": joi.string().required(),
        "account_no": joi.string().max(17).required(),
        "entry_type_code": joi.number().required(),
        "ip_address": joi.string().required(),
        "user_id": joi.number().required(),
        "operation_id": joi.number().required(),
        "total_land_area": joi.number().required(),
        "total_crop_area": joi.number().required(),
        "total_paddy_area": joi.number().required()
    }
    if (type == 1) {
        farmer_society_object = { ...farmer_society_object, is_bhumihin_farmer: joi.string().length(1).valid("Y", "N",).required(), "old_fs_id": joi.required(), "farmer_code": joi.required(), "fs_id": joi.number().required(), "pfms_flag": joi.required(), "pfms_remark": joi.required(), "pfms_name": joi.required() }
    } else if (type == 4) {// for sansodhan
        farmer_object = { ...farmer_object, fs_id: joi.number().required(), farmer_code: joi.required() }
    }
    let schema = joi.object(farmer_society_object).options({ stripUnknown: true });
    return schema.validate(reqBody, { allowUnknown: true });
}

module.exports.farmerReprenstativeValidation = function (reqBody, type) {
    let schema = joi.object({
        "uf_id": joi.required(),
        "fs_id": joi.required(),
        "FourDigit": joi.required(),
        "IPAddress": joi.required(),
        "Opration": joi.required(),
        "society": joi.required(),
        "Name": joi.required(),
        "Relation": joi.required(),
        "AadharNo": joi.number().required(),
        "UserID": joi.required(),
        "TypeofPerson": joi.required(),
        "aadhar_ref": joi.string().required(),
        "FarmerCode": joi.required()
    }).options({ stripUnknown: true });
    return schema.validate(reqBody, { allowUnknown: true });
}

module.exports.bhuiyanLandDataValidation = function (reqBody, type) {
    let bhuyian_schema = {
        VillageCensus: joi.number().required(),
        OwnerName: joi.string().required(),
        FatherName: joi.string().required(),
        loanbook: joi.required(),
        PatwariHalka: joi.number().required(),
        Khasra_No: joi.string().required(),
        Basra_No: joi.string().required(),
        FarmSize: joi.number().required(),
        OwnerType: joi.string().required(),
        OwnerTypeCode: joi.number().required(),
        LastUpdatedOn: joi.required(),
        MutationReasonId: joi.required(),
        jodtId: joi.required()
    }

    if (type == 6 || type == 7) {// 6- for varishan add new and 7- for varishan sansodhan
        bhuyian_schema = { ...bhuyian_schema, flag_varis_land: joi.number().required() }
    }
    let schema = joi.object(bhuyian_schema).unknown(true);
    return schema.validate(reqBody, { allowUnknown: true });
}

module.exports.landDataValidation = function (reqBody, type) {
    let land_object = {
        id_masterkey_khasra: joi.number().required(),
        uf_id: joi.number().required(),
        fs_id: joi.number().required(),
        village_code: joi.number().required(),
        khasra_no: joi.string().required(),
        village_id: joi.number().required(),
        land_area: joi.number().required(),
        OwnerName: joi.string().required(),
        FatherName: joi.string().required(),
        booklet_no: joi.any(),
        sinchit_asinchit: joi.any(),
        sichai_id: joi.number().required(),
        patwari_halka: joi.any(),
        basra_no: joi.required(),
        owner_type_code: joi.number().required(),
        bhuiyanlastupdatedon: joi.required(),
        mutation_reason_code: joi.number().required(),
        society_id: joi.number().required(),
        land_type_code: joi.number().required(),
        user_id: joi.number().required(),
        operation_id: joi.number().required(),
        ip_address: joi.string().required()
    }
    if (type == 1 || type == 4) {
        land_object = { ...land_object, farmer_code: joi.required(), old_fs_id: joi.required() }
    }
    if (type == 6) {// 6- for varishan add new 
        land_object = { ...land_object, flag_varis_land: joi.number().required() }
    }
    if (type == 7) {// 7- for varishan sansodhan
        land_object = { ...land_object, flag_varis_land: joi.number().required(), farmer_code: joi.required(), old_fs_id: joi.required() }
    }
    let schema = joi.object(land_object).options({ stripUnknown: true });
    return schema.validate(reqBody, { allowUnknown: true });
}

module.exports.forestLandDataValidation = function (reqBody, type) {
    let forest_land_object = {
        uf_id: joi.number().required(),
        fs_id: joi.number().required(),
        village_code: joi.number().required(),
        khasra_no: joi.string().required(),
        land_area: joi.number().required(),
        society_id: joi.number().required(),
        land_type_code: joi.number().required(),
        user_id: joi.number().required(),
        operation_id: joi.number().required(),
        ip_address: joi.string().required()
    }
    if (type == 1 || type == 4) {// for -1 carry forward ,4-for sansodhan
        forest_land_object = { ...forest_land_object, farmer_code: joi.required(), old_fs_id: joi.required() }
    }
    if (type == 6) {// 6- for varishan add new 
        forest_land_object = { ...forest_land_object, flag_varis_land: joi.number().required() }
    }
    if (type == 7) {//  7- for varishan sansodhan
        forest_land_object = { ...forest_land_object, flag_varis_land: joi.number().required(), farmer_code: joi.required(), old_fs_id: joi.required() }
    }
    let schema = joi.object(forest_land_object).options({ stripUnknown: true });
    return schema.validate(reqBody, { allowUnknown: true });
}

module.exports.cropObjectValidation = function (reqBody) {
    let schema = joi.object({
        crop_code: joi.number().positive().required(),
        crop_area: joi.number().required(),
        village_code: joi.number().positive().required(),
        khasra_no: joi.string().required(),
        type: joi.string().required()
    }).unknown(true);
    return schema.validate(reqBody, { allowUnknown: true });
}

module.exports.cropDataValidation = function (reqBody, type) {
    let crop_object = {
        uf_id: joi.number().required(),
        fs_id: joi.number().required(),
        id_masterkey_khasra: joi.number().required(),
        village_code: joi.number().required(),
        village_id: joi.number().required(),
        khasra_no: joi.string().required(),
        crop_area: joi.number().required(),
        crop_code: joi.number().required(),
        society_id: joi.number().required(),
        land_type_code: joi.number().required(),
        crop_status_code: joi.number().required(),
        user_id: joi.number().required(),
        operation_id: joi.number().required(),
        ip_address: joi.string().required(),
        girdawari_status: joi.any()
    }
    if (type == 1) {// 1- for carryforward
        crop_object = { ...crop_object, farmer_code: joi.required(), old_fs_id: joi.required() }
    }
    if (type == 4 || type == 7) {// 7- for varishan sansodhan, 4-sansodhan
        crop_object = {
            ...crop_object,
            farmer_code: joi.required(),
            old_fs_id: joi.required(),
            gir_crop_code: joi.any(),
            gir_crop_area: joi.any()
        }
    }

    let schema = joi.object(crop_object).options({ stripUnknown: true });
    return schema.validate(reqBody, { allowUnknown: true });
}

module.exports.forestCropDataValidation = function (reqBody, type) {
    let forest_crop_object = {
        uf_id: joi.number().required(),
        fs_id: joi.number().required(),
        land_forest_id: joi.number().required(),
        village_code: joi.number().required(),
        khasra_no: joi.string().required(),
        crop_area: joi.number().required(),
        crop_code: joi.number().required(),
        society_id: joi.number().required(),
        land_type_code: joi.number().required(),
        crop_status_code: joi.number().required(),
        user_id: joi.number().required(),
        operation_id: joi.number().required(),
        ip_address: joi.string().required()
    }
    if (type == 1 || type == 4 || type == 7) { // 1-carry forward, 4-sansodhan, 7-varishan sansodhan
        forest_crop_object = { ...forest_crop_object, farmer_code: joi.required(), old_fs_id: joi.required() }
    }
    let schema = joi.object(forest_crop_object).options({ stripUnknown: true });
    return schema.validate(reqBody, { allowUnknown: true });
}

module.exports.deleteOprationObjectValidation = function (reqBody) {
    let schema = joi.object({
        "log_table_name": joi.string().required(),
        "delete_table_name": joi.string().required(),
        "whereObj": joi.object().min(1).required()
    }).unknown(true);
    return schema.validate(reqBody, { allowUnknown: true });
}

module.exports.updateOprationObjectValidation = function (reqBody) {
    let schema = joi.object({
        "log_table_name": joi.string().required(),
        "update_table_name": joi.string().required(),
        "whereObj": joi.object().min(1).required(),
        "updateObj": joi.object().min(1).required(),
        "update_type": joi.number().required()
    }).unknown(true);
    return schema.validate(reqBody, { allowUnknown: true });
}

module.exports.searchValidation = function (type, search1, search2) {
    switch (type) {
        case 1:
            return joi.validate();
            break;
        case 2:

            break;
        case 3:

            break;
        case 4:

            break;
        case 5:

            break;

        default:
            break;
    }
    if (+serachColumn == 1) {
        whereColumn = `mf.aadhar_number = ${searchValue1}`;
    }
    else if (+serachColumn == 2) {
        whereColumn = `mf.uf_id = ${searchValue1}`;
    }
    else if (+serachColumn == 3) {
        whereColumn = `fs.fs_id = ${searchValue1}`;
    }
    else if (+serachColumn == 4) {
        whereColumn = `fs.farmer_code = '${searchValue1}'`
    } else if (+serachColumn == 5) {
        whereColumn = `mf.uf_id = ${searchValue1} and fs.society_id = '${searchValue2}'`
    }
}


/////////////////////////////////// food api object validation/////////////////////////////////////////////////
let food_FarmerRegKhasraDetailsListValidation = joi.array().items(
    joi.object({
        FarmerCode: joi.string().required(),
        KhasraNo: joi.string().required(),
        VLocationCode: joi.string().required(),
        Operation: joi.required(),
        Locked: joi.string().required(),
        Transferred: joi.string().required(),
        RakbaOfPaddy: joi.number().required(),
        Status: joi.string().required(),
        OwnerType: joi.string().required(),
        LastUpdateDate: joi.required(),
        uf_id: joi.required(),
        fs_id: joi.required(),
    })
).required();
let food_FarmerAreaUsageDetailsValidation = joi.array().items(
    joi.object({
        FarmerCode: joi.string().required(),
        VLocationCode: joi.string().required(),
        KhasraNo: joi.string().required(),
        AreaUsage: joi.string().required(),
        AreaType: joi.number().required(),
        Locked: joi.string().required(),
        Transferred: joi.string().required(),
        DateTimeStamp: joi.string().required(),
        uf_id: joi.string().required(),
        fs_id: joi.string().required(),
    })
).required();
let food_FarmerVanGramPaataNoListValidation = joi.array().items(
    joi.object({
        FarmerCode: joi.string().required(),
        VLocationCode: joi.string().required(),
        KhasraNo: joi.string().required(),
        Operation: joi.string().required(),
        RakbaOfPaddy: joi.number().required(),
        uf_id: joi.string().required(),
        fs_id: joi.string().required(),
    })
).required()
let food_FarmerRepresentativeListValidation = joi.array().items(
    joi.object({
        FarmerCode: joi.string().required(),
        TypeofPerson: joi.number().required(),
        Name: joi.string().required(),
        Relation: joi.number().required(),
        AadharNo: joi.string().required(),
        FourDigit: joi.string().required(),
        IPAddress: joi.string().required(),
        UserID: joi.string().required(),
        Opration: joi.string().required(),
        EntryDateTime: joi.required(),
        LastUpdateDate: joi.required()
    }).required()
).required();

///////////////////////new kisan api////////////////////////////////////
module.exports.FoodNewFarmerObjectValidation = function (reqBody, type) {
    let farmer_object = Joi.object({
        "District": joi.string().required(),
        "Society": joi.string().length(6).required(),
        "FarmerCode": joi.string().required(),
        "FarmerName": joi.string().required(),
        "Sex": joi.string().required(),
        "Father_HusbandName": joi.string().required(),
        "Relation": joi.string().required(),
        "Caste": joi.string().required(),
        "SubCaste": joi.string().required(),
        "TotalRakba": joi.string().required(),
        "RakbaOfPaddy": joi.string().required(),
        "MaizeRakba": joi.string().required(),
        "AccountNo": joi.string().required(),
        "BranchName": joi.string().required(),
        "BankName": joi.string().required(),
        "IFSCCode": joi.string().required(),
        "RationCardNo": joi.string().required(),
        "AadharNo": joi.string().required(),
        "AadharName": joi.string().required(),
        "LastFourDigit": joi.string().required(),
        "DateTimeStamp": joi.string().required(),
        "DateofPanjiyan": joi.string().required(),
        "SocietyMemberShipNo": joi.string().required(),
        "MobileNo": joi.string().required(),
        "NewVLocationCode": joi.string().required(),
        "IPAddress": joi.string().required(),
        "fs_id": joi.string().required(),
        "DOB": joi.required(),
        FarmerRegKhasraDetailsList: food_FarmerRegKhasraDetailsListValidation,
        FarmerAreaUsageDetailsList: food_FarmerAreaUsageDetailsValidation,
        FarmerVanGramPaataNoList: food_FarmerVanGramPaataNoListValidation,
        FarmerRepresentativeList: food_FarmerRepresentativeListValidation,
    }).unknown(true);
    if (type == 5) {//varishan
        farmer_object = { ...farmer_object, OLDFarmerName: joi.string().required() }
    }
    let schema = joi.array().items(farmer_object);
    return schema.validate(reqBody, { allowUnknown: true });
}
//////////////////////////////carryforward api //////////////////////////////
module.exports.FoodCarryForwardFarmerObjectValidation = function (reqBody, type) {
    let farmer_object = Joi.object({
        "FarmerCode": joi.string().required(),
        "FarmerName": joi.string().required(),
        "Father_HusbandName": joi.string().required(),
        "AccountNo": joi.string().required(),
        "BranchName": joi.string().required(),
        "BankName": joi.string().required(),
        "IFSCCode": joi.string().required(),
        "AadharNo": joi.string().required(),
        "AadharName": joi.string().required(),
        "MobileNo": joi.string().required(),
        "DOB": joi.required(),
        FarmerRegKhasraDetailsList: food_FarmerRegKhasraDetailsListValidation,
        FarmerAreaUsageDetailsList: food_FarmerAreaUsageDetailsValidation,
        FarmerVanGramPaataNoList: food_FarmerVanGramPaataNoListValidation,
        FarmerRepresentativeList: food_FarmerRepresentativeListValidation,
    }).unknown(true);
    let schema = joi.array().items(farmer_object);
    return schema.validate(reqBody, { allowUnknown: true });
}
//////////////////////////////sansodhan api //////////////////////////////
module.exports.FoodUpdateLandCropObjectValidation = function (reqBody, type) {
    let farmer_object = joi.object({
        "FarmerCode": joi.string().required(),
        "DOB": joi.required(),
        FarmerRegKhasraDetailsList: food_FarmerRegKhasraDetailsListValidation,
        FarmerAreaUsageDetailsList: food_FarmerAreaUsageDetailsValidation,
        FarmerVanGramPaataNoList: food_FarmerVanGramPaataNoListValidation
    }).unknown(true);
    if (type == 5) {//varishan
        farmer_object = {
            ...farmer_object, OLDFarmerName: joi.string().required(),
            Society: joi.string().required()
        }
    }
    let schema = joi.array().items(farmer_object);
    return schema.validate(reqBody, { allowUnknown: true });
}
///////////////////////////varishan new kisan api//////////////////


///////////////////////////deleteion farmer api//////////////////
module.exports.DeleteFarmerObjectValidation = function (reqBody) {
    let farmer_object = {
        uf_id: joi.number().required(),
        fs_id: joi.number().required(),
        remark: joi.string().required(),
        letter_no: joi.string().required(),
        letter_date: joi.string().required(),
        farmer_code: joi.required(),
        user_id: joi.number().required(),
        ip_address: joi.string().required()
    };
    let schema = joi.object(farmer_object).unknown(true);
    return schema.validate(reqBody, { allowUnknown: true });
}
module.exports.FoodDeleteFarmerObjectValidation = function (reqBody) {
    let farmer_object = joi.object({
        "FarmerCode": joi.string().required(),
        "Opration": joi.string().required(),
        "ReasonForDelete": joi.string().required(),
        "IPAddress": joi.string().required()
    }).options({ stripUnknown: true });
    let schema = joi.array().items(farmer_object);
    return schema.validate(reqBody, { allowUnknown: true });
};
module.exports.FoodNomineeupdateObjectValidation = function (reqBody) {
    let farmer_object = joi.object({
        "FarmerCode": joi.string().required(),
        "TypeofPerson": joi.string().required(),
        "Name": joi.string().required(),
        "Relation": joi.required(),
        "AadharNo": joi.string().required(),
        "FourDigit": joi.string().required(),
        "IPAddress": joi.string().required(),
        "UserID": joi.required(),
        "Opration": joi.string().required(),
        "EntryDateTime": joi.required(),
        "LastUpdateDate": joi.required()
    }).options({ stripUnknown: true });
    let schema = joi.array().items(farmer_object);
    return schema.validate(reqBody, { allowUnknown: true });
}
//////////////////////// trust carry forward//////////////////////////////////////
module.exports.trustObjectValidation = function (reqBody, type) {
    let farmer_object = {
        basic_details: joi.object({
            "mas_farmer": joi.object().required(),
            "farmer_society": joi.object().required()
        }).required(),
        land_details: joi.array().items(
            joi.object({
                VillageCensus: joi.number().required(),
                OwnerName: joi.string().required(),
                FatherName: joi.string().required(),
                loanbook: joi.required(),
                PatwariHalka: joi.number().required(),
                Khasra_No: joi.string().required(),
                Basra_No: joi.string().required(),
                FarmSize: joi.number().required(),
                OwnerType: joi.string().required(),
                OwnerTypeCode: joi.number().required(),
                LastUpdatedOn: joi.required(),
                MutationReasonId: joi.required(),
                jodtId: joi.number().valid(3).required()
            }).unknown(true)
        ).required(),
        crop_details: joi.array().items(
            joi.object({
                village_code: joi.number().required(),
                khasra_no: joi.string().required(),
                crop_area: joi.number().required(),
                crop_code: joi.number().required(),
                status: joi.string().valid("OC", "PC", "CC", "NE").required(),
                type: joi.string().required(),
                girdawari_status: joi.any()
            })
        ).required(),
        society_id: joi.required()
    };
    if (type == 1) {//for carry forward
        farmer_object = { ...farmer_object, old_land_details: joi.array().items().required() }
    } else if (type == 4) {// for sansodhan
        farmer_object = farmer_object//{ ...farmer_object, fs_id: joi.number().required(), farmer_code: joi.required() }
    } else if (type == 5) {// for varisan
        farmer_object = {
            ...farmer_object, varisanOldAadharNo: joi.required(), varisanOldFarmerCode: joi.required(),
            varisanCase: joi.number().required(), varisanOldFsid: joi.number().required(), varisanOldUfid: joi.number().required(),
        }
    }
    let schema = joi.object(farmer_object).unknown(true);
    return schema.validate(reqBody, { allowUnknown: true });
}

module.exports.trust_basicDetailsObjectValidation = function (reqBody) {
    let schema = joi.object({
        "mas_farmer": joi.object().required(),
        "farmer_society": joi.object().required(),
        "basic_data": joi.object({ "entry_type": joi.number().required(), "total_paddy_area": joi.number().required(), "total_land_area": joi.number().required(), "total_crop_area": joi.number().required() }).required().unknown(true)
    }).unknown(true);
    return schema.validate(reqBody, { allowUnknown: true });
}
module.exports.trust_masFarmerValidation = function (reqBody, type) {
    let mas_farmer_object = {
        "aadhar_number": joi.number().min(100000000000).max(999999999999).required(),
        "aadhar_ref": joi.string().required(),
        "aadhar_verification": joi.required(),
        "farmer_name_aadhar": joi.string().trim().max(250).required(),
        "farmer_name_hi": joi.string().max(250).required().trim(),
        "relation": joi.string().default('F').required(),
        "father_name": joi.string().valid(Joi.ref('farmer_name_aadhar')).required(),
        "dob": joi.date().required(),
        "subcaste_code": joi.number().default(101).valid(101).required(),
        "gender": joi.string().default('S').valid("S").required(),
        "mobile_no": joi.string().pattern(/^(?!.*(\d)\1{4})(?:\+91|0)?[6-9]\d{9}$/).required(),
        "operation_id": joi.number().required(),
        "user_id": joi.number().required(),
        "ip_address": joi.string().required(),
        "village_code": joi.number().required(),
        "address": joi.string().trim(),
        "pincode": joi.any()
    }
    if (type == 'proc') {
        mas_farmer_object = { ...mas_farmer_object, uf_id: joi.number().required() }
    }
    let schema = joi.object(mas_farmer_object).options({ stripUnknown: true });

    return schema.validate(reqBody, { allowUnknown: true });
}

module.exports.trust_farmerSocietyValidation = function (reqBody, type) {
    let farmer_society_object = {
        "uf_id": joi.number().required(),
        "society_id": joi.number().required(),
        "membership_no": joi.any(),
        "village_code": joi.number().required(),
        "village_id": joi.number().required(),
        "entry_type_code": joi.number().valid(3, 4).required(),
        "ip_address": joi.string().required(),
        "user_id": joi.number().required(),
        "operation_id": joi.number().required(),
        "total_land_area": joi.number().required(),
        "total_crop_area": joi.number().required(),
        "total_paddy_area": joi.number().required()
    }
    if (type == 1) {
        farmer_society_object = { ...farmer_society_object, "farmer_code": joi.string().required() }
    } else if (type == 4) {// for sansodhan
        farmer_object = { ...farmer_object, fs_id: joi.number().required(), farmer_code: joi.string().required() }
    }
    let schema = joi.object(farmer_society_object).options({ stripUnknown: true });
    return schema.validate(reqBody, { allowUnknown: true });
}

/////////////////////////////aadhar null farmer /////////////////////////////
module.exports.AadharNullFarmerObjectValidation = function (reqBody) {
    let schema = joi.object({
        "aadhar_number": joi.string().required(),
        "aadhar_ref": joi.string().required(),
        "farmer_code": joi.string().length(15).required(),
        "dob": joi.date().required(),
        "village_code": joi.number().required(),
        "village_id": joi.number().required(),
        "mobile_no": joi.string().required(),
        "pincode": joi.number().required(),
        "address": joi.required(),
        "entry_type_code": joi.number().required(),
    }).options({ stripUnknown: true });

    return schema.validate(reqBody, { allowUnknown: true });
}

module.exports.farmerSocietyBaseValidation = function (reqBody) {
    let schema = joi.object({
        "old_fs_id": joi.number().required(),
        "uf_id": joi.number().required(),
        "farmer_code": joi.required(),
        "society_id": joi.number().required(),
        "membership_no": joi.any(),
        "village_code": joi.number().required(),
        "village_id": joi.number().required(),
        "branch_code": joi.number().required(),
        "ifsc_code": joi.string().required(),
        "account_no": joi.string().min(9).max(17).required(),
        "pfms_flag": joi.required(),
        "entry_type_code": joi.number().required(),
        "ip_address": joi.string().required(),
        "user_id": joi.number().required(),
        "operation_id": joi.number().required(),
        "old_uf_id": joi.required(),
    }).options({ stripUnknown: true });

    return schema.validate(reqBody, { allowUnknown: true });
}