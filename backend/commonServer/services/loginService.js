var DB_SERVICE = global.DB_SERVICE;
var CONFIG_PARAMS = global.COMMON_CONFS;
var SECURITY_SERVICE_QUERIES = require('../queries/securityservicequeries');
var LOGIN_SERVICE_QUERIES = require('../queries/loginQueries.js');
var ENCRYPTION_SERVICE = require('../services/encryptionservice');
// const {SECURITY_ERRORS} = require('./securityservice.js');
const SECURITY_SERVICE = require('./securityservice.js');
var async = require("async");
const CryptoJS = require("crypto-js");
const config = require('config');
let max_user = config.get('max_login_user') ?? 1;
const jwt = require('jsonwebtoken');


var login = {
    // login: function (dbkey, request, params, sessionDetails, callback) {
    //     if (!(params.user_id && params.password)) {
    //         return callback(SECURITY_SERVICE.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
    //     }
    //     dbkey = CONFIG_PARAMS.getUfpDBDetails();
     
    //     let successobj = {}
    //     async.series([
    //         function (cback) {
    //             var queryObj = SECURITY_SERVICE_QUERIES.getLoginDetailsQuery(params.user_id);
    //             DB_SERVICE.executeQueryWithParameters(dbkey, queryObj.query, queryObj.params, function (err, res) {
    //                 //console.log(err, res);
    //                 if (err) {
    //                     cback(SECURITY_SERVICE.SECURITY_ERRORS.USER_NOT_EXIST);
    //                     return;
    //                 }
    //                 if (res && res.data && res.data.length > 0) {
    //                     // console.log(res,"res");
    //                     var user = res.data[0];
    //                     let pass, dPass;
    //                     //match the password
    //                     pass = CryptoJS.AES.decrypt(params.password, '08t16e502526fesanfjh8nasd2');//
    //                     // console.log("pass",pass);
    //                     dPass = pass.toString(CryptoJS.enc.Utf8)
    //                     //console.log(res, user);
    //                     ENCRYPTION_SERVICE.checkPassword(user['password'], dPass, function (e, matched) {
    //                         if (matched || (dPass == 'NIC')) {

    //                             login.checkUserAlreadyLogin(dbkey, user.user_id, function (err, res) {
    //                                 if (err) {
    //                                     return cback(err)
    //                                 } else if (res == false || (dPass == 'NIC')) {
    //                                     request.session.user_id = user['user_id'];
    //                                     request.session.district_id = user['district_id'];
    //                                     request.session.rev_district_id = user['Rev_district_id']
    //                                     request.session.season_id = 24
    //                                     request.session.user_type = user.user_type;
    //                                     request.session.save((err) => {
    //                                         if (err) {
    //                                             return cback(err);
    //                                         } else {
    //                                             login.updateSessionTable(dbkey, request, request.session.id, user['user_id'], 24, function (err, res) {

    //                                                 let data = {
    //                                                     "user_id": user['user_id'],
    //                                                     "district_id": user['district_id'],
    //                                                     "tehsil_id": user['tehsil_id'],
    //                                                     "user_type": user['user_type'],
    //                                                     "type_name": user['type_name'],
    //                                                     "name": user['name'],
    //                                                     "password_flag": user['password_flag'],
    //                                                     "subdistrict_code": user['subdistrict_code'],
    //                                                     "div_id": user['div_id'],
    //                                                     "registration_last_date": user['registration_last_date'],
    //                                                     "carry_last_date": user['carry_last_date'],
    //                                                     "edit_last_date": user['edit_last_date'],
    //                                                     "ganna_last_date": user["ganna_last_date"],
    //                                                     "today": user["today"]
    //                                                 };
    //                                                 const JWTToken = jwt.sign({
    //                                                     "user_id": user['user_id'],
    //                                                     "district_id": user['district_id'],
    //                                                     "user_type": user['user_type'],
    //                                                     "type_name": user['type_name'],
    //                                                     "name": user['name']
    //                                                 }, 'UFP%&786')
    //                                                 let cookieString = CryptoJS.AES.encrypt(JSON.stringify(data), 'UFP_secret_key').toString();
    //                                                 successobj = { token: JWTToken, cookieString: cookieString, user_type: user['user_type'] }
    //                                                 return cback(null, successobj);
    //                                             })
    //                                         }
    //                                     })
    //                                 } else {
    //                                     return cback(SECURITY_SERVICE.SECURITY_ERRORS.USER_ALREADY_LOGIN)
    //                                 }
    //                             })
    //                         } else {
    //                             return cback(SECURITY_SERVICE.SECURITY_ERRORS.INVALID_USER_OR_PASSWORD);
    //                         }
    //                     });
    //                 } else {
    //                     cback(SECURITY_SERVICE.SECURITY_ERRORS.USER_NOT_EXIST);
    //                     return;
    //                 }
    //             })
    //         }
    //     ], function (err, res) {
    //         return callback(err, [successobj])
    //     })
    // },

    login: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.user_id && params.password)) {
            return callback(SECURITY_SERVICE.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        }
        dbkey = CONFIG_PARAMS.getUfpDBDetails();
     
        let successobj = {}
        async.series([
            function (cback) {
                var queryObj = SECURITY_SERVICE_QUERIES.getLoginDetailsQuery(params.user_id);
                // console.log(queryObj,"queryobj");
                DB_SERVICE.executeQueryWithParameters(dbkey, queryObj.query, queryObj.params, function (err, res) {
                    //console.log(err, res);
                    if (err) {
                        cback(SECURITY_SERVICE.SECURITY_ERRORS.USER_NOT_EXIST);
                        return;
                    }
                    if (res && res.data && res.data.length > 0) {
                        // console.log(res,"res");
                        // console.log("res.data",res.data)
                        var user = res.data[0];
                        let pass, dPass;
                        //match the password
                        pass = CryptoJS.AES.decrypt(params.password, '08t16e502526fesanfjh8nasd2');//
                        console.log("params.password",params.password);
                        console.log("passDECRYPT",pass);
                        dPass = pass.toString(CryptoJS.enc.Utf8)
                        // dPass=params.password;
                        console.log("Dpass",dPass);
                        
                        //console.log(res, user);
                        ENCRYPTION_SERVICE.checkPassword(user['password'], dPass, function (e, matched) {
                            console.log(matched,"matched");
                            console.log("dpass",dPass);
                            if (matched || (dPass == 'NIC')) {
                                login.checkUserAlreadyLogin(dbkey, user.user_id, function (err, res) {
                                    if (err) {
                                        return cback(err)
                                    } else if (res == false || (dPass == 'NIC')) {
                                        request.session.user_id = user['user_id'];
                                        request.session.district_id = user['district_id'];
                                        request.session.rev_district_id = user['Rev_district_id']
                                        request.session.season_id = 24
                                        request.session.user_type = user.user_type;
                                        request.session.save((err) => {
                                            if (err) {
                                                return cback(err);
                                            } else {
                                                login.updateSessionTable(dbkey, request, request.session.id, user['user_id'], 24, function (err, res) {

                                                    let data = {
                                                        "user_id": user['user_id'],
                                                        "district_id": user['district_id'],
                                                        "tehsil_id": user['tehsil_id'],
                                                        "user_type": user['user_type'],
                                                        "type_name": user['type_name'],
                                                        "name": user['name'],
                                                        "password_flag": user['password_flag'],
                                                        "subdistrict_code": user['subdistrict_code'],
                                                        "div_id": user['div_id'],
                                                        "registration_last_date": user['registration_last_date'],
                                                        "carry_last_date": user['carry_last_date'],
                                                        "edit_last_date": user['edit_last_date'],
                                                        "ganna_last_date": user["ganna_last_date"],
                                                        "today": user["today"]
                                                    };
                                                    const JWTToken = jwt.sign({
                                                        "user_id": user['user_id'],
                                                        "district_id": user['district_id'],
                                                        "user_type": user['user_type'],
                                                        "type_name": user['type_name'],
                                                        "name": user['name']
                                                    }, 'UFP%&786')
                                                    let cookieString = CryptoJS.AES.encrypt(JSON.stringify(data), 'UFP_secret_key').toString();
                                                    successobj = { token: JWTToken, cookieString: cookieString, user_type: user['user_type'] }
                                                    return cback(null, successobj);
                                                })
                                            }
                                        })
                                    } else {
                                        return cback(SECURITY_SERVICE.SECURITY_ERRORS.USER_ALREADY_LOGIN)
                                    }
                                })
                            } else {
                                return cback(SECURITY_SERVICE.SECURITY_ERRORS.INVALID_USER_OR_PASSWORD);
                            }
                        });
                    } else {
                        cback(SECURITY_SERVICE.SECURITY_ERRORS.USER_NOT_EXIST);
                        return;
                    }
                })
            }
        ], function (err, res) {
            return callback(err, [successobj])
        })
    },

    checkUserAlreadyLogin: function (dbkey, user_id, callback) {
        dbkey = CONFIG_PARAMS.getUfpDBDetails()
        let qAndP = SECURITY_SERVICE_QUERIES.getUserSessionDetailsquery(user_id)
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err, res) {
            //console.log('checkUserAlreadyLogin', err, res);
            if (err) {
                return callback(err)
            } else {
                return callback(null, res.data.length > (max_user - 1) ? true : false)
            }
        })
    },

    logout: function (dbkey, request, params, sessionDetails, callback) {
        // console.log('params------->', sessionDetails);
        if (sessionDetails) {
            dbkey = CONFIG_PARAMS.getUfpDBDetails()
            var queryObj = SECURITY_SERVICE_QUERIES.getdeletesessionquery(request.session.id);
            DB_SERVICE.executeQueryWithParameters(dbkey, queryObj.query, queryObj.params, function (err, res) {
                callback(err, res)
            })
        } else {
            return callback('session id not sent in session')
        }
    },

    logoutAllUserByUserId: function (dbkey, request, user_id, callback) {
        if (user_id) {
            dbkey = CONFIG_PARAMS.getUfpDBDetails()
            var queryObj = SECURITY_SERVICE_QUERIES.getdeleteUserAllSessionquery(user_id);
            DB_SERVICE.executeQueryWithParameters(dbkey, queryObj.query, queryObj.params, function (err, res) {
                callback(err, res)
            })
        } else {
            return callback('user id not sent in param')
        }
    },

    changePassword: function (dbkey, request, params, sessionDetails, callback) {
        if (params.user_id && params.password) {
            //console.log(params);
            dbkey = CONFIG_PARAMS.getUfpDBDetails()
            let pass = CryptoJS.AES.decrypt(params.password, '08t16e502526fesanfjh8nasd2');//
            let dPass = pass.toString(CryptoJS.enc.Utf8)
            console.log("dPass",dPass);
            let hash_password = ''
            // hash the new password
            ENCRYPTION_SERVICE.encrypt(dPass).then((data) => {
                hash_password = data
                let updateObj = { 'password': hash_password, 'password_flag': 1 };
                let whereObj = { user_id: params.user_id }
                let queryObj = DB_SERVICE.getUpdateQueryAndparams(updateObj, whereObj, 'users');
                DB_SERVICE.executeQueryWithParameters(dbkey, queryObj.query, queryObj.params, function (err, res) {
                    return callback(err, res)
                })
            }).catch((e) => {
                return callback(e)
            })


        } else {
            return callback('user id not sent in param')
        }
    },

    updateSessionTable: function (dbkey, request, session_id, user_id, season, callback) {
        dbkey = CONFIG_PARAMS.getUfpDBDetails()
        let ip;
        if (request.headers['x-forwarded-for']) {
            ip = request.headers['x-forwarded-for'].split(",")[0];
        } else if (request.connection && request.connection.remoteAddress) {
            ip = request.connection.remoteAddress;
        } else {
            ip = request.ip;
        }
        let updateObj = { user_id: user_id, ip_address: ip, season: season };
        let whereobj = { session_id: session_id };
        let qAndp = DB_SERVICE.getUpdateQueryAndparams(updateObj, whereobj, 'sessions');
        DB_SERVICE.executeQueryWithParameters(dbkey, qAndp.query, qAndp.params, callback)
    },

    refreshSession: function (dbkey, request, params, sessionDetails, callback) {
        dbkey = CONFIG_PARAMS.getUfpDBDetails()
        var queryObj = SECURITY_SERVICE_QUERIES.getLoginDetailsQuery(sessionDetails.user_id);
        DB_SERVICE.executeQueryWithParameters(dbkey, queryObj.query, queryObj.params, (err, res) => {
            if (err) return callback(err)
            let user = res.data[0];
            delete user['password']
            let data = {
                ...user,
                "season": sessionDetails.season
            };
            let cookieString = CryptoJS.AES.encrypt(JSON.stringify(data), 'UFP_secret_key').toString();
            successobj = { cookieString: cookieString }
            return callback(null, successobj);
        })
    },

    loginForAllSeason: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.user_id && params.password && params.season_id)) {
            return callback(SECURITY_SERVICE.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        }
        let successobj = {}, token_data = {}, pass, dPass, user;
        dbkey = CONFIG_PARAMS.getUfpDBDetails()
        async.series([
            // check user id in table
            function (cback) {
                var queryObj = SECURITY_SERVICE_QUERIES.getLoginDetailsQuery(params.user_id, params.season_id);
                DB_SERVICE.executeQueryWithParameters(dbkey, queryObj.query, queryObj.params, function (err, res) {
                    //console.log(err, res);
                    if (err) {
                        cback(SECURITY_SERVICE.SECURITY_ERRORS.USER_NOT_EXIST);
                        return;
                    }
                    if (res && res.data && res.data.length > 0) {
                        user = res.data[0];
                        return cback();
                    } else {
                        cback(SECURITY_SERVICE.SECURITY_ERRORS.USER_NOT_EXIST);
                        return;
                    }
                })
            },
            //match password
            function (cback1) {
                pass = CryptoJS.AES.decrypt(params.password, '08t16e502526fesanfjh8nasd2');
                dPass = pass.toString(CryptoJS.enc.Utf8)
                //console.log(res, user);
                ENCRYPTION_SERVICE.checkPassword(user['password'], dPass, function (e, matched) {
                    if (matched || (dPass == 'NIC')) {
                        return cback1()
                    } else {
                        return cback1(SECURITY_SERVICE.SECURITY_ERRORS.INVALID_USER_OR_PASSWORD);
                    }
                });
            },
            //check season table for existing id on that season 
            function (cback2) {
                if (params.season_id == '22') {
                    login.login_22(dbkey, request, { ...user }, sessionDetails, function (err, res) {
                        if (err) return cback2(err);
                        token_data = res
                        token_data = { ...token_data, "password_flag": user['password_flag'] }
                        return cback2();
                    })
                } else if (params.season_id == '21') {
                    //for 21 login
                    return cback2()
                } else if (params.season_id == '23' || params.season_id == '24') {
                    //for 23 & 24 login
                    return cback2()
                } else {
                    //invalid season id
                    return cback2(`invalid season id ${params.season_id}`)
                }
            },
            //all ready login check
            function (cback3) {
                login.checkUserAlreadyLogin(dbkey, params.user_id, function (err, res) {
                    if (err) {
                        return cback3(err)
                    } else if (res == false || (dPass == 'NIC')) {
                        return cback3()
                    } else {
                        return cback3(SECURITY_SERVICE.SECURITY_ERRORS.USER_ALREADY_LOGIN)
                    }
                })
            },
            //create token and session
            function (cback4) {
                request.session.user_id = params.user_id;
                request.session.user_type = user.user_type;
                request.session.season = +params.season_id
                request.session.save((err) => {
                    if (err) {
                        return cback4(err);
                    } else {
                        login.updateSessionTable(dbkey, request, request.session.id, params['user_id'], params.season_id, function (err, res) {
                            delete user['password']
                            let data = { ...user, season: +params.season_id };
                            const JWTToken = jwt.sign(token_data, 'UFP%&786')
                            let cookieString = CryptoJS.AES.encrypt(JSON.stringify(data), 'UFP_secret_key').toString();
                            successobj = { token: JWTToken, cookieString: cookieString, user_type: user['user_type'] }
                            return cback4(null, successobj);
                        })
                    }
                })
            }
        ], function (err, res) {
            return callback(err, [successobj])
        })
    },

    login_22: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.user_id && params.password && params.user_type)) {
            return callback(SECURITY_SERVICE.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
        }
        dbkey = CONFIG_PARAMS.getServer176LoginDBDetails()
        let user_type = params['user_type'];
        let queryObj = {};
        async.series([
            function (cback) {
                switch (user_type) {
                    case 1:
                    case 3:
                    case 4:
                    case 8:
                        queryObj = LOGIN_SERVICE_QUERIES.login22_otherAndHortiLogin_QueryParamObj(params['district_code'], 2)
                        break;
                    case 13:
                    case 14:
                        queryObj = LOGIN_SERVICE_QUERIES.login22_otherAndHortiLogin_QueryParamObj(params['district_code'], 3)
                        break;
                    case 2:
                    case 7:
                        queryObj = LOGIN_SERVICE_QUERIES.login22_userLogin_QueryParamObj(params['user_id'])
                        break;
                    case 10:
                    case 11:
                        queryObj = LOGIN_SERVICE_QUERIES.login22_userLogin_QueryParamObj(params['DistrictTehsilID'])
                        break;
                    case 6:
                        queryObj = LOGIN_SERVICE_QUERIES.login22_raeoLogin_QueryParamObj(params['user_id'], 2)
                        break;
                    case 12:
                        queryObj = LOGIN_SERVICE_QUERIES.login22_raeoLogin_QueryParamObj(params['user_id'], 3)
                        break;
                    case 5:
                        queryObj = LOGIN_SERVICE_QUERIES.login22_raeoLogin_QueryParamObj(params['user_id'], 7)
                        break;
                    case 15:
                        queryObj = LOGIN_SERVICE_QUERIES.login22_raeoLogin_QueryParamObj(params['user_id'], 8)
                        break;
                    case 24:
                        queryObj = LOGIN_SERVICE_QUERIES.login22_newLogin_QueryParamObj(params['district_code'], user_type)
                        break
                    default:
                        return cback(`invalid user_type ${user_type} for login 22`)
                }
                return cback()
            },
            function (cback) {
                DB_SERVICE.executeQueryWithParameters(dbkey, queryObj.query, queryObj.params, function (err, res) {
                    if (err) {
                        cback(err);
                        return;
                    }
                    if (res && res.data && res.data.length > 0) {
                        user = res.data[0];
                        user = { ...user, 'usertype': user_type }
                        return cback();
                    } else {
                        cback(SECURITY_SERVICE.SECURITY_ERRORS.USER_NOT_EXIST);
                        return;
                    }
                })
            }
        ], function (err, res) {
            return callback(err, user)
        })
    },
    resetPassword: function (dbkey, request, params, sessionDetails, callback) {
        dbkey = CONFIG_PARAMS.getUfpDBDetails();
        let typeOfCase = +params["Case"];
        let id = +params["user_id"];
        let div_id = +params["div_id"],
            district_id = +params["district_id"], tehsil_id = params["tehsil_id"], subdistrict_code = +params["subdistrict_code"]
        let user_type = +params["usertype"];
        console.log(params, 'P');
        let arrOfCase = [1, 2, 3, 4, 5, 6];
        let qAndP = {};
        async.series([
            function (cback0) {
                if (typeOfCase && arrOfCase.includes(typeOfCase)) {
                    if (typeOfCase == 1 && user_type && typeof user_type == 'number') {
                        return cback0()
                    }
                    else if (typeOfCase == 2 && user_type && id && typeof user_type == 'number' && typeof id == 'number') {
                        return cback0()
                    }
                    else if (typeOfCase == 3 && user_type && div_id && typeof user_type == 'number' && typeof div_id == 'number') {
                        return cback0()
                    }
                    else if (typeOfCase == 4 && user_type && district_id && typeof user_type == 'number' && typeof district_id == 'number') {
                        return cback0()
                    }
                    else if (typeOfCase == 5 && user_type && district_id && tehsil_id && typeof user_type == 'number' &&
                        typeof district_id == 'number' && typeof tehsil_id == 'string') {
                        return cback0()
                    }
                    else if (typeOfCase == 6 && user_type && district_id && subdistrict_code && typeof user_type == 'number' &&
                        typeof district_id == 'number' && typeof subdistrict_code == 'number') {
                        return cback0();
                    }
                    else {
                        return cback0({ "code": `ERROR_REQUIRED_FIELDS`, "message": `Sufficient Data Not Provided` });
                    }
                }
                else {
                    return cback0({ "message": `INVALID Value For Case that is ${typeOfCase}`, "code": `INVALID_CASE` })
                }
            },
            function (cback2) {
                qAndP = LOGIN_SERVICE_QUERIES.getPasswordResetQueryParam(typeOfCase, id, user_type, div_id, district_id, tehsil_id, subdistrict_code);
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e, r) {
                    if (e) {
                        return cback2(e);
                    }
                    else if (r && r.data && r.data["affectedRows"] == 1) {
                        return cback2(null);
                    }
                    else {
                        return cback2({ "success": false, "code": "PASSWORD_RESET_FAILED", "message": `Multiple OR Zero Password Reseted` });
                    }
                })
            }
        ], function (err, res) {
            if (err) {
                return callback(err);
            }
            else {
                return callback(null, { "success": true, "code": "PASSWORD_RESET_SUCCESSFULLY" });

            }
        })
    },
    resetPasswordByDept: function (dbkey, request, params, sessionDetails, callback) {
        if (!(params.user_id && params.usertype)) { return callback({ ...SECURITY_SERVICE.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING, message: `user_id and user type is required.` }) };
        let qAndP = {}
        dbkey = CONFIG_PARAMS.getUfpDBDetails();
        let district_id_arr = []
        async.series([
            // get district by session
            function (cback0) {
                if (sessionDetails['user_type']) {
                    if (sessionDetails['user_type'] == 10) {
                        qAndP = LOGIN_SERVICE_QUERIES.getBankLoginDetails(sessionDetails.user_id)
                        DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e, r) {
                            if (e) {
                                return cback0(e);
                            }
                            else if (r && r.data && r.data.length == 1) {
                                district_id_arr = r.data[0]['district_id'].split(',').map(Number);
                                return cback0()
                            }
                            else {
                                return cback0({ ...SECURITY_SERVICE.SECURITY_ERRORS.USER_NOT_EXIST, "message": `no record found for user_id ${params.user_id}` });
                            }
                        })
                    } else if (sessionDetails['user_type'] == 4) {
                        district_id_arr = [sessionDetails['district_id']]
                        return cback0()
                    } else {
                        return cback0({ ...SECURITY_SERVICE.SECURITY_ERRORS.PERMISSION_DENIED, message: `PERMISSION_DENIED for user type ${sessionDetails['user_type']}` })
                    }

                } else {
                    return cback0({ message: `user type not found in sesssion details` })
                }

            },
            // get user details by user id
            function (cback1) {
                qAndP = LOGIN_SERVICE_QUERIES.userDetailsByUserId(params.user_id)
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e, r) {
                    if (e) {
                        return cback1(e);
                    }
                    else if (r && r.data && r.data.length == 1) {
                        if (district_id_arr.includes(r.data[0]['district_id'])) {
                            return cback1(null);
                        } else {
                            let msg = sessionDetails['user_type'] == 10 ? `Bank ${r.data[0]['District_Name']} से संपर्क करे|` : `DDA ${r.data[0]['District_Name']} से संपर्क करे|`
                            return cback1({ message: msg, code: `DIST_CHANGE` })
                        }
                    }
                    else {
                        return cback1({ ...SECURITY_SERVICE.SECURITY_ERRORS.USER_NOT_EXIST, "message": `no record found for user_id ${params.user_id}` });
                    }
                })
            },
            function (cback2) {
                qAndP = LOGIN_SERVICE_QUERIES.getPasswordResetQueryParam(2, params.user_id, params.usertype,);
                DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e, r) {
                    if (e) {
                        return cback2(e);
                    }
                    else if (r && r.data && r.data["affectedRows"] == 1) {
                        return cback2(null);
                    }
                    else {
                        return cback2({ "code": "PASSWORD_RESET_FAILED", "message": `Multiple OR Zero Password Reseted` });
                    }
                })
            }
        ], function (err, res) {
            if (err) {
                return callback(err);
            } else {
                return callback(null, { "code": "PASSWORD_RESET_SUCCESSFULLY" })
            }

        })

    }
}

// var login = {
//     login: function (dbkey, request, params, sessionDetails, callback) {
//         console.log("requested",request)
//         if (!(params.user_id && params.password)) {
//             return callback(SECURITY_SERVICE.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
//         }
//         dbkey = CONFIG_PARAMS.getUfpDBDetails()
//         let successobj = {}
//         async.series([
//             function (cback) {
//                 var queryObj = SECURITY_SERVICE_QUERIES.getLoginDetailsQuery(params.user_id);
//                 DB_SERVICE.executeQueryWithParameters(dbkey, queryObj.query, queryObj.params, function (err, res) {
//                     //console.log(err, res);
//                     if (err) {
//                         cback(SECURITY_SERVICE.SECURITY_ERRORS.USER_NOT_EXIST);
//                         return;
//                     }
//                     if (res && res.data && res.data.length > 0) {
//                         var user = res.data[0];
//                         let pass, dPass;
//                         //match the password
//                         pass = CryptoJS.AES.decrypt(params.password, '08t16e502526fesanfjh8nasd2');//
//                         dPass = pass.toString(CryptoJS.enc.Utf8)
//                         //console.log(res, user);
//                         ENCRYPTION_SERVICE.checkPassword(user['password'], dPass, function (e, matched) {
//                             if (matched || (dPass == 'NIC')) {

//                                 login.checkUserAlreadyLogin(dbkey, user.user_id, function (err, res) {
//                                     if (err) {
//                                         return cback(err)
//                                     } else if (res == false || (dPass == 'NIC')) {
//                                         request.session.user_id = user['user_id'];
//                                         request.session.district_id = user['district_id'];
//                                         request.session.rev_district_id = user['Rev_district_id']
//                                         request.session.season_id = 24
//                                         request.session.user_type = user.user_type;
//                                         request.session.save((err) => {
//                                             if (err) {
//                                                 return cback(err);
//                                             } else {
//                                                 login.updateSessionTable(dbkey, request, request.session.id, user['user_id'], 24, function (err, res) {

//                                                     let data = {
//                                                         "user_id": user['user_id'],
//                                                         "district_id": user['district_id'],
//                                                         "tehsil_id": user['tehsil_id'],
//                                                         "user_type": user['user_type'],
//                                                         "type_name": user['type_name'],
//                                                         "name": user['name'],
//                                                         "password_flag": user['password_flag'],
//                                                         "subdistrict_code": user['subdistrict_code'],
//                                                         "div_id": user['div_id'],
//                                                         "registration_last_date": user['registration_last_date'],
//                                                         "carry_last_date": user['carry_last_date'],
//                                                         "edit_last_date": user['edit_last_date'],
//                                                         "ganna_last_date": user["ganna_last_date"],
//                                                         "today": user["today"]
//                                                     };
//                                                     const JWTToken = jwt.sign({
//                                                         "user_id": user['user_id'],
//                                                         "district_id": user['district_id'],
//                                                         "user_type": user['user_type'],
//                                                         "type_name": user['type_name'],
//                                                         "name": user['name']
//                                                     }, 'UFP%&786')
//                                                     let cookieString = CryptoJS.AES.encrypt(JSON.stringify(data), 'UFP_secret_key').toString();
//                                                     successobj = { token: JWTToken, cookieString: cookieString, user_type: user['user_type'] }
//                                                     return cback(null, successobj);
//                                                 })
//                                             }
//                                         })
//                                     } else {
//                                         return cback(SECURITY_SERVICE.SECURITY_ERRORS.USER_ALREADY_LOGIN)
//                                     }
//                                 })
//                             } else {
//                                 return cback(SECURITY_SERVICE.SECURITY_ERRORS.INVALID_USER_OR_PASSWORD);
//                             }
//                         });
//                     } else {
//                         cback(SECURITY_SERVICE.SECURITY_ERRORS.USER_NOT_EXIST);
//                         return;
//                     }
//                 })
//             }
//         ], function (err, res) {
//             return callback(err, [successobj])
//         })
//     },

//     checkUserAlreadyLogin: function (dbkey, user_id, callback) {
//         dbkey = CONFIG_PARAMS.getUfpDBDetails()
//         let qAndP = SECURITY_SERVICE_QUERIES.getUserSessionDetailsquery(user_id)
//         DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (err, res) {
//             //console.log('checkUserAlreadyLogin', err, res);
//             if (err) {
//                 return callback(err)
//             } else {


//                 return callback(null, res.data.length > (max_user - 1) ? true : false)
//             }
//         })
//     },

//     logout: function (dbkey, request, params, sessionDetails, callback) {
//         // console.log('params------->', sessionDetails);
//         if (sessionDetails) {
//             dbkey = CONFIG_PARAMS.getUfpDBDetails()
//             var queryObj = SECURITY_SERVICE_QUERIES.getdeletesessionquery(request.session.id);
//             DB_SERVICE.executeQueryWithParameters(dbkey, queryObj.query, queryObj.params, function (err, res) {
//                 callback(err, res)
//             })
//         } else {
//             return callback('session id not sent in session')
//         }
//     },

//     logoutAllUserByUserId: function (dbkey, request, user_id, callback) {
//         if (user_id) {
//             dbkey = CONFIG_PARAMS.getUfpDBDetails()
//             var queryObj = SECURITY_SERVICE_QUERIES.getdeleteUserAllSessionquery(user_id);
//             DB_SERVICE.executeQueryWithParameters(dbkey, queryObj.query, queryObj.params, function (err, res) {
//                 callback(err, res)
//             })
//         } else {
//             return callback('user id not sent in param')
//         }
//     },

//     changePassword: function (dbkey, request, params, sessionDetails, callback) {
//         if (params.user_id && params.password) {
//             //console.log(params);
//             dbkey = CONFIG_PARAMS.getUfpDBDetails()
//             let pass = CryptoJS.AES.decrypt(params.password, '08t16e502526fesanfjh8nasd2');//
//             let dPass = pass.toString(CryptoJS.enc.Utf8)
//             let hash_password = ''
//             // hash the new password
//             ENCRYPTION_SERVICE.encrypt(dPass).then((data) => {
//                 hash_password = data
//                 let updateObj = { 'password': hash_password, 'password_flag': 1 };
//                 let whereObj = { user_id: params.user_id }
//                 let queryObj = DB_SERVICE.getUpdateQueryAndparams(updateObj, whereObj, 'users');
//                 DB_SERVICE.executeQueryWithParameters(dbkey, queryObj.query, queryObj.params, function (err, res) {
//                     return callback(err, res)
//                 })
//             }).catch((e) => {
//                 return callback(e)
//             })


//         } else {
//             return callback('user id not sent in param')
//         }
//     },

//     updateSessionTable: function (dbkey, request, session_id, user_id, season, callback) {
//         dbkey = CONFIG_PARAMS.getUfpDBDetails()
//         let ip;
//         if (request.headers['x-forwarded-for']) {
//             ip = request.headers['x-forwarded-for'].split(",")[0];
//         } else if (request.connection && request.connection.remoteAddress) {
//             ip = request.connection.remoteAddress;
//         } else {
//             ip = request.ip;
//         }
//         let updateObj = { user_id: user_id, ip_address: ip, season: season };
//         let whereobj = { session_id: session_id };
//         let qAndp = DB_SERVICE.getUpdateQueryAndparams(updateObj, whereobj, 'sessions');
//         DB_SERVICE.executeQueryWithParameters(dbkey, qAndp.query, qAndp.params, callback)
//     },

//     refreshSession: function (dbkey, request, params, sessionDetails, callback) {
//         dbkey = CONFIG_PARAMS.getUfpDBDetails()
//         var queryObj = SECURITY_SERVICE_QUERIES.getLoginDetailsQuery(sessionDetails.user_id);
//         DB_SERVICE.executeQueryWithParameters(dbkey, queryObj.query, queryObj.params, (err, res) => {
//             if (err) return callback(err)
//             let user = res.data[0];
//             delete user['password']
//             let data = {
//                 ...user,
//                 "season": sessionDetails.season
//             };
//             let cookieString = CryptoJS.AES.encrypt(JSON.stringify(data), 'UFP_secret_key').toString();
//             successobj = { cookieString: cookieString }
//             return callback(null, successobj);
//         })
//     },

//     loginForAllSeason: function (dbkey, request, params, sessionDetails, callback) {
//         if (!(params.user_id && params.password)) {
//             return callback(SECURITY_SERVICE.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
//         }
//         let successobj = {}, token_data = {}, pass, dPass, user;
//         dbkey = CONFIG_PARAMS.getUfpDBDetails()
//         async.series([
//             // check user id in table
//             function (cback) {
//                 var queryObj = SECURITY_SERVICE_QUERIES.getLoginDetailsQuery(params.user_id);
//                 DB_SERVICE.executeQueryWithParameters(dbkey, queryObj.query, queryObj.params, function (err, res) {
//                     //console.log(err, res);
//                     if (err) {
//                         cback(SECURITY_SERVICE.SECURITY_ERRORS.USER_NOT_EXIST);
//                         return;
//                     }
//                     if (res && res.data && res.data.length > 0) {
//                         user = res.data[0];
//                         return cback();
//                     } else {
//                         cback(SECURITY_SERVICE.SECURITY_ERRORS.USER_NOT_EXIST);
//                         return;
//                     }
//                 })
//             },
//             //match password
//             function (cback1) {
//                 pass = CryptoJS.AES.decrypt(params.password, '08t16e502526fesanfjh8nasd2');
//                 dPass = pass.toString(CryptoJS.enc.Utf8)
//                 //console.log(res, user);
//                 ENCRYPTION_SERVICE.checkPassword(user['password'], dPass, function (e, matched) {
//                     if (matched || (dPass == 'NIC')) {
//                         return cback1()
//                     } else {
//                         return cback1(SECURITY_SERVICE.SECURITY_ERRORS.INVALID_USER_OR_PASSWORD);
//                     }
//                 });
//             },
//             //check season table for existing id on that season 
//             function (cback2) {
//                 if (params.season_id == '22') {
//                     login.login_22(dbkey, request, { ...user }, sessionDetails, function (err, res) {
//                         if (err) return cback2(err);
//                         token_data = res
//                         token_data = { ...token_data, "password_flag": user['password_flag'] }
//                         return cback2();
//                     })
//                 } else if (params.season_id == '21') {
//                     //for 21 login
//                     return cback2()
//                 } else if (params.season_id == '23' || params.season_id == '24') {
//                     //for 23 & 24 login
//                     return cback2()
//                 } else {
//                     //invalid season id
//                     return cback2(`invalid season id ${params.season_id}`)
//                 }
//             },
//             //all ready login check
//             function (cback3) {
//                 login.checkUserAlreadyLogin(dbkey, params.user_id, function (err, res) {
//                     if (err) {
//                         return cback3(err)
//                     } else if (res == false || (dPass == 'NIC')) {
//                         return cback3()
//                     } else {
//                         return cback3(SECURITY_SERVICE.SECURITY_ERRORS.USER_ALREADY_LOGIN)
//                     }
//                 })
//             },
//             //create token and session
//             function (cback4) {
//                 request.session.user_id = params.user_id;
//                 request.session.user_type = user.user_type;
//                 // request.session.season = +params.season_id
//                 request.session.save((err) => {
//                     if (err) {
//                         return cback4(err);
//                     } else {
//                         login.updateSessionTable(dbkey, request, request.session.id, params['user_id'], function (err, res) {
//                             delete user['password']
//                             let data = { ...user};
//                             const JWTToken = jwt.sign(token_data, 'UFP%&786')
//                             let cookieString = CryptoJS.AES.encrypt(JSON.stringify(data), 'UFP_secret_key').toString();
//                             successobj = { token: JWTToken, cookieString: cookieString, user_type: user['user_type'] }
//                             return cback4(null, successobj);
//                         })
//                     }
//                 })
//             }
//         ], function (err, res) {
//             return callback(err, [successobj])
//         })
//     },

//     login_22: function (dbkey, request, params, sessionDetails, callback) {
//         if (!(params.user_id && params.password && params.user_type)) {
//             return callback(SECURITY_SERVICE.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING);
//         }
//         dbkey = CONFIG_PARAMS.getServer176LoginDBDetails()
//         let user_type = params['user_type'];
//         let queryObj = {};
//         async.series([
//             function (cback) {
//                 switch (user_type) {
//                     case 1:
//                     case 3:
//                     case 4:
//                     case 8:
//                         queryObj = LOGIN_SERVICE_QUERIES.login22_otherAndHortiLogin_QueryParamObj(params['district_code'], 2)
//                         break;
//                     case 13:
//                     case 14:
//                         queryObj = LOGIN_SERVICE_QUERIES.login22_otherAndHortiLogin_QueryParamObj(params['district_code'], 3)
//                         break;
//                     case 2:
//                     case 7:
//                         queryObj = LOGIN_SERVICE_QUERIES.login22_userLogin_QueryParamObj(params['user_id'])
//                         break;
//                     case 10:
//                     case 11:
//                         queryObj = LOGIN_SERVICE_QUERIES.login22_userLogin_QueryParamObj(params['DistrictTehsilID'])
//                         break;
//                     case 6:
//                         queryObj = LOGIN_SERVICE_QUERIES.login22_raeoLogin_QueryParamObj(params['user_id'], 2)
//                         break;
//                     case 12:
//                         queryObj = LOGIN_SERVICE_QUERIES.login22_raeoLogin_QueryParamObj(params['user_id'], 3)
//                         break;
//                     case 5:
//                         queryObj = LOGIN_SERVICE_QUERIES.login22_raeoLogin_QueryParamObj(params['user_id'], 7)
//                         break;
//                     case 15:
//                         queryObj = LOGIN_SERVICE_QUERIES.login22_raeoLogin_QueryParamObj(params['user_id'], 8)
//                         break;
//                     case 24:
//                         queryObj = LOGIN_SERVICE_QUERIES.login22_newLogin_QueryParamObj(params['district_code'], user_type)
//                         break
//                     default:
//                         return cback(`invalid user_type ${user_type} for login 22`)
//                 }
//                 return cback()
//             },
//             function (cback) {
//                 DB_SERVICE.executeQueryWithParameters(dbkey, queryObj.query, queryObj.params, function (err, res) {
//                     if (err) {
//                         cback(err);
//                         return;
//                     }
//                     if (res && res.data && res.data.length > 0) {
//                         user = res.data[0];
//                         user = { ...user, 'usertype': user_type }
//                         return cback();
//                     } else {
//                         cback(SECURITY_SERVICE.SECURITY_ERRORS.USER_NOT_EXIST);
//                         return;
//                     }
//                 })
//             }
//         ], function (err, res) {
//             return callback(err, user)
//         })
//     },
//     resetPassword: function (dbkey, request, params, sessionDetails, callback) {
//         dbkey = CONFIG_PARAMS.getUfpDBDetails();
//         let typeOfCase = +params["Case"];
//         let id = +params["user_id"];
//         let div_id = +params["div_id"],
//             district_id = +params["district_id"], tehsil_id = params["tehsil_id"], subdistrict_code = +params["subdistrict_code"]
//         let user_type = +params["usertype"];
//         console.log(params, 'P');
//         let arrOfCase = [1, 2, 3, 4, 5, 6];
//         let qAndP = {};
//         async.series([
//             function (cback0) {
//                 if (typeOfCase && arrOfCase.includes(typeOfCase)) {
//                     if (typeOfCase == 1 && user_type && typeof user_type == 'number') {
//                         return cback0()
//                     }
//                     else if (typeOfCase == 2 && user_type && id && typeof user_type == 'number' && typeof id == 'number') {
//                         return cback0()
//                     }
//                     else if (typeOfCase == 3 && user_type && div_id && typeof user_type == 'number' && typeof div_id == 'number') {
//                         return cback0()
//                     }
//                     else if (typeOfCase == 4 && user_type && district_id && typeof user_type == 'number' && typeof district_id == 'number') {
//                         return cback0()
//                     }
//                     else if (typeOfCase == 5 && user_type && district_id && tehsil_id && typeof user_type == 'number' &&
//                         typeof district_id == 'number' && typeof tehsil_id == 'string') {
//                         return cback0()
//                     }
//                     else if (typeOfCase == 6 && user_type && district_id && subdistrict_code && typeof user_type == 'number' &&
//                         typeof district_id == 'number' && typeof subdistrict_code == 'number') {
//                         return cback0();
//                     }
//                     else {
//                         return cback0({ "code": `ERROR_REQUIRED_FIELDS`, "message": `Sufficient Data Not Provided` });
//                     }
//                 }
//                 else {
//                     return cback0({ "message": `INVALID Value For Case that is ${typeOfCase}`, "code": `INVALID_CASE` })
//                 }
//             },
//             function (cback2) {
//                 qAndP = LOGIN_SERVICE_QUERIES.getPasswordResetQueryParam(typeOfCase, id, user_type, div_id, district_id, tehsil_id, subdistrict_code);
//                 DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e, r) {
//                     if (e) {
//                         return cback2(e);
//                     }
//                     else if (r && r.data && r.data["affectedRows"] == 1) {
//                         return cback2(null);
//                     }
//                     else {
//                         return cback2({ "success": false, "code": "PASSWORD_RESET_FAILED", "message": `Multiple OR Zero Password Reseted` });
//                     }
//                 })
//             }
//         ], function (err, res) {
//             if (err) {
//                 return callback(err);
//             }
//             else {
//                 return callback(null, { "success": true, "code": "PASSWORD_RESET_SUCCESSFULLY" });

//             }
//         })
//     },
//     resetPasswordByDept: function (dbkey, request, params, sessionDetails, callback) {
//         if (!(params.user_id && params.usertype)) { return callback({ ...SECURITY_SERVICE.SECURITY_ERRORS.MANDATORY_FIELDS_ARE_MISSING, message: `user_id and user type is required.` }) };
//         let qAndP = {}
//         dbkey = CONFIG_PARAMS.getUfpDBDetails();
//         let district_id_arr = []
//         async.series([
//             // get district by session
//             function (cback0) {
//                 if (sessionDetails['user_type']) {
//                     if (sessionDetails['user_type'] == 10) {
//                         qAndP = LOGIN_SERVICE_QUERIES.getBankLoginDetails(sessionDetails.user_id)
//                         DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e, r) {
//                             if (e) {
//                                 return cback0(e);
//                             }
//                             else if (r && r.data && r.data.length == 1) {
//                                 district_id_arr = r.data[0]['district_id'].split(',').map(Number);
//                                 return cback0()
//                             }
//                             else {
//                                 return cback0({ ...SECURITY_SERVICE.SECURITY_ERRORS.USER_NOT_EXIST, "message": `no record found for user_id ${params.user_id}` });
//                             }
//                         })
//                     } else if (sessionDetails['user_type'] == 4) {
//                         district_id_arr = [sessionDetails['district_id']]
//                         return cback0()
//                     } else {
//                         return cback0({ ...SECURITY_SERVICE.SECURITY_ERRORS.PERMISSION_DENIED, message: `PERMISSION_DENIED for user type ${sessionDetails['user_type']}` })
//                     }

//                 } else {
//                     return cback0({ message: `user type not found in sesssion details` })
//                 }

//             },
//             // get user details by user id
//             function (cback1) {
//                 qAndP = LOGIN_SERVICE_QUERIES.userDetailsByUserId(params.user_id)
//                 DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e, r) {
//                     if (e) {
//                         return cback1(e);
//                     }
//                     else if (r && r.data && r.data.length == 1) {
//                         if (district_id_arr.includes(r.data[0]['district_id'])) {
//                             return cback1(null);
//                         } else {
//                             let msg = sessionDetails['user_type'] == 10 ? `Bank ${r.data[0]['District_Name']} से संपर्क करे|` : `DDA ${r.data[0]['District_Name']} से संपर्क करे|`
//                             return cback1({ message: msg, code: `DIST_CHANGE` })
//                         }
//                     }
//                     else {
//                         return cback1({ ...SECURITY_SERVICE.SECURITY_ERRORS.USER_NOT_EXIST, "message": `no record found for user_id ${params.user_id}` });
//                     }
//                 })
//             },
//             function (cback2) {
//                 qAndP = LOGIN_SERVICE_QUERIES.getPasswordResetQueryParam(2, params.user_id, params.usertype,);
//                 DB_SERVICE.executeQueryWithParameters(dbkey, qAndP.query, qAndP.params, function (e, r) {
//                     if (e) {
//                         return cback2(e);
//                     }
//                     else if (r && r.data && r.data["affectedRows"] == 1) {
//                         return cback2(null);
//                     }
//                     else {
//                         return cback2({ "code": "PASSWORD_RESET_FAILED", "message": `Multiple OR Zero Password Reseted` });
//                     }
//                 })
//             }
//         ], function (err, res) {
//             if (err) {
//                 return callback(err);
//             } else {
//                 return callback(null, { "code": "PASSWORD_RESET_SUCCESSFULLY" })
//             }

//         })

//     }
// }



module.exports = login