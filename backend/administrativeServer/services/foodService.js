let req = require('request');
let format = require('date-format');
let async = require('async');
let config = require('config');
const userValidations = require('../validators/uservalidator.js');
let farmerBasicDetailsUpdateApi = config.get('farmerBasicDetailsUpdateApi');
let farmerBankUpdateFoodApi = config.get('farmerBankUpdateFoodApi');


let food_s = {
    foodApiBasicDetailsUpdate: function (dbkey, data1, params, sessionDetails, callback) {
        let sendArray =[],food_response={}
        if (!(params)) {
            return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING)
        }
        async.series([
            // make main array for send into food api 
            function (cback3) {
                sendArray.push(params);
                return cback3()
            },
            //check validation and call food api
            function (cback4) {
                const { error, value } = userValidations.FoodBasicDetailUpdateFarmerObjectValidation(sendArray);
                if (error && error.details) {
                    return cback4({ message: `in food api BasicDetailsUpdate object :- ${error.details[0].message}`, errno: 1001 });
                } else {
                    food_s.ApiCall(farmerBasicDetailsUpdateApi, sendArray, function (err, res) {
                        if (err) {
                            return cback4(err)
                        } else {
                            food_response = res
                            return cback4(null, res)
                        }
                    })

                }
            }
        ],
            function (err, res) {
                if (err) {
                    return callback(err)
                }
                else {
                    return callback(null, food_response);
                }
            })
    },
    foodApiBankDetailsUpdate: function (dbkey, data1, params, sessionDetails, callback) {
        if (!(params)) {
            return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING)
        }
        let sendArray =[],food_response={}
        let { farmer_code, account_no, bank_code, branch_code, ifsc_code, Remark } = params
        async.series([
            // make main array for send into food api 
            function (cback3) {
                let obj = { "FarmerCode": farmer_code, "AccountNo": account_no, "BankName": bank_code, "BranchName": branch_code, "IFSCCode": ifsc_code, "Remark": Remark }
                sendArray.push(obj);
                return cback3()
            },
            //check validation and call food api
            function (cback4) {
                const { error, value } = userValidations.FoodBankDetailUpdateFarmerObjectValidation(sendArray);
                if (error && error.details) {
                    return cback4({ message: `in food api BankDetailsUpdate object :- ${error.details[0].message}`, errno: 1001 });
                } else {
                    food_s.ApiCall(farmerBankUpdateFoodApi, sendArray, function (err, res) {
                        if (err) {
                            return cback4(err)
                        } else {
                            food_response = res
                            return cback4(null, res)
                        }
                    })

                }
            }
        ],
            function (err, res) {
                if (err) {
                    return callback(err)
                }
                else {
                    return callback(null, food_response);
                }
            })
    },
    ApiCall: function (url, data, callback) {
        if (!(url && data)) {
            return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING)
        }
        let options = { url: url, json: true, body: data }
        req.post(options, function (error, response, body) {
            if (error) {
                return callback(error)
            }
            else {
                try {
                    if (typeof (body) !== 'object') {
                        body = JSON.parse(body)
                    };
                    if (body && (body['Status'] == 1 || body["Msg"] == "ALREADYEXISTS")) {
                        return callback(null, body)
                    } else if (body && body['Status'] == 5) {
                        return callback({ message: `food api error - ${body['Msg']}`, 'farmer_code': body['FarmerCode'], 'code': 5 })
                    } else if (body && body['Status'] == 6) {
                        return callback({ message: `food api error - ${body['Msg']}`, 'farmer_code': body['FarmerCode'], 'code': 6 })
                    }
                    else {
                        return callback({ message: `food api error - ${body['Msg'] ?? body['Message']}` })
                    }
                } catch (e) {
                    console.log(e);
                    return callback(e)
                }
            }
        })
    },
}

module.exports = food_s