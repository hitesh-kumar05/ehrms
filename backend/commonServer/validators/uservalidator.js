const { check, validationResult } = require('express-validator');
var joi = require('joi');
var async = require('async');
var DB_SERVICE = global.DB_SERVICE;
var CONFIG_PARAMS = global.COMMON_CONFS;

let kisanShiftingApiValidation = function (reqBody) {
    let schema = joi.object({
        FarmerCode: joi.string().required(),
        OldVlocationCode: joi.number().required(),
        NewVlocationCode: joi.number().required(),
        OldSocietyId: joi.number().required(),
        NewSocietyId: joi.number().required(),
        PcId: joi.number().required(),
        VillageName: joi.string().required()
    }).unknown(true);
    return schema.validate(reqBody, { allowUnknown: true });
}
module.exports.kisanShiftingApiValidation = kisanShiftingApiValidation;

let villageShiftingApiValidation = function (reqBody) {
    let schema = joi.object({
        FarmerCode: joi.string().required(),
        VlocationCode: joi.number().required(),
        OldSocietyId: joi.number().required(),
        NewSocietyId: joi.number().required(),
        PcId: joi.number().required(),
        VillageName: joi.string().required()
    }).unknown(true);
    return schema.validate(reqBody, { allowUnknown: true });
}
module.exports.villageShiftingApiValidation = villageShiftingApiValidation;

let aaprovalRequestedNewFarmerValidation = function (reqBody) {
    let schema = joi.object({
        remark: joi.required(),
        is_approved: joi.required(),
        approved_date: joi.required(),
        approved_user_id: joi.required(),
        approved_ip_address: joi.required(),
        aadhar_number: joi.required(),
        society_id: joi.required()
    }).options({ stripUnknown: true });
    return schema.validate(reqBody, { allowUnknown: true });
}
module.exports.aaprovalRequestedNewFarmerValidation = aaprovalRequestedNewFarmerValidation;

let aaprovalRequestedOldFarmerValidation = function (reqBody) {
    let schema = joi.object({
        remark: joi.required(),
        is_approved: joi.required(),
        approved_date: joi.required(),
        approved_user_id: joi.required(),
        approved_ip_address: joi.required(),
        uf_id: joi.required(),
        society_id: joi.required()
    }).options({ stripUnknown: true });
    return schema.validate(reqBody, { allowUnknown: true });
}
module.exports.aaprovalRequestedOldFarmerValidation = aaprovalRequestedOldFarmerValidation;

let cropDataValidation = function (reqBody) {
    let schema = joi.object({
        crop_code: joi.number().positive().required(),
        ccrop_area: joi.number().required(),
        cropvillage_code: joi.number().positive().required(),
        cropkhasra_no: joi.string().required(),
        is_join: joi.required(),
        is_seed: joi.required()
    }).unknown(true);

    return schema.validate(reqBody, { allowUnknown: true });
}
module.exports.cropDataValidation = cropDataValidation;

let masFarmerValidation = function (reqBody) {
    let schema = joi.object({
        aadhar_number: joi.number().required(),
        // aadhar_ref: joi.number().required(),
        aadhar_verification: joi.string().length(1).valid('Y', 'N').uppercase().required(),
        farmer_name_aadhar: joi.string().required(),
        farmer_name_hi: joi.string().required(),
        relation: joi.string().required(),
        father_name: joi.string().required(),
        "dob": joi.date().required(),
        "category": joi.number().required(),
        "subcategory": joi.number().required(),
        "gender": joi.string().length(1).valid("M", "F", "O").required(),
        "mobile_no": joi.string().length(10).required(),
        "operation": joi.string().required(),
        "aadhar_lastfourdigit": joi.number().required(),
        "user_id": joi.number().required(),
        // "user_type": joi.number().required()
    }).unknown(true);

    return schema.validate(reqBody, { allowUnknown: true });
}
module.exports.masFarmerValidation = masFarmerValidation;

let farmerSocietyValidation = function (reqBody) {
    let schema = joi.object({
        "uf_id": joi.number().required(),
        "society": joi.number().required(),
        "membership_no": joi.string().required(),
        "district": joi.number().required(),
        "distict_census": joi.number().required(),
        // "blockid": joi.number().required(),
        "village_code": joi.number().required(),
        // "address": joi.string().required(),
        // "pincode": joi.number().required(),
        "ifsc_code": joi.string().required(),
        "account_no": joi.string().required(),
        "bank_code": joi.number().required(),
        "branch_code": joi.number().required(),
        "ipaddress": joi.string().required(),
        // "bank_state": joi.number().required(),
        "bank_district": joi.number().required(),
        // "BlockCode": joi.number().required(),
        // "DistrictTehsilID": joi.number().required()
    }).unknown(true);
    return schema.validate(reqBody, { allowUnknown: true });
}
module.exports.farmerSocietyValidation = farmerSocietyValidation;

let landDataValidation = function (reqBody) {
    let schema = joi.object({
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
    }).options({ stripUnknown: true });
    return schema.validate(reqBody, { allowUnknown: true });
}
module.exports.landDataValidation = landDataValidation;

let landDataValidation_existing_land = function (reqBody) {
    let schema = joi.object({
        id_masterkey_khasra: joi.number().required(),
        uf_id: joi.number().required(),
        farmer_code: joi.any(),
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
        ip_address: joi.string().required(),
        old_fs_id: joi.any(),
        updated_user_id: joi.any(),
        dtstamp: joi.any(),
        flag_varis_land: joi.any(),
        updated_dtstamp: joi.any()
    }).options({ stripUnknown: true });
    return schema.validate(reqBody, { allowUnknown: true });
}
module.exports.landDataValidation_existing_land = landDataValidation_existing_land;
let newKisanValidation = function (reqBody) {
    let schema = joi.object({
        basic_details: joi.object().required(),
        land_details: joi.object().required(),
        crop_details: joi.object().required()
    }).unknown(true);

    return schema.validate(reqBody, { allowUnknown: true });
}
module.exports.newKisanValidation = newKisanValidation;


let farmerDetailsValidation = function (reqBody) {
    let schema = joi.object({
        uf_id: joi.number().required(),
        dob: joi.string().required(),
        mobile: joi.number().required()
    }).unknown(true);

    return schema.validate(reqBody, { allowUnknown: true });
}
module.exports.farmerDetailsValidation = farmerDetailsValidation;




let cropDataValidationForBackend = function (reqBody) {
    let schema = joi.object({
        crop_code: joi.number().positive().required(),
        ccrop_area: joi.number().required(),
        village_code: joi.number().positive().required(),
        khasra_no: joi.string().required(),
        type: joi.string().required()
    }).unknown(true);
    return schema.validate(reqBody, { allowUnknown: true });
}
module.exports.cropDataValidationForBackend = cropDataValidationForBackend;

let cropDataValidation_sansodhan = function (reqBody) {
    let schema = joi.object({
        uf_id: joi.number().required(),
        fs_id: joi.number().required(),
        farmer_code: joi.required(),
        id_masterkey_khasra: joi.number().required(),
        village_code: joi.number().required(),
        village_id: joi.number().required(),
        khasra_no: joi.string().required(),
        crop_area: joi.number().required(),
        crop_code: joi.number().required(),
        society_id: joi.number().required(),
        land_type_code: joi.number().required(),
        crop_status_code: joi.number().required(),
        old_fs_id: joi.required(),
        user_id: joi.number().required(),
        operation_id: joi.number().required(),
        ip_address: joi.string().required(),
        girdawari_status: joi.any(),
        gir_crop_code: joi.any(),
        gir_crop_area: joi.any()
    }).options({ stripUnknown: true });
    return schema.validate(reqBody, { allowUnknown: true });
}
module.exports.cropDataValidation_sansodhan = cropDataValidation_sansodhan;

let bhuiyanLandDataValidation = function (reqBody) {
    let schema = joi.object({
        VillageCensus: joi.number().required(),
        //SinchitArea: joi.required(),
        //ASinchitArea: joi.required(),
        //IrrigationSorce_GovtWell: joi.required(),
        //IrrigationSorce_PvtWell: joi.required(),
        // IrrigationSorce_GovtCanal: joi.required(),
        // IrrigationSorce_PvtCanal: joi.required(),
        // IrrigationSorce_GovtPond: joi.required(),
        //IrrigationSorce_PvtPond: joi.required(),
        // IrrigationSorce_GovtOther: joi.required(),
        // IrrigationSorce_PvtOther: joi.required(),
        // IrrigationSorce_GovtTubWell: joi.required(),
        // IrrigationSorce_PvtTubWell: joi.required(),
        //  IrrigationSorce_GovtPumpDiesel: joi.required(),
        // IrrigationSorce_PvtPumpDiesel: joi.required(),
        // IrrigationSorce_GovtPumpElectric: joi.required(),
        // IrrigationSorce_PvtPumpElectric: joi.required(),
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
    }).unknown(true);
    return schema.validate(reqBody, { allowUnknown: true });
}
module.exports.bhuiyanLandDataValidation = bhuiyanLandDataValidation;

let landObjectArrayValidation = function (reqBody) {
    let schema = joi.object({
        rg_lands: joi.array().required(),
        vp_lands: joi.array().required(),
        vg_lands: joi.array().required(),
        us_lands: joi.array().required(),
        vpf_lands: joi.array().required(),
    }).unknown(true);

    return schema.validate(reqBody, { allowUnknown: true });
}
module.exports.landObjectArrayValidation = landObjectArrayValidation;

///////////////////////// for checking  land details are invalid or valid ////////////////////////////////
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
            //working fine 29-07-2023
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


let forestLandDataValidation = function (reqBody) {
    let schema = joi.object({
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
    }).options({ stripUnknown: true });
    return schema.validate(reqBody, { allowUnknown: true });
}
module.exports.forestLandDataValidation = forestLandDataValidation;

let cropDataValidation_rg = function (reqBody) {
    let schema = joi.object({
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
    }).options({ stripUnknown: true });
    return schema.validate(reqBody, { allowUnknown: true });
}
module.exports.cropDataValidation_rg = cropDataValidation_rg;

let forestCropDataValidation = function (reqBody) {
    let schema = joi.object({
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
    }).options({ stripUnknown: true });
    return schema.validate(reqBody, { allowUnknown: true });
}
module.exports.forestCropDataValidation = forestCropDataValidation;
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