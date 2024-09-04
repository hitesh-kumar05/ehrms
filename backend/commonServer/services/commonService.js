var DB_SERVICE = global.DB_SERVICE;
var securityService = require('./securityservice.js');
var COMMON_QUERIES = require('../queries/commonQueries.js');
var async = require('async');
var CONFIG_PARAMS = global.COMMON_CONFS;

var common = {
    // Function to tokenize a Hindi string
    hindiTokenizer_1: (inputString) => {
        // Define a regular expression to match Hindi words
        const regex = /[\u0900-\u097F]+/g;
        // Extract Hindi words from the input string
        const tokens = inputString.match(regex) || [];
        return tokens;
    },
    hindiTokenizer: function (inputString) {
        // Define a regular expression to match individual characters and ligatures in Hindi
        const regex = /[\u0900-\u097F]|[^\u0900-\u097F\s]+/g;
        // Extract Hindi characters from the input string
        const tokens = inputString.match(regex) || [];
        return tokens;
    },

    normalizeString: function (inputString) {
        return inputString.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    },
    // Function to preprocess the input string
    preprocessString: (inputString) => {
        // Convert to lowercase
        inputString = inputString.toLowerCase();
        // Remove punctuation and special characters except Hindi characters
        inputString = inputString.replace(/[^\u0900-\u097F\s]/g, "");
        return inputString.trim(); // Trim to remove any leading or trailing spaces
    },

    // Function to calculate similarity percentage between two strings
    calculateSimilarity: (string1, string2) => {
        // Preprocess both strings
        string1 = common.normalizeString(common.preprocessString(string1));
        string2 = common.normalizeString(common.preprocessString(string2));



        // Tokenize strings
        const tokens1 = new Set(common.hindiTokenizer(string1));
        const tokens2 = new Set(common.hindiTokenizer(string2));
        console.log(string1, string2, tokens1, tokens2);
        // Calculate similarity
        const commonTokens = new Set([...tokens1].filter(token => tokens2.has(token)));
        let similarityPercentage = (commonTokens.size / tokens1.size) * 100;
        if (isNaN(similarityPercentage)) {
            similarityPercentage = 0
        }
        return similarityPercentage;
    },

    NameMatch: function (dbkey, request, params, sessionDetails, callback) {
        //return callback(null, this.calculateOverlapPercentage('बैसखिन ', 'बैसाखीन चंदर सिंह पुनीत राम '))
        return callback(null, this.calculateSimilarity_1(' किशुन यादव ', ' किसुन '))
        dbkey = CONFIG_PARAMS.getWorkingBaseDBDetails()
        let landData = []
        async.series([
            function (cback1) {
                let q = `SELECT ld.id_masterkey_khasra, ld.uf_id, ld.OwnerName, mf.farmer_name_hi FROM land_details ld
INNER JOIN mas_farmer mf ON mf.uf_id = ld.uf_id
LIMIT 1000`
                DB_SERVICE.executeQueryWithParameters(dbkey, q, null, function (e1, r1) {
                    if (e1) return cback1(e1)
                    console.log(r1);
                    landData = r1.data
                    return cback1()
                })
            },
            function (cback2) {
                async.eachSeries(landData, function (landObj, cb) {
                    let matching_per = common.calculateSimilarity(landObj['farmer_name_hi'], landObj['OwnerName'])
                    let qAndParam = DB_SERVICE.getUpdateQueryAndparams({ matching_per }, { id_masterkey_khasra: landObj['id_masterkey_khasra'] }, 'land_details')
                    DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam.query, qAndParam.params, function (e1, r1) {
                        if (e1) return cb(e1)
                        console.log(r1);

                        return cb()
                    })
                }, function (err, res) {
                    if (err) return cback2(err)
                    return cback2()
                })
            }
        ], function (err, res) {
            if (err) return callback(err)
            return callback(null, { msg: 'done' })
        })
    },

    calculateSimilarity_1: function (string1, string2) {
        // Preprocess and normalize both strings
        string1 = common.preprocessString(string1);
        string2 = common.preprocessString(string2);

        // Tokenize strings into substrings of length 2 or more
        const substrings1 = common.getSubstrings(string1);
        const substrings2 = common.getSubstrings(string2);
        console.log(substrings1, substrings2);

        // Calculate similarity
        const commonSubstrings = new Set([...substrings1].filter(sub => substrings2.has(sub)));
        const similarityPercentage = (commonSubstrings.size / Math.min(substrings1.size, substrings2.size)) * 100;

        return similarityPercentage;
    },

    calculateSimilarity_2: function (string1, string2) {
        // Preprocess and normalize both strings
        string1 = this.preprocessString(string1);
        string2 = this.preprocessString(string2);

        // Find the longest common substring between the two strings
        const longestCommonSubstring = this.findLongestCommonSubstring(string1, string2);

        // Calculate similarity based on the length of the longest common substring
        const similarityPercentage = (longestCommonSubstring.length / Math.max(string1.length, string2.length)) * 100;

        return similarityPercentage;
    },
    findLongestCommonSubstring: function (str1, str2) {
        const dp = Array.from({ length: str1.length + 1 }, () => Array.from({ length: str2.length + 1 }, () => 0));
        let maxLength = 0;
        let endIndex = 0;

        for (let i = 1; i <= str1.length; i++) {
            for (let j = 1; j <= str2.length; j++) {
                if (str1[i - 1] === str2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                    if (dp[i][j] > maxLength) {
                        maxLength = dp[i][j];
                        endIndex = i - 1;
                    }
                } else {
                    dp[i][j] = 0;
                }
            }
        }

        return str1.substring(endIndex - maxLength + 1, endIndex + 1);
    },

    // Function to get all substrings of length 2 or more from a string
    getSubstrings: function (inputString) {
        const substrings = new Set();
        for (let i = 0; i < inputString.length - 1; i++) {
            for (let j = i + 2; j <= inputString.length; j++) {
                substrings.add(inputString.substring(i, j));
            }
        }
        return substrings;
    },

    calculateOverlapPercentage: function (string1, string2) {
        // Preprocess both strings (remove spaces and convert to lowercase)
        string1 = string1.replace(/\s/g, '').toLowerCase();
        string2 = string2.replace(/\s/g, '').toLowerCase();

        // Initialize counters for common characters and total characters
        let commonCount = 0;
        let totalCount = string1.length;

        // Check each character in string1
        for (const char of string1) {
            if (string2.includes(char)) {
                commonCount++;
            }
        }
        console.log(commonCount);
        // Calculate the percentage of overlap
        const overlapPercentage = (commonCount / totalCount) * 100;
        return overlapPercentage;
    },

    saveDeptInformation: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.user_id && params.user1name && params.user1mob)) { return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING) };
        let { user1name, user1mob, user2name, user2mob, user_id } = params
        dbkey = CONFIG_PARAMS.getUfpDBDetails()
        user2name = user2name == '' ? null : user2name
        user2mob = user2mob == '' ? null : user2mob
        let updateObj = {
            'user1name': user1name, 'user1mob': user1mob, 'user2name': user2name, 'user2mob': user2mob, userdetails_flag: 1,
            "update_user_id": sessionDetails["user_id"], "update_ip_address": sessionDetails["ip_address"]
        };
        let whereObj = { "user_id": user_id };
        let queryParamObj = DB_SERVICE.getUpdateQueryAndparams(updateObj, whereObj, 'users');
        DB_SERVICE.executeQueryWithParameters(dbkey, queryParamObj.query, queryParamObj.params, function (err41, res41) {
            if (err41) {
                return callback(err41);
            }
            else if (res41.data["affectedRows"] == 1) {
                return callback(null, { "success": true })
            }
            else {
                return callback({ message: ` update unSuccessFull in users for user_id ${user_id}.`, errno: 4444 })
            }
        })
    },
    getUserTypeForPassResetOnDDA: function (dbkey, request, params, sessionDetails, callback) {

        let queryParamObj = COMMON_QUERIES.getUserTypeForPassResetOnDDA()
        DB_SERVICE.executeQueryWithParameters(dbkey, queryParamObj.query, queryParamObj.params, function (err41, res41) {
            if (err41) {
                return callback(err41);
            }
            else {
                return callback(null, res41.data)
            }
        })
    },
    getOfficerDetailsByUserID: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.user_id)) { return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING) };
        let queryParamObj = COMMON_QUERIES.getOfficerDetailsByUserIDQueryParamObj(params.user_id)
        DB_SERVICE.executeQueryWithParameters(dbkey, queryParamObj.query, queryParamObj.params, function (err41, res41) {
            if (err41) {
                return callback(err41);
            }
            else {
                return callback(null, res41.data)
            }
        })
    },
    getOfficerAvailableVillages: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.user_type && params.subdistrict_code)) { return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING) };
        let queryParamObj = COMMON_QUERIES.getOfficerAvailableVillagesQueryParamObj(params.subdistrict_code, params.user_type)
        DB_SERVICE.executeQueryWithParameters(dbkey, queryParamObj.query, queryParamObj.params, function (err41, res41) {
            if (err41) {
                return callback(err41);
            }
            else {
                return callback(null, res41.data)
            }
        })
    }
}

module.exports = common

