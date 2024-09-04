var joi = require('joi');
var async = require('async');
var DB_SERVICE = global.DB_SERVICE;
var CONFIG_PARAMS = global.COMMON_CONFS;

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
module.exports.deleteOprationObjectValidation = function (reqBody) {
    let schema = joi.object({
        "log_table_name": joi.string().required(),
        "delete_table_name": joi.string().required(),
        "whereObj": joi.object().min(1).required()
    }).unknown(true);
    return schema.validate(reqBody, { allowUnknown: true });
}

module.exports.bankDetailsUpdateObjectValidation = function (reqBody) {
    let schema = joi.object({
        "fs_id": joi.number().required(),
        "uf_id": joi.number().required(),
        "branch_code": joi.number().required(),
        "bank_district": joi.number().required(),
        "bank_code": joi.number().required(),
        "ifsc_code": joi.string().required(),
        "Remark": joi.string().required(),
        "account_no": joi.required(),
        "caccount_no": joi.required(),
        "user_id": joi.required(),
        "ip_address": joi.required()
    }).unknown(true);
    return schema.validate(reqBody, { allowUnknown: true });
}

module.exports.basicDetailsUpdateObjectVaridation = function (reqBody) {
    let schema = joi.object({
        "forFoodData": joi.object({
            "FarmerCode": joi.string().required(),
            "FarmerName": joi.string().required(),
            "Sex": joi.string().required(),
            "Father_HusbandName": joi.string().required(),
            "Relation": joi.string().required(),
            "Caste": joi.required(),
            "SubCaste": joi.required(),
            "Address": joi.string().required(),
            "MobileNo": joi.required(),
            "DOB": joi.required(),
            "NewVLocationCode": joi.required(),
            "AadharNo": joi.string().length(12).required(),
            "AadharName": joi.string().required(),
        }),
        "RGKNYdata": joi.object({
            "farmer_name_hi": joi.string().required(),
            "father_name": joi.string().required(),
            "relation": joi.string().required(),
            "dob": joi.required(),
            "gender": joi.string().required(),
            "caste_code": joi.number().required(),
            "subcaste_code": joi.number().required(),
            "mobile_no": joi.required(),
            "village_code": joi.number().required(),
            "village_id": joi.required(),
            "pincode": joi.required(),
            "address": joi.string().required(),
            "society_village_code": joi.number().required(),
            "society_village_id": joi.required(),
            "uf_id": joi.number().required(),
            "fs_id": joi.number().required(),
        }),
        "user_id": joi.required(),
        "ip_address": joi.required()
    }).unknown(true);
    return schema.validate(reqBody, { allowUnknown: true });
}

module.exports.aadharDetailsUpdateObjectVaridation = function (reqBody) {
    let schema = joi.object({
        "farmer_code": joi.string().required(),
        "FarmerName": joi.string().required(),
        "Sex": joi.string().required(),
        "Father_HusbandName": joi.string().required(),
        "Relation": joi.string().required(),
        "Caste": joi.required(),
        "SubCaste": joi.required(),
        "Address": joi.string().required(),
        "MobileNo": joi.required(),
        "DOB": joi.required(),
        "NewVLocationCode": joi.required(),
        "aadhar_number": joi.string().length(12).required(),
        "farmer_name_aadhar": joi.string().required(),
        "aadhar_ref": joi.string().required(),
        "uf_id": joi.number().required(),
        "fs_id": joi.number().required(),
    }).unknown(true);
    return schema.validate(reqBody, { allowUnknown: true });
}


module.exports.FoodBasicDetailUpdateFarmerObjectValidation = function (reqBody) {
    let farmer_object = joi.object({
        "FarmerCode": joi.string().required(),
        "FarmerName": joi.string().required(),
        "Sex": joi.string().required(),
        "Father_HusbandName": joi.string().required(),
        "Relation": joi.string().required(),
        "Caste": joi.required(),
        "SubCaste": joi.required(),
        "Address": joi.string().required(),
        "MobileNo": joi.required(),
        "DOB": joi.required(),
        "NewVLocationCode": joi.required(),
        "AadharNo": joi.string().length(12).required(),
        "AadharName": joi.string().required(),
    }).options({ stripUnknown: true })
    let schema = joi.array().items(farmer_object);
    return schema.validate(reqBody, { allowUnknown: true });
}

module.exports.FoodBankDetailUpdateFarmerObjectValidation = function (reqBody) {
    let farmer_object = joi.object({
        "FarmerCode": joi.string().required(),
        "AccountNo": joi.required(),
        "BankName": joi.required(),
        "BranchName": joi.required(),
        "IFSCCode": joi.string().required(),
        "Remark": joi.required(),
    }).options({ stripUnknown: true })
    let schema = joi.array().items(farmer_object);
    return schema.validate(reqBody, { allowUnknown: true });
}

module.exports.UpdateRaeoDetailsObjectValidation = function(reqBody){
    let schema = joi.object({
        "name": joi.string().required(),
        "user_id": joi.number().required(),
        "mobile_no": joi.required(),
        "subdistrict_code": joi.number().required(),
        "circle_name": joi.string().required(),
        "district_id": joi.number().required(),
        "alternate_mobile_no": joi.required(),
        "email_id": joi.string().required(),
        "villages" : joi.array().items(joi.number().required())
    }).unknown(true);
    return schema.validate(reqBody, { stripUnknown: true });
}
module.exports.AddNewRaeoDetailsObjectValidation = function(reqBody){
    let schema = joi.object({
        "name": joi.string().required(),
        "mobile_no": joi.required(),
        "subdistrict_code": joi.number().required(),
        "circle_name": joi.string().required(),
        "district_id": joi.number().required(),
        "alternate_mobile_no": joi.required(),
        "email_id": joi.string().required(),
        "villages" : joi.array().items(joi.number().required())
    }).unknown(true);
    return schema.validate(reqBody, { stripUnknown: true });

}

module.exports.UpdateRaeoMapVillageObjectValidation = function(reqBody){
    let schema = joi.object({
        "villages": joi.array().items(joi.number().required()),
        "raeo_id": joi.number().required(),
    }).unknown(true);
    return schema.validate(reqBody, { stripUnknown: true });
}

const mobileNumberSchema = joi.number()
  .integer()
  .custom((value, helpers) => {
    const mobileNumber = value.toString();
    // Check if the mobile number is exactly 10 digits
    if (/^(?!.*(\d)\1{4})(?:\+91|0)?[6-9]\d{9}$/.test(mobileNumber)) {
      return helpers.error('any.invalid');
    }
    return value; // Keep the value as it is
  })
  .required();