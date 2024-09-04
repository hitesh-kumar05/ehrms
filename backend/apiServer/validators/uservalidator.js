var joi = require('joi');

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