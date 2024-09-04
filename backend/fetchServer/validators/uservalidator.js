var joi = require('joi');
var async = require('async');
var DB_SERVICE = global.DB_SERVICE;
var CONFIG_PARAMS = global.COMMON_CONFS;


///////////////////////// for checking land details are invalid or valid ////////////////////////////////
let checkValidOwnerTypeAndName = function (owner_type, owner_name = '', mutation_reason = 0, jod_id, callback) {
    //console.log(owner_type, owner_name, mutation_reason, jod_id);
    let valid_owner_type_code_arr = [0, 1, 3, 4, 6];
    let valid_arr = [];
    let invalid_arr = [];
    owner_name = owner_name.trim()
    if (valid_owner_type_code_arr.includes(+owner_type) && jod_id != 3) {
        //check owner name also
        if (owner_type == 0) {//check if owner type is goverment then check mutation
            return callback(null, mutation_reason == 26 ? true : false);
        }else if(owner_name.length == 0){
            return callback(null, false);
        }
         else {
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