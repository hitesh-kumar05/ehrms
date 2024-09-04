const crypto = require('crypto');
var securityService = require('./securityservice.js');
var DB_SERVICE = global.DB_SERVICE;
var CONFIG_PARAMS = global.COMMON_CONFS;
var req = require('request');
const async = require('async');
const config = require('config');
const algorithm = 'aes-256-cbc'; // Algorithm to use
const key = '9b1c9ab48c1a4547a30b5f7c0d1e8a3721c9d2a93a1c4f6e5e1b6d8f1a2c3b4d'; // Key should be 32 bytes for aes-256-cbc
const iv = Buffer.from('1234567890abcdef1234567890abcdef', 'hex'); // Initialization vector
let aadharToARefUrl = config.get('apiUrlGetEncryptAadharRef'); // `http://10.132.36.237:3102/otherApi24/aadhar/post/encrypt`;
const aadharToArnCoverterApi = `https://pehchan.cgstate.gov.in:8443/RestAdv_S/auth/WebService/adhtoAdv`;
const ArnToAadharCoverterApi = `https://adv.cgstate.gov.in:8082/RestAdv_S/auth/WebService/advtoAdh`;
// const aadharARNCoverterApi = "https://adv.cgstate.gov.in:8082/RestAdv_S/auth/WebService/adhtoAdv/";
let aadharS = {
    getRefIdByAadhar: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.aadharNo && params.aadharNo.toString().length == 12)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        let aadharNo = +params.aadharNo, aadharRef = '';
        let aadharVaultData = [], isAadharExistOnVault = false;
        let aadharVaultDBkey = CONFIG_PARAMS.getAadharVaultDBDetails();
        async.series([
            //check aadhar in aadharRef (Vault) table. If exist return its ARF else generate ARF and insert it ito AadharRef Table
            function (cback1) {
                let aadhaRefQuery = `SELECT * FROM aadhar_ref ar WHERE ar.aadhar_no = ?;`
                DB_SERVICE.executeQueryWithParameters(aadharVaultDBkey, aadhaRefQuery, [aadharNo], function (e1, r1) {
                    if (e1) {
                        return cback1(e1)
                    }
                    else if (r1 && r1.data && r1.data.length > 1) {
                        return cback1({ message: `Found More Then One Row for This Aadhar : ${aadharNo}` });
                    }
                    else {
                        isAadharExistOnVault = r1.data.length == 1;
                        aadharVaultData = r1.data.length == 1 ? r1.data : [];
                        return cback1()
                    }
                })
            },
            function (cback2) {
                if (isAadharExistOnVault && aadharVaultData.length > 0) {
                    aadharRef = aadharVaultData[0]["aadhar_ref"];
                    return cback2();
                }
                else {
                    let result = {}, insertObj = {};
                    async.series([
                        // generate AadharRef
                        function (c1) {
                            let options = { url: aadharToARefUrl, json: true, body: { "aadharNo": aadharNo } };
                            req.post(options, function (error, response, body) {
                                // console.log('response---------->', error, body, typeof (body));
                                if (error) {
                                    return c1(error);
                                }
                                else {
                                    try {
                                        result = body;
                                        if (result.err) {
                                            return c1(result.err);
                                        } else {
                                            return c1()
                                        }
                                    } catch (e) {
                                        return c1(e);
                                    }
                                }
                            })
                        },
                        function (c2) {
                            insertObj = { "aadhar_no": aadharNo, "aadhar_ref": result["data"] };
                            let qAndParam1 = DB_SERVICE.getInsertClauseWithParams(insertObj, 'aadhar_ref');
                            DB_SERVICE.executeQueryWithParameters(aadharVaultDBkey, qAndParam1.query, qAndParam1.params, function (err1, res) {
                                if (err1) {
                                    return c2(err1);
                                }
                                else if (res.data && res.data["affectedRows"] == 1) {
                                    aadharRef = result["data"];
                                    return c2();
                                }
                                else {
                                    return c2({ "message": `Insert into Table AadharRef is failed.` });
                                }
                            })
                        }
                    ], function (e, r) {
                        if (e) {
                            return cback2(e)
                        }
                        else {
                            return cback2()
                        }
                    })
                }
            },
        ], function (err, res) {
            if (err) {
                return callback(err);
            } else {
                return callback(null, aadharRef);
            }
        })
    },

    encrypt: function (dbkey, request, params, sessionDetails, callback) {
        //return callback(null,params)
        try {
            if (!(params.aadharNo)) return callback(securityService.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
            let aadharNo = params["aadharNo"] + '';
            let cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
            let encrypted = cipher.update(aadharNo);
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            let ref = encrypted.toString('hex')
            return callback(null, ref);
        } catch (error) {
            return callback(error);
        }
    },

    decrypt: function (dbkey, request, params, sessionDetails, callback) {
        try {
            let hash = params["aadharRef"];
            let encryptedBuffer = Buffer.from(hash, 'hex');
            let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), iv);
            let decrypted = decipher.update(encryptedBuffer);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return callback(null, decrypted.toString());
        } catch (error) {
            return callback(error);
        }
    },

    aadharToRef: function (dbkey, request, params, sessionDetails, callback) {
        let aadharArr = [];
        async.series([
            // get aadhar Array
            function (cback1) {
                let query = `select mf.AadharNo AS aadhar_number from rgkny_2023.farmerrepresentative mf
                            WHERE mf.aadhar_ref IS NULL;`;
                DB_SERVICE.executeQueryWithParameters(CONFIG_PARAMS.getLiveDBDetails(), query, [], function (e1, r1) {
                    if (e1) {
                        return cback1(e1);
                    }
                    else if (r1 && r1.data && r1.data.length > 0) {
                        aadharArr = r1.data;
                        return cback1(null);
                    }
                    else {
                        return cback1(securityService.SECURITY_ERRORS.DATA_NOT_FOUND);
                    }
                })
            },
            //get ref for each aadhar
            function (cback2) {
                async.eachSeries(aadharArr, function (aadhar, cb) {
                    console.log(aadhar);
                    let result = {}, insertObj = {};
                    async.series([
                        function (c1) {
                            let options = { url: aadharToARefUrl, json: true, body: { "aadharNo": aadhar.aadhar_number } };
                            req.post(options, function (error, response, body) {
                                //console.log('response---------->', error, body, typeof (body));
                                if (error) {
                                    return c1(error);
                                }
                                else {
                                    try {
                                        result = body;
                                        if (result.err) {
                                            return c1(result.err);
                                        } else {
                                            return c1()
                                        }
                                    } catch (e) {
                                        return c1(e);
                                    }
                                }
                            })
                        },
                        function (c2) {
                            insertObj = { "aadhar_no": aadhar.aadhar_number, "aadhar_ref": result["data"] };
                            let qAndParam1 = DB_SERVICE.getInsertClauseWithParams(insertObj, 'aadhar_ref');
                            DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam1.query, qAndParam1.params, function (err1, res) {
                                // console.log(err1, res);
                                if (err1) {
                                    return c2(err1);
                                }
                                else if (res.data && res.data["affectedRows"] == 1) {
                                    return c2()
                                }
                                else {
                                    return c2({ "message": `Insert into UFP2023 varisan_farmer is failed.` });
                                }
                            })
                        }
                    ], function (e, r) {
                        if (e) {
                            return cb();
                        }
                        else {
                            return cb();
                        }
                    })
                }, function (err, res) {
                    if (err) {
                        return cback2(err);
                    }
                    else {
                        return cback2();
                    }
                })
            }
        ], function (err, res) {
            if (err) {
                return callback(err)
            }
            else {
                return callback(null, { "success": true });
            }
        })
    },

    //CHIPS API region started
    storeChipsARNofMultipleFarmers : function (dbkey, request, params, sessionDetails, callback) {
        let aadhar_code_arr = [], failed_list = [], success_list = [];
        let success_count = 0, failed_count = 0;
        //let LiveDBKey = CONFIG_PARAMS.getLiveDBDetails();
        let ufpDBKey = CONFIG_PARAMS.getUfpDBDetails();
        let q = `SELECT DISTINCT fr.AadharNo as aadhar_number FROM farmerrepresentative fr
WHERE NOT EXISTS (SELECT * FROM arn_table a WHERE a.aadhar_number = fr.AadharNo );`;
        async.series([
            function (cback1) {
                DB_SERVICE.executeQueryWithParameters(ufpDBKey, q, [], function (e1, r1) {
                    if (e1) {
                        return cback1();
                    }
                    else if (r1 && r1.data && r1.data.length > 0) {
                        aadhar_code_arr = r1.data;
                        return cback1()
                    }
                    else {
                        return cback1({ message: `No record Found ` });
                    }
                })
            },
            function (cback2) {
                async.eachSeries(aadhar_code_arr, function (farmer, cb) {
                    console.log(farmer);
                    getAdvFromAadharChips(ufpDBKey, request, farmer, sessionDetails, function (err, res) {
                        if (err) {
                            failed_count += 1;
                            let insertObj = DB_SERVICE.getInsertClauseWithParams({ "error": JSON.stringify(err), "aadhar_number": farmer["aadhar_number"] }, 'aadhartoadv_error');
                            DB_SERVICE.executeQueryWithParameters(ufpDBKey, insertObj.query, insertObj.params, function (err1, res) {
                                return cb();
                            })
                        } else {
                            success_count += 1;
                            return cb();
                        }
                    })
                }, function (err, res) {
                    return cback2()
                })
            }
        ], function (err, res) {
            if(err){
                return callback(err);
            }else{
                return callback(null, {"success" : true, "totalCount" : aadhar_code_arr.length, "successCount" : success_count, "failedCount" : failed_count })
            }
        })
    },

    getAadharByRefrenceChips : function (dbkey, request, params, sessionDetails, callback) {
        let aadhar_REfStr = `0fd309ce-5670-51d1-a0f2-5d958209c491`;
        let id = "AUA-AGC", pwd = "Agc@2024", ecryptedStr = '', decryptedData = '';
        let encryptkey = '5d41402abc4b2a76b9719d911017c592',
            decryptkey = 'wg7l2w6p8wng30c8diiwvmc7lcgy9nlc';
    
        async.series([
            function (cback1) {
                let txn = getTxn();
                let strToSend = `B|${aadhar_REfStr}|${txn}|${id}|${pwd}`
                ecryptedStr = aesEncrypt(strToSend, encryptkey);
                // console.log(strToSend, ecryptedStr, txn, "DATA");
                // console.log(decryptText(ecryptedStr, encryptkey));
                return cback1()
            },
            function (cback2) {
                let apiData = { "url": ArnToAadharCoverterApi, headers: { "Req_Data": ecryptedStr } }
                req.post(apiData, function (error, response, body) {
                    if (error) {
                        return cback2(error)
                    } else {
                        result = body;
                        return cback2(null, body)
                    }
                })
            },
            //decrypt
            function (cback22) {
                decryptedData = decryptText(result, decryptkey);
                return cback22(null, decryptedData);
            }
        ], function (err, res) {
            return callback(err, res[2]);
        })
    }
}

let getAdvFromAadharChips = function (dbkey, request, params, sessionDetails, callback) {
    let aadhaar_number = params['aadhar_number'], txn = '', id = "AUA-AGC", pwd = "Agc@2024";
    let encryptkey = '5d41402abc4b2a76b9719d911017c592', decryptkey = 'wg7l2w6p8wng30c8diiwvmc7lcgy9nlc';
    let ecryptedStr, decryptedData, responseObj = {}, requestStr = '', result;
    if (aadhaar_number) {
        try {
            async.series([
                //generate and encrypt request string
                function (cback11) {
                    txn = getTxn();
                    requestStr = `A|${aadhaar_number}|0|${txn}|${id}|${pwd}`;
                    ecryptedStr = aesEncrypt(requestStr, encryptkey);
                    return cback11();
                },
                // call the Service API
                function (cback2) {
                    let apiData = { "url": aadharToArnCoverterApi, headers: { "Req_Data": ecryptedStr } }
                    req.post(apiData, function (error, response, body) {
                        if (error) {
                            return cback2(error);
                        } else {
                            if (response && response.statusCode == 201) {
                                result = body;
                                return cback2(null, body);
                            } else {
                                return cback2(body)
                            }
                        }
                    })
                },
                //decrypt
                function (cback22) {
                    decryptedData = decryptText(result, decryptkey);
                    const parts = decryptedData.split('|');
                    // console.log(parts);
                    responseObj = { 'ARN': parts[0], 'Aadhar_Hash_Code': parts[1], 'txn': parts[3] }
                    return cback22(null, responseObj);
                },
                //store 
                function (cback3) {
                    if (responseObj) {
                        let data = { "aadhar_number": aadhaar_number, "ARN": responseObj.ARN, "aadhar_hash": responseObj.Aadhar_Hash_Code, 
                            "txn": responseObj.txn, "aadhar_type" : 'nominee_aadhar' }
                        let qAndParam1 = DB_SERVICE.getInsertClauseWithParams(data, 'arn_table');
                        DB_SERVICE.executeQueryWithParameters(dbkey, qAndParam1.query, qAndParam1.params, function (err, res) {
                            if (err) {
                                return cback3(err);
                            }
                            else if (res.data["affectedRows"] == 1) {
                                return cback3();
                            }
                            else {
                                return cback3({ "message": `Update into aadhar_ref is failed.` })
                            }
                        })
                    } else {
                        return cback3(`response obj not found`)
                    }
                },
            ], function (err, res) {
                if (err) {
                    return callback(err);
                }
                else {
                    return callback(null, res);
                }
            })
        } catch (e) {
            return callback(e)
        }
    } else {
        return callback({ 'msg': `aadhar is required` })
    }
}

function aesEncrypt(data, key) {
    const secretKey = Buffer.from(key, 'utf-8');
    const ivs = Buffer.alloc(16, '0'); // Initialization vector
    const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, ivs);
    let encryptedData = cipher.update(data, 'utf-8', 'base64');
    encryptedData += cipher.final('base64');
    return encryptedData;
}

function decryptText(data, key) {
    try {
        const secretKey = Buffer.from(key, 'utf-8');
        const ivs = Buffer.alloc(16, '0'); // Initialization vector
        const decipher = crypto.createDecipheriv('aes-256-cbc', secretKey, ivs);
        let decryptedData = decipher.update(data, 'base64', 'utf-8');
        decryptedData += decipher.final('utf-8');
        return decryptedData;
    } catch (error) {
        return error;
    }

}

function getTxn() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Get last two digits of the year
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Month is zero-based
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    const timeStamp = `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
    const random = generateRandomInteger(10);
    console.log(random, "Random");
    const txn = `${timeStamp}${random}pmg`;
    return txn;
}

function generateRandomInteger(digits) {
    const min = Math.pow(10, digits - 1); // Minimum value with the specified number of digits
    const max = Math.pow(10, digits) - 1; // Maximum value with the specified number of digits
    const randomBuffer = crypto.randomBytes(Math.ceil(digits / 2)); // Generate random bytes
    const randomNumber = parseInt(randomBuffer.toString('hex'), 16); // Convert bytes to integer
    return randomNumber % (max - min + 1) + min; // Ensure the number falls within the desired range
}


module.exports = aadharS



